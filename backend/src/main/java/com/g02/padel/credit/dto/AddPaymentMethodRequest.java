package com.g02.padel.credit.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.YearMonth;

/**
 * A card to save. The number is only passed on to the payment gateway; it is never stored, and
 * {@link #toString()} masks it so it cannot end up in a log.
 */
public record AddPaymentMethodRequest(
        @NotBlank @Size(max = 30) String cardNumber,
        @NotNull @JsonFormat(pattern = "yyyy-MM") YearMonth expiry,
        @NotBlank @Size(max = 100) String holder
) {

    @Override
    public String toString() {
        return "AddPaymentMethodRequest[cardNumber=" + masked(cardNumber) + ", expiry=" + expiry + ", holder="
                + holder + "]";
    }

    private static String masked(String cardNumber) {
        String digits = cardNumber == null ? "" : cardNumber.replaceAll("\\D", "");
        return digits.length() < 4 ? "****" : "**** " + digits.substring(digits.length() - 4);
    }
}
