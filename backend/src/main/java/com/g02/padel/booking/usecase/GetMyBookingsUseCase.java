package com.g02.padel.booking.usecase;

import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.user.UserRepository;
import com.g02.padel.shared.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/** UC (client): list the authenticated user's own bookings. */
@Service
public class GetMyBookingsUseCase {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public GetMyBookingsUseCase(BookingRepository bookingRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> execute(String requesterEmail, BookingStatus status, LocalDate from, LocalDate to,
                                         Pageable pageable) {
        // TODO: resolve user by email; paged query by userId + optional status and date range (default sort
        //  date desc); map to BookingResponse — see docs/api.md#bookings--apiv1bookings
        throw new UnsupportedOperationException("TODO: GetMyBookings — see docs/api.md#get-apiv1mebookings");
    }
}
