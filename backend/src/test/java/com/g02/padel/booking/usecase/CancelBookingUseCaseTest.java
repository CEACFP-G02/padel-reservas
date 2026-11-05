package com.g02.padel.booking.usecase;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.clockAt;
import static com.g02.padel.availability.AvailabilityFixtures.court;
import static com.g02.padel.booking.usecase.BookingFixtures.booking;
import static com.g02.padel.booking.usecase.BookingFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingAccess;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.time.Clock;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** The booking starts Tuesday 10:00, so the 24-hour notice ends Monday 10:00. */
class CancelBookingUseCaseTest {

    private static final String TOO_LATE =
            "Bookings can only be cancelled or changed at least 24 hours before they start";

    private final BookingRepository bookings = mock(BookingRepository.class);
    private final UserRepository users = mock(UserRepository.class);

    private final User ana = user(42L, "ana@padel.test", "Ana", Role.CLIENT);
    private final User bob = user(43L, "bob@padel.test", "Bob", Role.CLIENT);
    private final User owner = user(1L, "owner@padel.test", "Owner", Role.OWNER);
    private final Booking booking = booking(5001L, court(3L, true), ana, MONDAY.plusDays(1), 10, 2);

    @BeforeEach
    void setUp() {
        when(users.findByEmail("ana@padel.test")).thenReturn(Optional.of(ana));
        when(users.findByEmail("bob@padel.test")).thenReturn(Optional.of(bob));
        when(users.findByEmail("owner@padel.test")).thenReturn(Optional.of(owner));
        when(bookings.findById(5001L)).thenReturn(Optional.of(booking));
    }

    @Test
    void aClientCancelsTheirBookingWellAheadAndItIsKeptAsCancelled() {
        Clock clock = clockAt(MONDAY, "08:00");

        useCaseAt(clock).execute(5001L, "ana@padel.test");

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(booking.getCancelledAt()).isEqualTo(MONDAY.atTime(8, 0));
    }

    @Test
    void exactlyTheMinimumNoticeIsStillAllowed() {
        useCaseAt(clockAt(MONDAY, "10:00")).execute(5001L, "ana@padel.test");

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
    }

    @Test
    void aClientCannotCancelWithinTheMinimumNotice() {
        assertThatThrownBy(() -> useCaseAt(clockAt(MONDAY, "10:01")).execute(5001L, "ana@padel.test"))
                .isInstanceOf(ConflictException.class).hasMessage(TOO_LATE);
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
    }

    @Test
    void theOwnerMayCancelAtAnyTime() {
        useCaseAt(clockAt(MONDAY.plusDays(1), "09:59")).execute(5001L, "owner@padel.test");

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
    }

    @Test
    void aClientCannotCancelSomeoneElsesBooking() {
        assertThatThrownBy(() -> useCaseAt(clockAt(MONDAY, "08:00")).execute(5001L, "bob@padel.test"))
                .isInstanceOf(NotFoundException.class).hasMessage("Booking 5001 not found");
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
    }

    @Test
    void aMissingBookingIsNotFound() {
        when(bookings.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCaseAt(clockAt(MONDAY, "08:00")).execute(9L, "owner@padel.test"))
                .isInstanceOf(NotFoundException.class).hasMessage("Booking 9 not found");
    }

    @Test
    void anAlreadyCancelledBookingIsAConflict() {
        booking.cancel(MONDAY.atTime(7, 0));

        assertThatThrownBy(() -> useCaseAt(clockAt(MONDAY, "08:00")).execute(5001L, "ana@padel.test"))
                .isInstanceOf(ConflictException.class).hasMessage("Booking 5001 is CANCELLED");
    }

    private CancelBookingUseCase useCaseAt(Clock clock) {
        return new CancelBookingUseCase(new BookingAccess(bookings, users, clock, 24), clock);
    }
}
