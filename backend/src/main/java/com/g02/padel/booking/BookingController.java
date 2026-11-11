package com.g02.padel.booking;

import com.g02.padel.booking.dto.BookingCreatedResponse;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.booking.dto.CreateBookingRequest;
import com.g02.padel.booking.dto.RescheduleBookingRequest;
import com.g02.padel.booking.usecase.CancelBookingUseCase;
import com.g02.padel.booking.usecase.CreateBookingUseCase;
import com.g02.padel.booking.usecase.GetBookingUseCase;
import com.g02.padel.booking.usecase.GetMyBookingsUseCase;
import com.g02.padel.booking.usecase.ListBookingsUseCase;
import com.g02.padel.booking.usecase.RescheduleBookingUseCase;
import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.shared.web.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
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
    public BookingCreatedResponse create(Authentication authentication,
                                         @Valid @RequestBody CreateBookingRequest request) {
        return createBooking.execute(authentication.getName(), request);
    }

    @GetMapping("/bookings")
    @PreAuthorize("hasRole('OWNER')")
    public PageResponse<BookingResponse> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long courtId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) BookingStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(listBookings.execute(date, courtId, userId, status, pageable));
    }

    @GetMapping("/bookings/{id}")
    public BookingResponse get(Authentication authentication, @PathVariable Long id) {
        return getBooking.execute(id, authentication.getName());
    }

    @GetMapping("/me/bookings")
    @PreAuthorize("hasRole('CLIENT')")
    public PageResponse<BookingResponse> myBookings(
            Authentication authentication,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(getMyBookings.execute(authentication.getName(), status, from, to, pageable));
    }

    /** Soft-cancel: the booking stays, with status CANCELLED. */
    @DeleteMapping("/bookings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(Authentication authentication, @PathVariable Long id) {
        cancelBooking.execute(id, authentication.getName());
    }

    @PatchMapping("/bookings/{id}")
    public BookingResponse reschedule(Authentication authentication, @PathVariable Long id,
                                      @Valid @RequestBody RescheduleBookingRequest request) {
        return rescheduleBooking.execute(id, authentication.getName(), request);
    }
}
