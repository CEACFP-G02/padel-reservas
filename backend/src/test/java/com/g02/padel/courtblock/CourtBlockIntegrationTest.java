package com.g02.padel.courtblock;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.OpeningHours;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.shared.enums.CourtType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Create → list → availability → delete through the real use cases and database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(username = "owner@padel.test", roles = "OWNER")
class CourtBlockIntegrationTest {

    private static final LocalDate DATE = LocalDate.now().plusDays(10);

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper json;
    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private ScheduleRepository scheduleRepository;
    @Autowired
    private com.g02.padel.user.UserRepository userRepository;

    private Court court;

    @BeforeEach
    void setUp() {
        court = new Court();
        court.setName("Court " + UUID.randomUUID());
        court.setType(CourtType.GLASS);
        court = courtRepository.save(court);
        var schedule = new Schedule();
        schedule.setCourt(court);
        schedule.setSlotMinutes(60);
        schedule.setPrice(new BigDecimal("16.00"));
        var hours = new OpeningHours();
        hours.setDayOfWeek(DATE.getDayOfWeek());
        hours.setOpenTime(LocalTime.of(8, 0));
        hours.setCloseTime(LocalTime.of(11, 0));
        schedule.addOpeningHours(hours);
        scheduleRepository.save(schedule);
    }

    private String body(String start, String end) {
        return "{ \"date\": \"%s\", \"start\": \"%s\", \"end\": \"%s\", \"reason\": \"Mantenimiento\" }"
                .formatted(DATE, start, end);
    }

    @Test
    void aBlockRemovesItsSlotsFromAvailabilityUntilItIsDeleted() throws Exception {
        String created = mvc.perform(post("/api/v1/courts/" + court.getId() + "/blocks")
                        .contentType(MediaType.APPLICATION_JSON).content(body("08:30", "09:00")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.courtId").value(court.getId()))
                .andExpect(jsonPath("$.reason").value("Mantenimiento"))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(created).get("id").asLong();

        mvc.perform(get("/api/v1/courts/" + court.getId() + "/blocks").param("from", DATE.toString()).param("to", DATE.toString()))
                .andExpect(jsonPath("$[*].id").value(contains((int) id)));
        mvc.perform(get("/api/v1/courts/" + court.getId() + "/availability").param("date", DATE.toString()))
                .andExpect(jsonPath("$.slots[*].available").value(contains(false, true, true)));

        mvc.perform(delete("/api/v1/court-blocks/" + id)).andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/courts/" + court.getId() + "/availability").param("date", DATE.toString()))
                .andExpect(jsonPath("$.slots[*].available").value(contains(true, true, true)));
        mvc.perform(delete("/api/v1/court-blocks/" + id)).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "integration-client@padel.test", roles = "CLIENT")
    void aBlockOverAConfirmedBookingIsAConflict() throws Exception {
        // The client books 09:00-10:00 (with a real client account, as the booking needs one) ...
        var client = new com.g02.padel.user.User();
        client.setEmail("integration-client@padel.test");
        client.setName("Ana");
        client.setPasswordHash("x");
        client.setRole(com.g02.padel.shared.enums.Role.CLIENT);
        userRepository.save(client);
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content("""
                        { "courtId": %d, "date": "%s", "slots": [ { "start": "09:00", "end": "10:00" } ] }
                        """.formatted(court.getId(), DATE)))
                .andExpect(status().isCreated());

        // ... then the owner tries to block 08:00-09:30.
        mvc.perform(post("/api/v1/courts/" + court.getId() + "/blocks")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
                                .user("owner@padel.test").roles("OWNER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body("08:00", "09:30")))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/v1/courts/" + court.getId() + "/blocks")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
                                .user("owner@padel.test").roles("OWNER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body("08:00", "09:00")))
                .andExpect(status().isCreated());
    }

    @Test
    void aPastBlockIsBadRequest() throws Exception {
        mvc.perform(post("/api/v1/courts/" + court.getId() + "/blocks").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"date\": \"%s\", \"start\": \"08:00\", \"end\": \"09:00\" }".formatted(LocalDate.now().minusDays(1))))
                .andExpect(status().isBadRequest());
    }
}
