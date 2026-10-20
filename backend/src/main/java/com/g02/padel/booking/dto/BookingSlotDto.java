package com.g02.padel.booking.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record BookingSlotDto(
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime
) {
}
