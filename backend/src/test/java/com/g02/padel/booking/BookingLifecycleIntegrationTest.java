package com.g02.padel.booking;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

/** List scoping by role, cancel and reschedule through the real use cases and database. */
class BookingLifecycleIntegrationTest extends BookingIntegrationSupport {

    @Autowired
    ObjectMapper json;

    @Test
    void aClientListsOnlyTheirOwnBookings() throws Exception {
        long mine = book(CLIENT_EMAIL, "08:00", "09:00");
        long cancelled = book(CLIENT_EMAIL, "09:00", "10:00");
        long theirs = book(OTHER_EMAIL, "10:00", "11:00");
        mvc.perform(delete("/api/v1/bookings/" + cancelled).with(as(CLIENT_EMAIL, "CLIENT")))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/me/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].id", containsInAnyOrder((int) mine, (int) cancelled)))
                .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/v1/me/bookings").param("status", "CONFIRMED"))
                .andExpect(jsonPath("$.content[*].id", contains((int) mine)));
        mvc.perform(get("/api/v1/me/bookings").param("from", DATE.plusDays(1).toString()))
                .andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/v1/bookings/" + theirs)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/bookings")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = OWNER_EMAIL, roles = "OWNER")
    void theOwnerListsEveryClientsBookingsWithFilters() throws Exception {
        long anas = book(CLIENT_EMAIL, "08:00", "09:00");
        long others = book(OTHER_EMAIL, "10:00", "11:00");

        mvc.perform(get("/api/v1/bookings").param("courtId", court.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].id", containsInAnyOrder((int) anas, (int) others)));
        mvc.perform(get("/api/v1/bookings").param("courtId", court.getId().toString())
                        .param("userId", other.getId().toString()))
                .andExpect(jsonPath("$.content[*].id", contains((int) others)));
        mvc.perform(get("/api/v1/bookings").param("courtId", court.getId().toString())
                        .param("date", DATE.plusDays(1).toString()))
                .andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/v1/bookings/" + anas)).andExpect(status().isOk());
    }

    @Test
    void cancellingFreesTheSlotAndCannotBeRepeated() throws Exception {
        long id = book(CLIENT_EMAIL, "08:00", "09:00");

        mvc.perform(delete("/api/v1/bookings/" + id)).andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/bookings/" + id)).andExpect(jsonPath("$.status").value("CANCELLED"));
        mvc.perform(get("/api/v1/courts/" + court.getId() + "/availability").param("date", DATE.toString()))
                .andExpect(jsonPath("$.slots[0].available").value(true));
        mvc.perform(delete("/api/v1/bookings/" + id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Booking " + id + " is CANCELLED"));
        mvc.perform(delete("/api/v1/bookings/" + book(OTHER_EMAIL, "10:00", "11:00")))
                .andExpect(status().isNotFound());
    }

    @Test
    void reschedulingIntoAFreeSlotMayOverlapItselfButNotSomeoneElse() throws Exception {
        long id = book(CLIENT_EMAIL, "08:00", "09:00");
        book(OTHER_EMAIL, "11:00", "12:00");

        mvc.perform(patch("/api/v1/bookings/" + id).contentType(MediaType.APPLICATION_JSON).content("""
                        { "date": "%s", "slots": [ { "start": "08:00", "end": "09:00" }, { "start": "09:00", "end": "10:00" } ] }
                        """.formatted(DATE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slots.length()").value(2))
                .andExpect(jsonPath("$.totalPrice").value(33.0));

        mvc.perform(patch("/api/v1/bookings/" + id).contentType(MediaType.APPLICATION_JSON).content("""
                        { "date": "%s", "slots": [ { "start": "10:00", "end": "11:00" }, { "start": "11:00", "end": "12:00" } ] }
                        """.formatted(DATE)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("11:00-12:00 is not available on court " + court.getId()));

        mvc.perform(get("/api/v1/bookings/" + id))
                .andExpect(jsonPath("$.slots[*].start", contains("08:00", "09:00")));
    }

    private long book(String email, String start, String end) throws Exception {
        String body = mvc.perform(post("/api/v1/bookings").with(as(email, "CLIENT"))
                        .contentType(MediaType.APPLICATION_JSON).content(createBody(start, end)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor as(String email, String role) {
        return org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
                .user(email).roles(role);
    }
}
