package com.g02.padel.booking.usecase;


import com.g02.padel.booking.BookingAccess;
import java.time.Clock;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: cancel a booking. Clients must respect the minimum notice; OWNER may cancel any time. */
@Service
public class CancelBookingUseCase {

    private final BookingAccess bookingAccess;
    private final Clock clock;

    public CancelBookingUseCase(BookingAccess bookingAccess, Clock clock) {
        this.bookingAccess = bookingAccess;
        this.clock = clock;
    }

    @Transactional
    public void execute(Long id, String requesterEmail) {
        bookingAccess.changeable(id, requesterEmail).booking().cancel(LocalDateTime.now(clock));
    }
}
