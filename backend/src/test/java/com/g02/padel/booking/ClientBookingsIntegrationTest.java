package com.g02.padel.booking;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalTime;
import org.junit.jupiter.api.Test;
import org.springframework.security.test.context.support.WithMockUser;

/** GET /users/{id}/bookings through the real use case and database. */
@WithMockUser(username = BookingIntegrationSupport.OWNER_EMAIL, roles = "OWNER")
class ClientBookingsIntegrationTest extends BookingIntegrationSupport {

    private Booking saved(com.g02.padel.user.User user, java.time.LocalDate date, int hour) {
        var booking = new Booking();
        booking.setCourt(court);
        booking.setUser(user);
        booking.setDate(date);
        booking.addSlot(BookingSlot.of(LocalTime.of(hour, 0), LocalTime.of(hour + 1, 0), new BigDecimal("16.50")));
        return bookingRepository.save(booking);
    }

    @Test
    void theOwnerSeesOnlyThatClientsBookingsMostRecentFirst() throws Exception {
        long older = saved(client, DATE, 8).getId();
        long newer = saved(client, DATE.plusDays(1), 9).getId();
        saved(other, DATE, 10);

        mvc.perform(get("/api/v1/users/" + client.getId() + "/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].id").value(contains((int) newer, (int) older)))
                .andExpect(jsonPath("$.content[0].userName").value("Ana Client"))
                .andExpect(jsonPath("$.content[0].slots[0].price").value(16.50));
    }

    @Test
    void anUnknownIdOrAnOwnerIdIs404() throws Exception {
        long ownerId = userRepository.findByEmail(OWNER_EMAIL).orElseThrow().getId();

        mvc.perform(get("/api/v1/users/987654/bookings"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Client 987654 not found"));
        mvc.perform(get("/api/v1/users/" + ownerId + "/bookings")).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = BookingIntegrationSupport.CLIENT_EMAIL, roles = "CLIENT")
    void aClientGets403() throws Exception {
        mvc.perform(get("/api/v1/users/" + client.getId() + "/bookings")).andExpect(status().isForbidden());
    }
}
