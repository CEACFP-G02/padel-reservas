package com.g02.padel.credit.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.g02.padel.shared.enums.CardBrand;

import java.time.YearMonth;

/** A saved card as the client sees it: never the card number nor the gateway token. */
public record PaymentMethodResponse(
        Long id,
        CardBrand brand,
        String last4,
        @JsonFormat(pattern = "yyyy-MM") YearMonth expiry,
        @JsonProperty("default") boolean defaultMethod
) {
}
