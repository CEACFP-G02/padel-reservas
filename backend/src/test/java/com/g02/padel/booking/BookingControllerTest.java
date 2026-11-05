package com.g02.padel.booking;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.booking.dto.BookingSlotResponse;
import com.g02.padel.booking.dto.CreateBookingRequest;
import com.g02.padel.booking.dto.TimeSlotRequest;
import com.g02.padel.booking.usecase.CancelBookingUseCase;
import com.g02.padel.booking.usecase.CreateBookingUseCase;
import com.g02.padel.booking.usecase.GetBookingUseCase;
import com.g02.padel.booking.usecase.GetMyBookingsUseCase;
import com.g02.padel.booking.usecase.ListBookingsUseCase;
import com.g02.padel.booking.usecase.RescheduleBookingUseCase;
import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.shared.exception.SlotNotAvailableException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** HTTP contract of /api/v1/bookings (docs/api.md#bookings--apiv1bookings), use cases mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "ana@padel.test", roles = "CLIENT")
class BookingControllerTest {

    static final LocalDate DATE = LocalDate.now().plusDays(7);
    static final String CREATE_BODY = """
            { "courtId": 3, "date": "%s", "slots": [ { "start": "07:00", "end": "08:00" } ], "clientId": 42 }
            """.formatted(DATE);
    static final BookingResponse BOOKING = new BookingResponse(5001L, 3L, "Court 3", 42L, "Demo Client", DATE,
            BookingStatus.CONFIRMED, new BigDecimal("16.00"), Instant.parse("2026-05-30T10:15:00Z"),
            List.of(new BookingSlotResponse(LocalTime.of(7, 0), LocalTime.of(8, 0), new BigDecimal("16.00"))));
    static final String BOOKING_JSON = """
            {
              "id": 5001,
              "courtId": 3,
              "courtName": "Court 3",
              "userId": 42,
              "userName": "Demo Client",
              "date": "%s",
              "status": "CONFIRMED",
              "totalPrice": 16.00,
              "createdAt": "2026-05-30T10:15:00Z",
              "slots": [ { "start": "07:00", "end": "08:00", "price": 16.00 } ]
            }
            """.formatted(DATE);

    @Autowired
    MockMvc mvc;

    @MockBean
    CreateBookingUseCase createBooking;
    @MockBean
    ListBookingsUseCase listBookings;
    @MockBean
    GetBookingUseCase getBooking;
    @MockBean
    GetMyBookingsUseCase getMyBookings;
    @MockBean
    CancelBookingUseCase cancelBooking;
    @MockBean
    RescheduleBookingUseCase rescheduleBooking;

    @Test
    void createReturns201WithTheDocsShape() throws Exception {
        var request = new CreateBookingRequest(3L, DATE,
                List.of(new TimeSlotRequest(LocalTime.of(7, 0), LocalTime.of(8, 0))), 42L);
        when(createBooking.execute("ana@padel.test", request)).thenReturn(BOOKING);

        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content(CREATE_BODY))
                .andExpect(status().isCreated())
                .andExpect(content().json(BOOKING_JSON, true));
    }

    @Test
    void createValidatesTheBody() throws Exception {
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content("""
                        { "date": "2020-01-01", "slots": [ { "start": "07:00" } ] }
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.courtId").exists())
                .andExpect(jsonPath("$.fieldErrors.date").exists())
                .andExpect(jsonPath("$.fieldErrors['slots[0].end']").exists());
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content("""
                        { "courtId": 3, "date": "%s", "slots": [] }
                        """.formatted(DATE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.slots").exists());
        verify(createBooking, never()).execute(any(), any());
    }

    @Test
    void aTakenSlotIs409() throws Exception {
        when(createBooking.execute(eq("ana@padel.test"), any()))
                .thenThrow(new SlotNotAvailableException("07:00-08:00 is not available on court 3"));

        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content(CREATE_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("07:00-08:00 is not available on court 3"));
    }

    @Test
    void aPastOrClosedSlotIs400AndAMissingCourt404() throws Exception {
        when(createBooking.execute(eq("ana@padel.test"), any()))
                .thenThrow(new IllegalArgumentException("07:00-08:00 is outside the schedule of court 3"))
                .thenThrow(NotFoundException.of("Court", 3L));

        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content(CREATE_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("07:00-08:00 is outside the schedule of court 3"));
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content(CREATE_BODY))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithAnonymousUser
    void anonymousCallersCannotBook() throws Exception {
        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content(CREATE_BODY))
                .andExpect(status().isUnauthorized());
    }
}
