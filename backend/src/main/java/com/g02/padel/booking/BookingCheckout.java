package com.g02.padel.booking;

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
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Pays a client's booking credit first, then money: of N slots, k = min(balance, N) — the earliest — are paid
 * with one CONSUMPTION of -k, and the price snapshots of the rest are charged to the client's card. Runs inside
 * the booking's transaction, so any failure (including a declined charge) leaves nothing behind.
 */
@Component
public class BookingCheckout {

    private final CreditTransactionRepository creditTransactionRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;
    private final PaymentGateway paymentGateway;
    private final Clock clock;

    public BookingCheckout(CreditTransactionRepository creditTransactionRepository,
                           PaymentMethodRepository paymentMethodRepository, UserRepository userRepository,
                           PaymentGateway paymentGateway, Clock clock) {
        this.creditTransactionRepository = creditTransactionRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.userRepository = userRepository;
        this.paymentGateway = paymentGateway;
        this.clock = clock;
    }

    /** What will be paid how; {@code card} is null when no money is charged. */
    public record Plan(User client, int creditsUsed, int slotsInMoney, BigDecimal amount, PaymentMethod card) {
    }

    /**
     * Decides the split and checks the card, before anything is written.
     *
     * @throws IllegalArgumentException a money remainder without {@code paymentMethodId} (400)
     * @throws NotFoundException        the card is missing, removed or someone else's (404)
     */
    public Plan plan(User client, List<BookingSlot> slots, Long paymentMethodId) {
        // Locking the client serializes their bookings, so two of them cannot spend the same credit.
        userRepository.findByIdForUpdate(client.getId());
        long balance = creditTransactionRepository.sumCreditsByUserId(client.getId());
        int credits = (int) Math.min(Math.max(balance, 0), slots.size());
        List<BookingSlot> inMoney = slots.stream()
                .sorted(Comparator.comparing(BookingSlot::getStartTime))
                .skip(credits)
                .toList();
        BigDecimal amount = inMoney.stream().map(BookingSlot::getPrice)
                .reduce(new BigDecimal("0.00"), BigDecimal::add);

        PaymentMethod card = null;
        if (amount.signum() > 0) {
            if (paymentMethodId == null) {
                throw new IllegalArgumentException("paymentMethodId is required to pay the " + inMoney.size()
                        + (inMoney.size() == 1 ? " slot" : " slots") + " not covered by credits");
            }
            card = paymentMethodRepository.findByIdAndUserIdAndActiveTrue(paymentMethodId, client.getId())
                    .orElseThrow(() -> NotFoundException.of("Payment method", paymentMethodId));
        }
        return new Plan(client, credits, inMoney.size(), amount, card);
    }

    /**
     * Writes the consumption and then charges the card, last, so nothing else can fail after the money is taken.
     *
     * @throws PaymentDeclinedException the gateway declined the charge (402)
     */
    public BookingPaymentResponse settle(Plan plan, Booking booking) {
        if (plan.creditsUsed() > 0) {
            CreditTransaction consumption = new CreditTransaction();
            consumption.setUser(plan.client());
            consumption.setType(CreditTransactionType.CONSUMPTION);
            consumption.setCredits(-plan.creditsUsed());
            consumption.setBookingId(booking.getId());
            consumption.setCreatedAt(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC));
            // IDENTITY ids: the row is inserted right away, so a database error surfaces before any charge.
            creditTransactionRepository.save(consumption);
        }

        String chargeReference = null;
        if (plan.card() != null) {
            ChargeResult charge = paymentGateway.charge(plan.card().getGatewayToken(), plan.amount());
            if (charge.status() != ChargeStatus.APPROVED) {
                throw new PaymentDeclinedException("Payment declined: the booking was not made");
            }
            chargeReference = charge.reference();
        }

        booking.setCreditsUsed(plan.creditsUsed());
        booking.setAmountCharged(plan.amount());
        booking.setPaymentMethod(plan.card());
        booking.setChargeReference(chargeReference);
        return new BookingPaymentResponse(plan.creditsUsed(), plan.slotsInMoney(), plan.amount(),
                plan.card() == null ? null : plan.card().getId(), chargeReference);
    }
}
