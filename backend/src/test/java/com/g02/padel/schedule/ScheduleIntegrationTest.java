package com.g02.padel.schedule;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.shared.enums.CourtType;
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

/** Owner sets a court's schedule and price; clients read it — real use cases and database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ScheduleIntegrationTest {

    @Autowired
    private MockMvc mvc;
    @Autowired
    private CourtRepository courtRepository;

    private String url;

    @BeforeEach
    void setUp() {
        var court = new Court();
        court.setName("Court " + UUID.randomUUID());
        court.setType(CourtType.WALL);
        url = "/api/v1/courts/" + courtRepository.save(court).getId() + "/schedule";
    }

    @Test
    @WithMockUser(username = "owner@padel.test", roles = {"OWNER", "CLIENT"})
    void ownerCreatesThenReplacesTheScheduleAndItIsReadBack() throws Exception {
        mvc.perform(get(url)).andExpect(status().isNotFound());

        mvc.perform(put(url).contentType(MediaType.APPLICATION_JSON).content("""
                        { "slotMinutes": 60, "price": 16.00, "weekdays": [
                          { "day": "SUNDAY", "open": "09:00", "close": "14:00" },
                          { "day": "MONDAY", "open": "08:00", "close": "22:00" } ] }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weekdays[0].day").value("MONDAY"));

        mvc.perform(put(url).contentType(MediaType.APPLICATION_JSON).content("""
                        { "slotMinutes": 90, "price": 24.50, "weekdays": [
                          { "day": "TUESDAY", "open": "10:00", "close": "14:00" },
                          { "day": "TUESDAY", "open": "17:00", "close": "22:00" } ] }
                        """))
                .andExpect(status().isOk());

        mvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slotMinutes").value(90))
                .andExpect(jsonPath("$.price").value(24.5))
                .andExpect(jsonPath("$.weekdays.length()").value(2))
                .andExpect(jsonPath("$.weekdays[0].open").value("10:00"))
                .andExpect(jsonPath("$.weekdays[1].open").value("17:00"));
    }

    @Test
    @WithMockUser(username = "owner@padel.test", roles = "OWNER")
    void rejectsOverlappingRangesWith400AndKeepsNothing() throws Exception {
        mvc.perform(put(url).contentType(MediaType.APPLICATION_JSON).content("""
                        { "slotMinutes": 60, "price": 16.00, "weekdays": [
                          { "day": "MONDAY", "open": "08:00", "close": "14:00" },
                          { "day": "MONDAY", "open": "13:00", "close": "20:00" } ] }
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("MONDAY 13:00-20:00 overlaps 08:00-14:00"));

        mvc.perform(get(url)).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "owner@padel.test", roles = "OWNER")
    void aMissingCourtIs404() throws Exception {
        mvc.perform(put("/api/v1/courts/987654/schedule").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"slotMinutes\": 60, \"price\": 16.00, \"weekdays\": [] }"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Court 987654 not found"));
    }
}
