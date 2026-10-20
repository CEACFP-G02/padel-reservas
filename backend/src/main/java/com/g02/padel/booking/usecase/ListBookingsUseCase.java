package com.g02.padel.booking.usecase;

import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.dto.BookingResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/** UC (owner): list bookings, optionally filtered by court and/or date. */
@Service
public class ListBookingsUseCase {

    private final BookingRepository bookingRepository;

    public ListBookingsUseCase(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> execute(Long courtId, LocalDate date) {
        // TODO: both filters -> findByCourtIdAndDate; otherwise filtered query / findAll; map
        //  — see docs/api.md#get-apiv1bookings
        throw new UnsupportedOperationException("TODO: ListBookings — see docs/api.md#get-apiv1bookings");
    }
}
