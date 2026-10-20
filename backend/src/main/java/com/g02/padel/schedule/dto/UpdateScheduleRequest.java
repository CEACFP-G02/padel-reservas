package com.g02.padel.schedule.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** Full replacement of the court's weekly schedule. */
public record UpdateScheduleRequest(
        @Min(30) @Max(240) int slotDurationMinutes,
        @NotNull List<@Valid OpeningHoursDto> openingHours
) {
}
