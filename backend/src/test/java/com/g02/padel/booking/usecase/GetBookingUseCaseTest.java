package com.g02.padel.booking.usecase;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
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
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.time.Clock;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GetBookingUseCaseTest {

    private final BookingRepository bookings = mock(BookingRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final GetBookingUseCase useCase = new GetBookingUseCase(new BookingAccess(bookings, users, Clock.systemUTC(), 24));

    private final User ana = user(42L, "ana@padel.test", "Ana", Role.CLIENT);
    private final Booking booking = booking(5001L, court(3L, true), ana, MONDAY, 10, 1);

    @BeforeEach
    void setUp() {
        when(users.findByEmail("ana@padel.test")).thenReturn(Optional.of(ana));
        when(users.findByEmail("bob@padel.test")).thenReturn(Optional.of(user(43L, "bob@padel.test", "Bob", Role.CLIENT)));
        when(users.findByEmail("owner@padel.test")).thenReturn(Optional.of(user(1L, "owner@padel.test", "O", Role.OWNER)));
        when(bookings.findById(5001L)).thenReturn(Optional.of(booking));
    }

    @Test
    void aClientReadsTheirOwnBookingAndTheOwnerAnyBooking() {
        assertThat(useCase.execute(5001L, "ana@padel.test").userName()).isEqualTo("Ana");
        assertThat(useCase.execute(5001L, "owner@padel.test").id()).isEqualTo(5001L);
    }

    @Test
    void someoneElsesBookingLooksMissingToAClient() {
        assertThatThrownBy(() -> useCase.execute(5001L, "bob@padel.test"))
                .isInstanceOf(NotFoundException.class).hasMessage("Booking 5001 not found");
        when(bookings.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> useCase.execute(9L, "owner@padel.test"))
                .isInstanceOf(NotFoundException.class).hasMessage("Booking 9 not found");
    }
}
