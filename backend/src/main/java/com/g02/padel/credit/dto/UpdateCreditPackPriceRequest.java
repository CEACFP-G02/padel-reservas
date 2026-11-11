package com.g02.padel.credit.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** Only the price of a pack can change; its size is fixed (any other field in the body is ignored). */
public record UpdateCreditPackPriceRequest(
        @NotNull @DecimalMin("0.00") @Digits(integer = 6, fraction = 2) BigDecimal price
) {
}
