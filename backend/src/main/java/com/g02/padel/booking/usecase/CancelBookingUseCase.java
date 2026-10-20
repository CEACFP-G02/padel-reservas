package com.g02.padel.booking.usecase;

import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: cancel a booking. Clients must respect the minimum notice; OWNER may cancel any time. */
@Service
public class CancelBookingUseCase {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final int cancelMinNoticeHours;

    public CancelBookingUseCase(BookingRepository bookingRepository,
                                UserRepository userRepository,
                                @Value("${app.booking.cancel-min-notice-hours}") int cancelMinNoticeHours) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.cancelMinNoticeHours = cancelMinNoticeHours;
    }

    @Transactional
    public BookingResponse execute(Long id, String requesterEmail) {
        // TODO: load (NotFoundException); CLIENT must own it; must be CONFIRMED; for CLIENT, reject if
        //  now > (date + first slot start) - cancelMinNoticeHours; set CANCELLED + cancelledAt
        //  — see docs/api.md#patch-apiv1bookingsidcancel
        throw new UnsupportedOperationException("TODO: CancelBooking — see docs/api.md#patch-apiv1bookingsidcancel");
    }
}
