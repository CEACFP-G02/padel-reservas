package com.g02.padel.booking;

import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.booking.dto.CreateBookingRequest;
import com.g02.padel.booking.dto.RescheduleBookingRequest;
import com.g02.padel.booking.usecase.CancelBookingUseCase;
import com.g02.padel.booking.usecase.CreateBookingUseCase;
import com.g02.padel.booking.usecase.GetBookingUseCase;
import com.g02.padel.booking.usecase.GetMyBookingsUseCase;
import com.g02.padel.booking.usecase.ListBookingsUseCase;
import com.g02.padel.booking.usecase.RescheduleBookingUseCase;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class BookingController {

    private final CreateBookingUseCase createBooking;
    private final ListBookingsUseCase listBookings;
    private final GetBookingUseCase getBooking;
    private final GetMyBookingsUseCase getMyBookings;
    private final CancelBookingUseCase cancelBooking;
    private final RescheduleBookingUseCase rescheduleBooking;

    public BookingController(CreateBookingUseCase createBooking, ListBookingsUseCase listBookings,
                             GetBookingUseCase getBooking, GetMyBookingsUseCase getMyBookings,
                             CancelBookingUseCase cancelBooking, RescheduleBookingUseCase rescheduleBooking) {
        this.createBooking = createBooking;
        this.listBookings = listBookings;
        this.getBooking = getBooking;
        this.getMyBookings = getMyBookings;
        this.cancelBooking = cancelBooking;
        this.rescheduleBooking = rescheduleBooking;
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse create(Authentication authentication, @Valid @RequestBody CreateBookingRequest request) {
        return createBooking.execute(authentication.getName(), request);
    }

    @GetMapping("/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BookingResponse> list(
            @RequestParam(required = false) Long courtId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return listBookings.execute(courtId, date);
    }

    @GetMapping("/bookings/{id}")
    public BookingResponse get(Authentication authentication, @PathVariable Long id) {
        return getBooking.execute(id, authentication.getName());
    }

    @GetMapping("/me/bookings")
    public List<BookingResponse> myBookings(Authentication authentication) {
        return getMyBookings.execute(authentication.getName());
    }

    @PatchMapping("/bookings/{id}/cancel")
    public BookingResponse cancel(Authentication authentication, @PathVariable Long id) {
        return cancelBooking.execute(id, authentication.getName());
    }

    @PatchMapping("/bookings/{id}/reschedule")
    public BookingResponse reschedule(Authentication authentication, @PathVariable Long id,
                                      @Valid @RequestBody RescheduleBookingRequest request) {
        return rescheduleBooking.execute(id, authentication.getName(), request);
    }
}
