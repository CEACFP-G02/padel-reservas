package com.g02.padel.booking.usecase;

import com.g02.padel.booking.BookingMapper;
import com.g02.padel.booking.BookingSpecifications;
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
        return bookingRepository
                .findAll(BookingSpecifications.filter(userId, courtId, status, date, date),
                        BookingSpecifications.withDefaultSort(pageable))
                .map(BookingMapper::toResponse);
    }
}
