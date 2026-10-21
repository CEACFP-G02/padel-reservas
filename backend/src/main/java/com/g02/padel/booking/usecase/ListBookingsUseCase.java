package com.g02.padel.booking.usecase;

import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.shared.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/** UC (owner): list bookings, optionally filtered by date, court, client and status. */
@Service
public class ListBookingsUseCase {

    private final BookingRepository bookingRepository;

    public ListBookingsUseCase(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> execute(LocalDate date, Long courtId, Long userId, BookingStatus status,
                                         Pageable pageable) {
        // TODO: paged query with the non-null filters (e.g. a JpaSpecificationExecutor);
        //  map with BookingMapper::toResponse
        //  — see docs/api.md#bookings--apiv1bookings
        throw new UnsupportedOperationException("TODO: ListBookings — see docs/api.md#get-apiv1bookings");
    }
}
