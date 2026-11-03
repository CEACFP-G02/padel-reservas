package com.g02.padel.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/** {@code courtId} null keeps the current court. */
public record RescheduleBookingRequest(
        Long courtId,
        @NotNull @FutureOrPresent LocalDate date,
        @NotEmpty List<@Valid TimeSlotRequest> slots
) {
}
