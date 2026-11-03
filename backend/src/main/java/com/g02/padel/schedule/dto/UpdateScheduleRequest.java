package com.g02.padel.schedule.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

/** Full replacement of the court's weekly schedule. Days not listed are closed. */
public record UpdateScheduleRequest(
        @Min(30) @Max(240) int slotMinutes,
        @NotNull @DecimalMin("0.00") @Digits(integer = 6, fraction = 2) BigDecimal price,
        @NotNull List<@Valid WeekdayHours> weekdays
) {
}
