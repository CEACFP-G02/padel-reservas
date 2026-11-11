package com.g02.padel.booking.usecase;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.court;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.g02.padel.booking.BookableSlots;
import com.g02.padel.booking.BookingCheckout;
import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.BookingSlot;
import com.g02.padel.booking.dto.BookingCreatedResponse;
import com.g02.padel.booking.dto.BookingPaymentResponse;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.booking.dto.BookingSlotResponse;
import com.g02.padel.booking.dto.CreateBookingRequest;
import com.g02.padel.booking.dto.TimeSlotRequest;
import com.g02.padel.court.Court;
import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.shared.exception.PaymentDeclinedException;
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
import org.mockito.InOrder;

class CreateBookingUseCaseTest {

    private static final LocalDate DATE = MONDAY.plusDays(7);
    private static final List<TimeSlotRequest> SLOTS = List.of(
            new TimeSlotRequest(LocalTime.of(10, 0), LocalTime.of(11, 0)),
            new TimeSlotRequest(LocalTime.of(11, 0), LocalTime.of(12, 0)));

    private final BookingRepository bookings = mock(BookingRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final BookableSlots bookable = mock(BookableSlots.class);
    private final BookingCheckout checkout = mock(BookingCheckout.class);
    private final CreateBookingUseCase useCase = new CreateBookingUseCase(bookings, users, bookable, checkout);

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
        BookingResponse response = useCase.execute("ana@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, 99L, null))
                .booking();

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
        BookingCreatedResponse response = useCase.execute("owner@padel.test",
                new CreateBookingRequest(3L, DATE, SLOTS, 42L, 7L));

        assertThat(response.booking().userId()).isEqualTo(42L);
        assertThat(response.booking().userName()).isEqualTo("Ana Client");
        // T39: an owner manual booking neither spends the client's credits nor charges a card.
        assertThat(response.payment()).isNull();
        verifyNoInteractions(checkout);
    }

    @Test
    void aClientBookingIsPaidCreditFirstAfterTheSlotsAreCheckedAndTheBookingSaved() {
        BookingCheckout.Plan plan = new BookingCheckout.Plan(ana, 1, 1, new BigDecimal("16.50"), null);
        BookingPaymentResponse paid = new BookingPaymentResponse(1, 1, new BigDecimal("16.50"), 7L, "ch_mock_1");
        when(checkout.plan(eq(ana), anyList(), eq(7L))).thenReturn(plan);
        when(checkout.settle(eq(plan), any(Booking.class))).thenReturn(paid);

        BookingCreatedResponse response = useCase.execute("ana@padel.test",
                new CreateBookingRequest(3L, DATE, SLOTS, null, 7L));

        assertThat(response.payment()).isEqualTo(paid);
        assertThat(response.booking().id()).isEqualTo(5001L);
        InOrder order = inOrder(bookable, checkout, bookings);
        order.verify(bookable).priced(court, DATE, SLOTS);
        order.verify(checkout).plan(eq(ana), anyList(), eq(7L));
        order.verify(bookings).save(any(Booking.class));
        order.verify(checkout).settle(eq(plan), any(Booking.class));
    }

    @Test
    void aPaymentThatCannotBeMadeStopsTheBookingBeforeItIsSaved() {
        when(checkout.plan(eq(ana), anyList(), eq(null)))
                .thenThrow(new IllegalArgumentException("paymentMethodId is required to pay the 2 slots not covered by credits"));

        assertThatThrownBy(() -> useCase.execute("ana@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, null, null)))
                .isInstanceOf(IllegalArgumentException.class);
        verify(bookings, never()).save(any());
    }

    @Test
    void aDeclinedChargeFailsTheWholeBooking() {
        when(checkout.plan(eq(ana), anyList(), eq(7L)))
                .thenReturn(new BookingCheckout.Plan(ana, 0, 2, new BigDecimal("33.00"), null));
        when(checkout.settle(any(), any())).thenThrow(new PaymentDeclinedException("Payment declined: the booking was not made"));

        // The use case is @Transactional: the exception rolls the saved booking back (CLIENT payment IT).
        assertThatThrownBy(() -> useCase.execute("ana@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, null, 7L)))
                .isInstanceOf(PaymentDeclinedException.class);
    }

    @Test
    void theOwnerMustSayForWhichClient() {
        assertThatThrownBy(() -> useCase.execute("owner@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("clientId is required when the owner books");
    }

    @Test
    void theOwnerCanOnlyBookForAnExistingClient() {
        assertThatThrownBy(() -> useCase.execute("owner@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, 1L, null)))
                .isInstanceOf(NotFoundException.class).hasMessage("Client 1 not found");
        assertThatThrownBy(() -> useCase.execute("owner@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, 7L, null)))
                .isInstanceOf(NotFoundException.class).hasMessage("Client 7 not found");
    }

    @Test
    void theOwnerCannotBookForAnInactiveClient() {
        ana.setActive(false);

        assertThatThrownBy(() -> useCase.execute("owner@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, 42L, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Client 42 is inactive");
        verify(bookable, never()).lockCourt(any(), org.mockito.ArgumentMatchers.anyBoolean());
        verify(bookings, never()).save(any());
    }

    @Test
    void anUnbookableCourtStopsTheBookingBeforeAnythingIsSaved() {
        when(bookable.lockCourt(9L, false)).thenThrow(NotFoundException.of("Court", 9L));

        assertThatThrownBy(() -> useCase.execute("ana@padel.test", new CreateBookingRequest(9L, DATE, SLOTS, null, null)))
                .isInstanceOf(NotFoundException.class).hasMessage("Court 9 not found");
        verify(bookings, never()).save(any());
    }

    @Test
    void aTakenSlotIsAConflictAndNothingIsSaved() {
        when(bookable.priced(court, DATE, SLOTS)).thenThrow(new SlotNotAvailableException("taken"));

        assertThatThrownBy(() -> useCase.execute("ana@padel.test", new CreateBookingRequest(3L, DATE, SLOTS, null, null)))
                .isInstanceOf(SlotNotAvailableException.class);
        verify(bookings, never()).save(any());
        verifyNoInteractions(checkout);
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
