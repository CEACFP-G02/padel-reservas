package com.g02.padel.schedule.dto;

import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record OpeningHoursDto(
        @NotNull DayOfWeek dayOfWeek,
        @NotNull LocalTime openTime,
        @NotNull LocalTime closeTime
) {
}
