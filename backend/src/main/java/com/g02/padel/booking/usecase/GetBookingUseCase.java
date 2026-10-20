package com.g02.padel.booking.usecase;

import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: get one booking (its owner or an ADMIN). */
@Service
public class GetBookingUseCase {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public GetBookingUseCase(BookingRepository bookingRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public BookingResponse execute(Long id, String requesterEmail) {
        // TODO: findById else NotFoundException; non-owner CLIENT -> NotFoundException (don't leak existence)
        //  — see docs/api.md#get-apiv1bookingsid
        throw new UnsupportedOperationException("TODO: GetBooking — see docs/api.md#get-apiv1bookingsid");
    }
}
