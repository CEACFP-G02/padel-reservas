package com.g02.padel.booking.usecase;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.clockAt;
import static com.g02.padel.availability.AvailabilityFixtures.court;
import static com.g02.padel.booking.usecase.BookingFixtures.booking;
import static com.g02.padel.booking.usecase.BookingFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.booking.BookableSlots;
import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingAccess;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.BookingSlot;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.booking.dto.RescheduleBookingRequest;
import com.g02.padel.booking.dto.TimeSlotRequest;
import com.g02.padel.court.Court;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.shared.exception.SlotNotAvailableException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** The booking is on court 3, Tuesday 10:00-12:00. */
class RescheduleBookingUseCaseTest {

    private static final LocalDate NEW_DATE = MONDAY.plusDays(3);
    private static final List<TimeSlotRequest> NEW_SLOTS =
            List.of(new TimeSlotRequest(LocalTime.of(18, 0), LocalTime.of(19, 0)));

    private final BookingRepository bookings = mock(BookingRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final BookableSlots bookable = mock(BookableSlots.class);

    private final Court court3 = court(3L, true);
    private final Court court4 = court(4L, true);
    private final User ana = user(42L, "ana@padel.test", "Ana", Role.CLIENT);
    private final User bob = user(43L, "bob@padel.test", "Bob", Role.CLIENT);
    private final User owner = user(1L, "owner@padel.test", "Owner", Role.OWNER);
    private final Booking booking = booking(5001L, court3, ana, MONDAY.plusDays(1), 10, 2);

    @BeforeEach
    void setUp() {
        when(users.findByEmail("ana@padel.test")).thenReturn(Optional.of(ana));
        when(users.findByEmail("bob@padel.test")).thenReturn(Optional.of(bob));
        when(users.findByEmail("owner@padel.test")).thenReturn(Optional.of(owner));
        when(bookings.findById(5001L)).thenReturn(Optional.of(booking));
        when(bookable.lockCourt(3L, false)).thenReturn(court3);
        when(bookable.lockCourt(4L, false)).thenReturn(court4);
        when(bookable.lockCourt(3L, true)).thenReturn(court3);
        when(bookable.priced(any(), any(), any(), any())).thenReturn(List.of(
                BookingSlot.of(LocalTime.of(18, 0), LocalTime.of(19, 0), new BigDecimal("20.00"))));
    }

    @Test
    void movesTheBookingIntoAFreeSlotAtTheCurrentPriceIgnoringItsOwnSlots() {
        BookingResponse response = useCaseAt(clockAt(MONDAY, "08:00"))
                .execute(5001L, "ana@padel.test", new RescheduleBookingRequest(null, NEW_DATE, NEW_SLOTS));

        verify(bookable).priced(court3, NEW_DATE, NEW_SLOTS, 5001L);
        assertThat(response.courtId()).isEqualTo(3L);
        assertThat(response.date()).isEqualTo(NEW_DATE);
        assertThat(response.slots()).singleElement()
                .satisfies(s -> assertThat(s.start()).isEqualTo(LocalTime.of(18, 0)));
        assertThat(response.totalPrice()).isEqualByComparingTo("20.00");
    }

    @Test
    void canMoveToAnotherCourt() {
        BookingResponse response = useCaseAt(clockAt(MONDAY, "08:00"))
                .execute(5001L, "ana@padel.test", new RescheduleBookingRequest(4L, NEW_DATE, NEW_SLOTS));

        verify(bookable).priced(court4, NEW_DATE, NEW_SLOTS, 5001L);
        assertThat(response.courtId()).isEqualTo(4L);
        assertThat(booking.getCourt()).isSameAs(court4);
    }

    @Test
    void movingIntoATakenSlotIsAConflictAndLeavesTheBookingAsItWas() {
        when(bookable.priced(any(), any(), any(), any())).thenThrow(new SlotNotAvailableException("taken"));

        assertThatThrownBy(() -> useCaseAt(clockAt(MONDAY, "08:00"))
                .execute(5001L, "ana@padel.test", new RescheduleBookingRequest(4L, NEW_DATE, NEW_SLOTS)))
                .isInstanceOf(SlotNotAvailableException.class);
        assertThat(booking.getCourt()).isSameAs(court3);
        assertThat(booking.getDate()).isEqualTo(MONDAY.plusDays(1));
        assertThat(booking.getSlots()).hasSize(2);
    }

    @Test
    void aClientCannotRescheduleWithinTheMinimumNotice() {
        assertThatThrownBy(() -> useCaseAt(clockAt(MONDAY, "11:00"))
                .execute(5001L, "ana@padel.test", new RescheduleBookingRequest(null, NEW_DATE, NEW_SLOTS)))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bookings can only be cancelled or changed at least 24 hours before they start");
        verify(bookable, never()).priced(any(), any(), any(), any());
    }

    @Test
    void theOwnerMayRescheduleLate() {
        useCaseAt(clockAt(MONDAY, "11:00"))
                .execute(5001L, "owner@padel.test", new RescheduleBookingRequest(null, NEW_DATE, NEW_SLOTS));

        assertThat(booking.getDate()).isEqualTo(NEW_DATE);
    }

    @Test
    void aClientCannotRescheduleSomeoneElsesBooking() {
        assertThatThrownBy(() -> useCaseAt(clockAt(MONDAY, "08:00"))
                .execute(5001L, "bob@padel.test", new RescheduleBookingRequest(null, NEW_DATE, NEW_SLOTS)))
                .isInstanceOf(NotFoundException.class).hasMessage("Booking 5001 not found");
    }

    @Test
    void aCancelledBookingCannotBeRescheduled() {
        booking.cancel(MONDAY.atTime(7, 0));

        assertThatThrownBy(() -> useCaseAt(clockAt(MONDAY, "08:00"))
                .execute(5001L, "ana@padel.test", new RescheduleBookingRequest(null, NEW_DATE, NEW_SLOTS)))
                .isInstanceOf(ConflictException.class).hasMessage("Booking 5001 is CANCELLED");
        verify(bookable, never()).priced(any(), any(), any(), any());
    }

    private RescheduleBookingUseCase useCaseAt(Clock clock) {
        return new RescheduleBookingUseCase(new BookingAccess(bookings, users, clock, 24), bookable);
    }
}
