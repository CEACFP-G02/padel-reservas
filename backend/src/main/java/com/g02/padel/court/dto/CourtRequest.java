package com.g02.padel.court.dto;

import com.g02.padel.shared.enums.CourtType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Body for create and update. */
public record CourtRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull CourtType type,
        @NotNull @DecimalMin("0.00") @Digits(integer = 6, fraction = 2) BigDecimal pricePerHour
) {
}
