package com.g02.padel.booking;

import static com.g02.padel.credit.usecase.PaymentMethodFixtures.client;
import static com.g02.padel.credit.usecase.PaymentMethodFixtures.method;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.g02.padel.booking.dto.BookingPaymentResponse;
import com.g02.padel.credit.CreditTransaction;
import com.g02.padel.credit.CreditTransactionRepository;
import com.g02.padel.credit.PaymentMethod;
import com.g02.padel.credit.PaymentMethodRepository;
import com.g02.padel.credit.gateway.ChargeResult;
import com.g02.padel.credit.gateway.ChargeStatus;
import com.g02.padel.credit.gateway.PaymentGateway;
import com.g02.padel.shared.enums.CreditTransactionType;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.shared.exception.PaymentDeclinedException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/** Credit first, then money: docs/api.md, "Paying a client booking". */
class BookingCheckoutTest {

    private static final Instant NOW = Instant.parse("2026-06-08T10:15:00Z");

    private final CreditTransactionRepository transactions = mock(CreditTransactionRepository.class);
    private final PaymentMethodRepository methods = mock(PaymentMethodRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final PaymentGateway gateway = mock(PaymentGateway.class);
    private final BookingCheckout checkout = new BookingCheckout(transactions, methods, users, gateway,
            Clock.fixed(NOW, ZoneId.of("Europe/Madrid")));

    private final User ana = client(42L, "ana@padel.test");
    private final PaymentMethod card = method(7L, ana, "4242", true);
    private final List<BookingSlot> twoSlots = List.of(
            BookingSlot.of(LocalTime.of(11, 0), LocalTime.of(12, 0), new BigDecimal("20.00")),
            BookingSlot.of(LocalTime.of(10, 0), LocalTime.of(11, 0), new BigDecimal("16.50")));
    private final Booking booking = new Booking();

    @BeforeEach
    void setUp() {
        when(users.findByIdForUpdate(42L)).thenReturn(Optional.of(ana));
        when(methods.findByIdAndUserIdAndActiveTrue(7L, 42L)).thenReturn(Optional.of(card));
        booking.setId(5001L);
        booking.setUser(ana);
        twoSlots.forEach(booking::addSlot);
    }

    @Test
    void creditsCoveringEverySlotNeedNoCardAndChargeNothing() {
        when(transactions.sumCreditsByUserId(42L)).thenReturn(5L);

        BookingCheckout.Plan plan = checkout.plan(ana, twoSlots, null);
        BookingPaymentResponse payment = checkout.settle(plan, booking);

        CreditTransaction consumption = savedConsumption();
        assertThat(consumption.getUser()).isSameAs(ana);
        assertThat(consumption.getCredits()).isEqualTo(-2);
        assertThat(consumption.getBookingId()).isEqualTo(5001L);
        assertThat(consumption.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 6, 8, 10, 15));
        verifyNoInteractions(gateway);
        assertThat(payment).isEqualTo(new BookingPaymentResponse(2, 0, new BigDecimal("0.00"), null, null));
        assertThat(booking.getCreditsUsed()).isEqualTo(2);
        assertThat(booking.getAmountCharged()).isEqualByComparingTo("0.00");
        assertThat(booking.getPaymentMethod()).isNull();
    }

    @Test
    void aCardSentWhenCreditsCoverEverythingIsIgnored() {
        when(transactions.sumCreditsByUserId(42L)).thenReturn(2L);

        BookingPaymentResponse payment = checkout.settle(checkout.plan(ana, twoSlots, 99L), booking);

        verify(methods, never()).findByIdAndUserIdAndActiveTrue(anyLong(), anyLong());
        verifyNoInteractions(gateway);
        assertThat(payment.creditsUsed()).isEqualTo(2);
    }

