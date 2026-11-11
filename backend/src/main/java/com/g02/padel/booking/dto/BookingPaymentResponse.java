package com.g02.padel.booking.dto;

import java.math.BigDecimal;

/**
 * How a client's booking was paid: {@code creditsUsed} slots by credit, {@code slotsChargedInMoney} charged to
 * the card. {@code paymentMethodId} and {@code chargeReference} are null when nothing was charged.
 */
public record BookingPaymentResponse(
        int creditsUsed,
        int slotsChargedInMoney,
        BigDecimal amountCharged,
        Long paymentMethodId,
        String chargeReference
) {
}
