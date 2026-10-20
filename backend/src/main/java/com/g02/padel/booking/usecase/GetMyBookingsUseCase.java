package com.g02.padel.booking.usecase;

import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
    public List<BookingResponse> execute(String requesterEmail) {
        // TODO: resolve user by email, findByUserId, sort by date/start desc, map — see docs/api.md#get-apiv1mebookings
        throw new UnsupportedOperationException("TODO: GetMyBookings — see docs/api.md#get-apiv1mebookings");
    }
}
