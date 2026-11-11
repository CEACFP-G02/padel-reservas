package com.g02.padel.booking;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.shared.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

/** The owner books on behalf of a client (POST /bookings with clientId), through the real database. */
@WithMockUser(username = BookingIntegrationSupport.OWNER_EMAIL, roles = "OWNER")
class OwnerManualBookingIntegrationTest extends BookingIntegrationSupport {

    private String bodyFor(long clientId) {
        String body = createBody("10:00", "11:00");
        return body.substring(0, body.length() - 1) + ", \"clientId\": " + clientId + " }";
    }

    @Test
    void theOwnerBooksForAnActiveClient() throws Exception {
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content(bodyFor(client.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(client.getId()))
                .andExpect(jsonPath("$.userName").value("Ana Client"));
    }

    @Test
    void anInactiveClientIsBadRequestAndNothingIsBooked() throws Exception {
        client.setActive(false);
        userRepository.saveAndFlush(client);

        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content(bodyFor(client.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Client " + client.getId() + " is inactive"));

        org.assertj.core.api.Assertions.assertThat(bookingRepository.existsByUserId(client.getId())).isFalse();
    }

    @Test
    void anUnknownClientOrAnOwnerIdIsStill404() throws Exception {
        long ownerId = userRepository.findByEmail(OWNER_EMAIL).orElseThrow().getId();
        org.assertj.core.api.Assertions.assertThat(userRepository.findByEmail(OWNER_EMAIL).orElseThrow().getRole())
                .isEqualTo(Role.OWNER);

        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content(bodyFor(987654L)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Client 987654 not found"));
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content(bodyFor(ownerId)))
                .andExpect(status().isNotFound());
    }
}
