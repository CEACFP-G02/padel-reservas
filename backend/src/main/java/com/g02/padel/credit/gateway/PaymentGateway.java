package com.g02.padel.credit.gateway;

import java.math.BigDecimal;
import java.time.YearMonth;

/**
 * Port to the card payment provider. Card numbers only ever reach the gateway: callers keep the returned token
 * and the safe card details, never the number itself.
 */
public interface PaymentGateway {

    /**
     * Validates and tokenises a card.
     *
     * @throws InvalidCardException if the number, expiry or holder is not acceptable
     */
    TokenizedCard tokenize(String cardNumber, YearMonth expiry, String holder);

    /**
     * Charges a positive amount (EUR) to a token issued by {@link #tokenize}.
     *
     * @throws IllegalArgumentException for an unknown token or a non-positive amount
     */
    ChargeResult charge(String token, BigDecimal amount);
}
