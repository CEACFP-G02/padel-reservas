package com.g02.padel.credit.gateway;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.g02.padel.shared.enums.CardBrand;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class MockPaymentGatewayTest {

    /** 2026-06-08: cards expiring in June 2026 are still valid, May 2026 is expired. */
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-06-08T10:00:00Z"), ZoneId.of("Europe/Madrid"));
    private static final YearMonth EXPIRY = YearMonth.of(2028, 12);

    private final MockPaymentGateway gateway = new MockPaymentGateway(CLOCK);

    @Nested
    class Tokenize {

        @ParameterizedTest
        @CsvSource({
                "4242424242424242, VISA, 4242",
                "5555555555554444, MASTERCARD, 4444",
                "2223003122003222, MASTERCARD, 3222",
                "378282246310005, AMEX, 0005",
                "6011111111111117, OTHER, 1117"
        })
        void tokenisesAValidCardDerivingBrandAndLastFour(String number, CardBrand brand, String last4) {
            TokenizedCard card = gateway.tokenize(number, EXPIRY, "Ana López");

            assertThat(card.brand()).isEqualTo(brand);
            assertThat(card.last4()).isEqualTo(last4);
            assertThat(card.token()).startsWith("tok_mock_");
        }

        @Test
        void theTokenDoesNotCarryTheCardNumber() {
            TokenizedCard card = gateway.tokenize("4242424242424242", EXPIRY, "Ana López");

            assertThat(card.token()).doesNotContain("4242");
            assertThat(card.toString()).doesNotContain("4242424242424242");
        }

        @Test
        void issuesADifferentTokenEachTime() {
            assertThat(gateway.tokenize("4242424242424242", EXPIRY, "Ana").token())
                    .isNotEqualTo(gateway.tokenize("4242424242424242", EXPIRY, "Ana").token());
        }

        @Test
        void ignoresSpacesAndDashes() {
            assertThat(gateway.tokenize("4242 4242-4242 4242", EXPIRY, "Ana").last4()).isEqualTo("4242");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {
                "4242424242424241",       // Luhn fails
                "424242424242",           // 12 digits
                "42424242424242424242",   // 20 digits
                "4242abcd42424242",       // not digits
                "   "
        })
        void rejectsAnInvalidNumberWithoutEchoingIt(String number) {
            assertThatThrownBy(() -> gateway.tokenize(number, EXPIRY, "Ana"))
                    .isInstanceOf(InvalidCardException.class)
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Invalid card number");
        }

        @Test
        void acceptsACardExpiringThisMonth() {
            assertThat(gateway.tokenize("4242424242424242", YearMonth.of(2026, 6), "Ana").token()).isNotBlank();
        }

        @Test
        void rejectsAnExpiredCard() {
            assertThatThrownBy(() -> gateway.tokenize("4242424242424242", YearMonth.of(2026, 5), "Ana"))
                    .isInstanceOf(InvalidCardException.class)
                    .hasMessage("Card expired");
        }

        @Test
        void requiresAnExpiryAndAHolder() {
            assertThatThrownBy(() -> gateway.tokenize("4242424242424242", null, "Ana"))
                    .isInstanceOf(InvalidCardException.class);
            assertThatThrownBy(() -> gateway.tokenize("4242424242424242", EXPIRY, " "))
                    .isInstanceOf(InvalidCardException.class);
        }
    }

    @Nested
    class Charge {

        @Test
        void approvesAChargeByDefault() {
            String token = gateway.tokenize("4242424242424242", EXPIRY, "Ana").token();

            ChargeResult result = gateway.charge(token, new BigDecimal("140.00"));

            assertThat(result.status()).isEqualTo(ChargeStatus.APPROVED);
            assertThat(result.reference()).startsWith("ch_mock_");
        }

        @Test
        void declinesTheTestCardEndingInZeros() {
            String token = gateway.tokenize("4000 0000 0002 0000", EXPIRY, "Ana").token();

            ChargeResult result = gateway.charge(token, new BigDecimal("140.00"));

            assertThat(result.status()).isEqualTo(ChargeStatus.DECLINED);
        }

        @Test
        void rejectsATokenItDidNotIssue() {
            assertThatThrownBy(() -> gateway.charge("tok_other_123", BigDecimal.TEN))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Unknown payment token");
        }

        @ParameterizedTest
        @ValueSource(strings = {"0", "-1"})
        void rejectsANonPositiveAmount(String amount) {
            String token = gateway.tokenize("4242424242424242", EXPIRY, "Ana").token();

            assertThatThrownBy(() -> gateway.charge(token, new BigDecimal(amount)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Charge amount must be positive");
        }
    }
}
