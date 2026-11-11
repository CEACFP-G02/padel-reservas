package com.g02.padel.booking.usecase;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.court;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.booking.BookableSlots;
import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.BookingSlot;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.booking.dto.BookingSlotResponse;
import com.g02.padel.booking.dto.CreateBookingRequest;
import com.g02.padel.booking.dto.TimeSlotRequest;
import com.g02.padel.court.Court;
import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.shared.exception.SlotNotAvailableException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CreateBookingUseCaseTest {

    private static final LocalDate DATE = MONDAY.plusDays(7);
    private static final List<TimeSlotRequest> SLOTS = List.of(
            new TimeSlotRequest(LocalTime.of(10, 0), LocalTime.of(11, 0)),
            new TimeSlotRequest(LocalTime.of(11, 0), LocalTime.of(12, 0)));

    private final BookingRepository bookings = mock(BookingRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final BookableSlots bookable = mock(BookableSlots.class);
    private final CreateBookingUseCase useCase = new CreateBookingUseCase(bookings, users, bookable);

    private final Court court = court(3L, true);
    private final User ana = user(42L, "ana@padel.test", "Ana Client", Role.CLIENT);
    private final User owner = user(1L, "owner@padel.test", "Owner", Role.OWNER);

    @BeforeEach
    void setUp() {
        when(users.findByEmail("ana@padel.test")).thenReturn(Optional.of(ana));
        when(users.findByEmail("owner@padel.test")).thenReturn(Optional.of(owner));
        when(users.findById(42L)).thenReturn(Optional.of(ana));
        when(users.findById(1L)).thenReturn(Optional.of(owner));
        when(bookable.lockCourt(3L, false)).thenReturn(court);
        when(bookable.lockCourt(3L, true)).thenReturn(court);
        when(bookable.priced(court, DATE, SLOTS)).thenReturn(List.of(
                BookingSlot.of(LocalTime.of(10, 0), LocalTime.of(11, 0), new BigDecimal("16.50")),
                BookingSlot.of(LocalTime.of(11, 0), LocalTime.of(12, 0), new BigDecimal("16.50"))));
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            b.setId(5001L);
            return b;
        });
    }

    @Test
    void aClientBooksForThemselvesWithThePriceSnapshotAndNames() {
        BookingResponse response = useCase.execute("ana@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, 99L));

        assertThat(response.id()).isEqualTo(5001L);
        assertThat(response.courtId()).isEqualTo(3L);
        assertThat(response.courtName()).isEqualTo("Court 3");
        assertThat(response.userId()).isEqualTo(42L);
        assertThat(response.userName()).isEqualTo("Ana Client");
        assertThat(response.date()).isEqualTo(DATE);
        assertThat(response.status()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(response.totalPrice()).isEqualTo(new BigDecimal("33.00"));
        assertThat(response.slots()).containsExactly(
                new BookingSlotResponse(LocalTime.of(10, 0), LocalTime.of(11, 0), new BigDecimal("16.50")),
                new BookingSlotResponse(LocalTime.of(11, 0), LocalTime.of(12, 0), new BigDecimal("16.50")));
        verify(users, never()).findById(99L);
    }

    @Test
    void theOwnerBooksManuallyForAClient() {
        BookingResponse response = useCase.execute("owner@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, 42L));

        assertThat(response.userId()).isEqualTo(42L);
        assertThat(response.userName()).isEqualTo("Ana Client");
    }

    @Test
    void theOwnerMustSayForWhichClient() {
        assertThatThrownBy(() -> useCase.execute("owner@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("clientId is required when the owner books");
    }

    @Test
    void theOwnerCanOnlyBookForAnExistingClient() {
        assertThatThrownBy(() -> useCase.execute("owner@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, 1L)))
                .isInstanceOf(NotFoundException.class).hasMessage("Client 1 not found");
        assertThatThrownBy(() -> useCase.execute("owner@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, 7L)))
                .isInstanceOf(NotFoundException.class).hasMessage("Client 7 not found");
    }

    @Test
    void theOwnerCannotBookForAnInactiveClient() {
        ana.setActive(false);

        assertThatThrownBy(() -> useCase.execute("owner@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, 42L)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Client 42 is inactive");
        verify(bookable, never()).lockCourt(any(), org.mockito.ArgumentMatchers.anyBoolean());
        verify(bookings, never()).save(any());
    }

    @Test
    void anUnbookableCourtStopsTheBookingBeforeAnythingIsSaved() {
        when(bookable.lockCourt(9L, false)).thenThrow(NotFoundException.of("Court", 9L));

        assertThatThrownBy(() -> useCase.execute("ana@padel.test", new CreateBookingRequest(9L, DATE, SLOTS, null)))
                .isInstanceOf(NotFoundException.class).hasMessage("Court 9 not found");
        verify(bookings, never()).save(any());
    }

    @Test
    void aTakenSlotIsAConflictAndNothingIsSaved() {
        when(bookable.priced(court, DATE, SLOTS)).thenThrow(new SlotNotAvailableException("taken"));

        assertThatThrownBy(() -> useCase.execute("ana@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, null)))
                .isInstanceOf(SlotNotAvailableException.class);
        verify(bookings, never()).save(any());
    }

    private static User user(long id, String email, String name, Role role) {
        var user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setName(name);
        user.setRole(role);
        return user;
    }
}
