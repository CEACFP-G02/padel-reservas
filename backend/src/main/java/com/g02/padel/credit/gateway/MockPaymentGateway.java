package com.g02.padel.credit.gateway;

import com.g02.padel.shared.enums.CardBrand;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.YearMonth;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Mocked payment gateway: no network calls and no real money. Cards must have 13–19 digits and pass the Luhn
 * check; charges are approved, except for cards whose number ends in {@code 0000}, which are declined (see the
 * test cards in docs/api.md). The decision is carried by the token, so the card number is never kept.
 */
@Component
public class MockPaymentGateway implements PaymentGateway {

    private static final String TOKEN_PREFIX = "tok_mock_";
    private static final String DECLINE_PREFIX = TOKEN_PREFIX + "decline_";
    private static final String DECLINED_SUFFIX = "0000";

    private final Clock clock;

    public MockPaymentGateway(Clock clock) {
        this.clock = clock;
    }

    @Override
    public TokenizedCard tokenize(String cardNumber, YearMonth expiry, String holder) {
        String digits = digitsOf(cardNumber);
        if (expiry == null) {
            throw new InvalidCardException("Card expiry is required");
        }
        if (expiry.isBefore(YearMonth.now(clock))) {
            throw new InvalidCardException("Card expired");
        }
        if (holder == null || holder.isBlank()) {
            throw new InvalidCardException("Card holder is required");
        }
        String prefix = digits.endsWith(DECLINED_SUFFIX) ? DECLINE_PREFIX : TOKEN_PREFIX;
        return new TokenizedCard(prefix + UUID.randomUUID(), brandOf(digits), digits.substring(digits.length() - 4));
    }

    @Override
    public ChargeResult charge(String token, BigDecimal amount) {
        if (token == null || !token.startsWith(TOKEN_PREFIX)) {
            throw new IllegalArgumentException("Unknown payment token");
        }
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Charge amount must be positive");
        }
        ChargeStatus status = token.startsWith(DECLINE_PREFIX) ? ChargeStatus.DECLINED : ChargeStatus.APPROVED;
        return new ChargeResult(status, "ch_mock_" + UUID.randomUUID());
    }

    /** The card number without spaces or dashes, if it is a plausible one; never echoed in the error. */
    private static String digitsOf(String cardNumber) {
        String digits = cardNumber == null ? "" : cardNumber.replaceAll("[\\s-]", "");
        if (!digits.matches("\\d{13,19}") || !passesLuhn(digits)) {
            throw new InvalidCardException("Invalid card number");
        }
        return digits;
    }

    private static boolean passesLuhn(String digits) {
        int sum = 0;
        for (int i = 0; i < digits.length(); i++) {
            int digit = digits.charAt(digits.length() - 1 - i) - '0';
            if (i % 2 == 1) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
        }
        return sum % 10 == 0;
    }

    private static CardBrand brandOf(String digits) {
        int two = Integer.parseInt(digits.substring(0, 2));
        int four = Integer.parseInt(digits.substring(0, 4));
        if (digits.charAt(0) == '4') {
            return CardBrand.VISA;
        }
        if ((two >= 51 && two <= 55) || (four >= 2221 && four <= 2720)) {
            return CardBrand.MASTERCARD;
        }
        if (two == 34 || two == 37) {
            return CardBrand.AMEX;
        }
        return CardBrand.OTHER;
    }
}
