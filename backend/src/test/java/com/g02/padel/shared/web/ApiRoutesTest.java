package com.g02.padel.shared.web;

import com.g02.padel.auth.usecase.UpdateProfileUseCase;
import com.g02.padel.booking.usecase.CancelBookingUseCase;
import com.g02.padel.booking.usecase.ListBookingsUseCase;
import com.g02.padel.booking.usecase.RescheduleBookingUseCase;
import com.g02.padel.court.usecase.DeactivateCourtUseCase;
import com.g02.padel.court.usecase.UpdateCourtUseCase;
import com.g02.padel.courtblock.usecase.RemoveBlockUseCase;
import com.g02.padel.user.usecase.UpdateClientUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** HTTP verbs and paths must match docs/api.md; superseded variants must no longer resolve. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "owner@padel.test", roles = "OWNER")
class ApiRoutesTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private CancelBookingUseCase cancelBooking;
    @MockBean
    private RescheduleBookingUseCase rescheduleBooking;
    @MockBean
    private ListBookingsUseCase listBookings;
    @MockBean
    private UpdateCourtUseCase updateCourt;
    @MockBean
    private DeactivateCourtUseCase deactivateCourt;
    @MockBean
    private UpdateClientUseCase updateClient;
    @MockBean
    private com.g02.padel.user.usecase.ListClientBookingsUseCase listClientBookings;
    @MockBean
    private RemoveBlockUseCase removeBlock;
    @MockBean
    private UpdateProfileUseCase updateProfile;

    @Test
    void cancelsBookingWithDelete() throws Exception {
        mvc.perform(delete("/api/v1/bookings/7")).andExpect(status().isNoContent());
        verify(cancelBooking).execute(7L, "owner@padel.test");
    }

    @Test
    void reschedulesBookingWithPatchOnTheResource() throws Exception {
        mvc.perform(patch("/api/v1/bookings/7").contentType(MediaType.APPLICATION_JSON).content("""
                        { "date": "2999-06-08", "slots": [ { "start": "07:00", "end": "08:00" } ] }
                        """))
                .andExpect(status().isOk());
        verify(rescheduleBooking).execute(eq(7L), eq("owner@padel.test"), any());
    }

    @Test
    void oldBookingActionPathsAreGone() throws Exception {
        mvc.perform(patch("/api/v1/bookings/7/cancel")).andExpect(status().isNotFound());
        mvc.perform(patch("/api/v1/bookings/7/reschedule")).andExpect(status().isNotFound());
    }

    @Test
    void updatesCourtWithPatchAndRemovesItWithDelete() throws Exception {
        mvc.perform(patch("/api/v1/courts/3").contentType(MediaType.APPLICATION_JSON).content("""
                        { "indoor": true }
                        """))
                .andExpect(status().isOk());
        verify(updateCourt).execute(eq(3L), any());

        mvc.perform(delete("/api/v1/courts/3")).andExpect(status().isNoContent());
        verify(deactivateCourt).execute(3L);
    }

    @Test
    void oldCourtVariantsAreGone() throws Exception {
        mvc.perform(put("/api/v1/courts/3").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isMethodNotAllowed());
        mvc.perform(patch("/api/v1/courts/3/deactivate")).andExpect(status().isNotFound());
    }

    @Test
    void updatesUserWithPatch() throws Exception {
        mvc.perform(patch("/api/v1/users/42").contentType(MediaType.APPLICATION_JSON).content("""
                        { "phone": "600000000" }
                        """))
                .andExpect(status().isOk());
        verify(updateClient).execute(eq(42L), any());

        mvc.perform(put("/api/v1/users/42").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void removesCourtBlockAtTopLevelPath() throws Exception {
        mvc.perform(delete("/api/v1/court-blocks/9")).andExpect(status().isNoContent());
        verify(removeBlock).execute(9L);

        mvc.perform(delete("/api/v1/courts/3/blocks/9")).andExpect(status().isNotFound());
    }

    @Test
    void listsAClientsBookingsPaginated() throws Exception {
        when(listClientBookings.execute(42L, PageRequest.of(1, 5))).thenReturn(Page.empty(PageRequest.of(1, 5)));

        mvc.perform(get("/api/v1/users/42/bookings").param("page", "1").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(5));
    }

    @Test
    void updatesOwnProfileWithPatchOnAuthMe() throws Exception {
        mvc.perform(patch("/api/v1/auth/me").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": "Ana López" }
                        """))
                .andExpect(status().isOk());
        verify(updateProfile).execute(eq("owner@padel.test"), any());
    }
}
