package com.g02.padel.booking;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Who may read or change a booking, shared by the get, cancel and reschedule use cases. */
@Component
public class BookingAccess {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final Clock clock;
    private final int minNoticeHours;

    public BookingAccess(BookingRepository bookingRepository, UserRepository userRepository, Clock clock,
                         @Value("${app.booking.cancel-min-notice-hours}") int minNoticeHours) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.clock = clock;
        this.minNoticeHours = minNoticeHours;
    }

    public record Access(Booking booking, User requester) {
        public boolean byOwner() {
            return requester.getRole() == Role.OWNER;
        }
    }

    /** The booking if the requester may see it: the OWNER any, a CLIENT only their own (else 404, not 403). */
    public Booking visible(Long id, String requesterEmail) {
        return find(id, requester(requesterEmail));
    }

    /**
     * The booking if the requester may cancel or reschedule it now: visible, CONFIRMED, and — for a CLIENT —
     * at least {@code minNoticeHours} before it starts (else 409).
     */
    public Access changeable(Long id, String requesterEmail) {
        User requester = requester(requesterEmail);
        Booking booking = find(id, requester);
        booking.requireConfirmed();
        if (requester.getRole() != Role.OWNER
                && LocalDateTime.now(clock).isAfter(booking.startsAt().minusHours(minNoticeHours))) {
            throw new ConflictException("Bookings can only be cancelled or changed at least " + minNoticeHours
                    + " hours before they start");
        }
        return new Access(booking, requester);
    }

    private Booking find(Long id, User requester) {
        return bookingRepository.findById(id)
                .filter(b -> requester.getRole() == Role.OWNER || b.getUser().getId().equals(requester.getId()))
                .orElseThrow(() -> NotFoundException.of("Booking", id));
    }

    private User requester(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> NotFoundException.of("User", email));
    }
}
