package com.g02.padel.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.OpeningHours;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
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

/** Booking flow through the real use cases and database (rolled back after each test). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(username = BookingIntegrationTest.CLIENT_EMAIL, roles = "CLIENT")
class BookingIntegrationTest {

    static final String CLIENT_EMAIL = "booking-it-client@padel.test";
    static final String OTHER_EMAIL = "booking-it-other@padel.test";
    static final String OWNER_EMAIL = "booking-it-owner@padel.test";
    static final LocalDate DATE = LocalDate.now().plusDays(10);

    @Autowired
    MockMvc mvc;
    @Autowired
    CourtRepository courtRepository;
    @Autowired
    ScheduleRepository scheduleRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    BookingRepository bookingRepository;

    Court court;
    Schedule schedule;
    User client;
    User other;

    @BeforeEach
    void setUp() {
        client = user(CLIENT_EMAIL, "Ana Client", Role.CLIENT);
        other = user(OTHER_EMAIL, "Other Client", Role.CLIENT);
        user(OWNER_EMAIL, "Owner", Role.OWNER);
        court = new Court();
        court.setName("Court " + UUID.randomUUID());
        court.setType(CourtType.GLASS);
        court = courtRepository.save(court);
        schedule = new Schedule();
        schedule.setCourt(court);
        schedule.setSlotMinutes(60);
        schedule.setPrice(new BigDecimal("16.50"));
        var hours = new OpeningHours();
        hours.setDayOfWeek(DATE.getDayOfWeek());
        hours.setOpenTime(LocalTime.of(8, 0));
        hours.setCloseTime(LocalTime.of(12, 0));
        schedule.addOpeningHours(hours);
        schedule = scheduleRepository.save(schedule);
    }

    @Test
    void aClientBooksAFreeSlotAndTheSecondAttemptIsAConflict() throws Exception {
        String body = createBody("10:00", "11:00", "11:00", "12:00");

        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(content().json("""
                        { "courtId": %d, "courtName": "%s", "userId": %d, "userName": "Ana Client",
                          "date": "%s", "status": "CONFIRMED", "totalPrice": 33.00,
                          "slots": [ { "start": "10:00", "end": "11:00", "price": 16.50 },
                                     { "start": "11:00", "end": "12:00", "price": 16.50 } ] }
                        """.formatted(court.getId(), court.getName(), client.getId(), DATE)))
                .andExpect(jsonPath("$.id").isNumber());

        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("11:00", "12:00")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("11:00-12:00 is not available on court " + court.getId()));

        mvc.perform(get("/api/v1/courts/" + court.getId() + "/availability").param("date", DATE.toString()))
                .andExpect(jsonPath("$.slots[*].available").value(org.hamcrest.Matchers.contains(true, true, false, false)));
    }

    @Test
    void theSlotPriceIsSnapshottedAtBookingTime() throws Exception {
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("08:00", "09:00")))
                .andExpect(status().isCreated());

        schedule.setPrice(new BigDecimal("30.00"));
        scheduleRepository.flush();

        assertThat(bookingRepository.findByCourtIdAndDate(court.getId(), DATE))
                .singleElement()
                .satisfies(b -> {
                    assertThat(b.getTotalPrice()).isEqualByComparingTo("16.50");
                    assertThat(b.getSlots().get(0).getPrice()).isEqualByComparingTo("16.50");
                });
    }

    @Test
    void closedTimeAndPastDatesAreBadRequest() throws Exception {
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("12:00", "13:00")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("12:00-13:00 is outside the schedule of court " + court.getId()));
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content("""
                        { "courtId": %d, "date": "%s", "slots": [ { "start": "10:00", "end": "11:00" } ] }
                        """.formatted(court.getId(), LocalDate.now().minusDays(1))))
                .andExpect(status().isBadRequest());
    }

    String createBody(String... times) {
        var slots = new StringBuilder();
        for (int i = 0; i < times.length; i += 2) {
            slots.append(i == 0 ? "" : ", ")
                    .append("{ \"start\": \"%s\", \"end\": \"%s\" }".formatted(times[i], times[i + 1]));
        }
        return "{ \"courtId\": %d, \"date\": \"%s\", \"slots\": [ %s ] }".formatted(court.getId(), DATE, slots);
    }

    User user(String email, String name, Role role) {
        var user = new User();
        user.setEmail(email);
        user.setPasswordHash("x");
        user.setName(name);
        user.setRole(role);
        return userRepository.save(user);
    }
}