    @Test
    void partialCreditCoversTheEarliestSlotsAndTheRestIsChargedToTheCard() {
        when(transactions.sumCreditsByUserId(42L)).thenReturn(1L);
        when(gateway.charge("tok_mock_7", new BigDecimal("20.00")))
                .thenReturn(new ChargeResult(ChargeStatus.APPROVED, "ch_mock_1"));

        BookingPaymentResponse payment = checkout.settle(checkout.plan(ana, twoSlots, 7L), booking);

        assertThat(savedConsumption().getCredits()).isEqualTo(-1);
        verify(gateway).charge("tok_mock_7", new BigDecimal("20.00"));
        assertThat(payment).isEqualTo(new BookingPaymentResponse(1, 1, new BigDecimal("20.00"), 7L, "ch_mock_1"));
        assertThat(booking.getCreditsUsed()).isEqualTo(1);
        assertThat(booking.getAmountCharged()).isEqualByComparingTo("20.00");
        assertThat(booking.getPaymentMethod()).isSameAs(card);
        assertThat(booking.getChargeReference()).isEqualTo("ch_mock_1");
    }

    @Test
    void withoutCreditEverySlotIsChargedAndNoConsumptionIsWritten() {
        when(transactions.sumCreditsByUserId(42L)).thenReturn(0L);
        when(gateway.charge("tok_mock_7", new BigDecimal("36.50")))
                .thenReturn(new ChargeResult(ChargeStatus.APPROVED, "ch_mock_2"));

        BookingPaymentResponse payment = checkout.settle(checkout.plan(ana, twoSlots, 7L), booking);

        verify(transactions, never()).save(any(CreditTransaction.class));
        assertThat(payment).isEqualTo(new BookingPaymentResponse(0, 2, new BigDecimal("36.50"), 7L, "ch_mock_2"));
    }

    @Test
    void aDeclinedChargeFails() {
        when(transactions.sumCreditsByUserId(42L)).thenReturn(0L);
        when(gateway.charge("tok_mock_7", new BigDecimal("36.50")))
                .thenReturn(new ChargeResult(ChargeStatus.DECLINED, "ch_mock_3"));
        BookingCheckout.Plan plan = checkout.plan(ana, twoSlots, 7L);

        assertThatThrownBy(() -> checkout.settle(plan, booking))
                .isInstanceOf(PaymentDeclinedException.class)
                .hasMessage("Payment declined: the booking was not made");
        assertThat(booking.getChargeReference()).isNull();
    }

    @Test
    void aMoneyRemainderNeedsAPaymentMethod() {
        when(transactions.sumCreditsByUserId(42L)).thenReturn(0L);
        assertThatThrownBy(() -> checkout.plan(ana, twoSlots, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("paymentMethodId is required to pay the 2 slots not covered by credits");

        when(transactions.sumCreditsByUserId(42L)).thenReturn(1L);
        assertThatThrownBy(() -> checkout.plan(ana, twoSlots, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("paymentMethodId is required to pay the 1 slot not covered by credits");
        verifyNoInteractions(gateway);
    }

    @Test
    void thePaymentMethodMustBeTheCallersActiveOne() {
        when(transactions.sumCreditsByUserId(42L)).thenReturn(0L);
        when(methods.findByIdAndUserIdAndActiveTrue(8L, 42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> checkout.plan(ana, twoSlots, 8L))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Payment method 8 not found");
        verifyNoInteractions(gateway);
    }

    @Test
    void aFreeRemainderIsNotChargedAndNeedsNoCard() {
        when(transactions.sumCreditsByUserId(42L)).thenReturn(0L);
        List<BookingSlot> free = List.of(BookingSlot.of(LocalTime.of(10, 0), LocalTime.of(11, 0), new BigDecimal("0.00")));

        BookingPaymentResponse payment = checkout.settle(checkout.plan(ana, free, null), booking);

        verifyNoInteractions(gateway);
        assertThat(payment).isEqualTo(new BookingPaymentResponse(0, 1, new BigDecimal("0.00"), null, null));
    }

    @Test
    void theClientIsLockedSoConcurrentBookingsCannotSpendTheSameCredit() {
        when(transactions.sumCreditsByUserId(42L)).thenReturn(5L);

        checkout.plan(ana, twoSlots, null);

        verify(users).findByIdForUpdate(42L);
    }

    private CreditTransaction savedConsumption() {
        ArgumentCaptor<CreditTransaction> saved = ArgumentCaptor.forClass(CreditTransaction.class);
        verify(transactions).save(saved.capture());
        assertThat(saved.getValue().getType()).isEqualTo(CreditTransactionType.CONSUMPTION);
        assertThat(saved.getValue().getAmount()).isNull();
        return saved.getValue();
    }
}
