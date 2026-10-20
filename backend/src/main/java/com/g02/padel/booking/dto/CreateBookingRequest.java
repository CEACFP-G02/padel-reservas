package com.g02.padel.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/** {@code userId} is only honoured for ADMIN (booking on behalf of a client); clients book for themselves. */
public record CreateBookingRequest(
        @NotNull Long courtId,
        @NotNull @FutureOrPresent LocalDate date,
        @NotEmpty List<@Valid BookingSlotDto> slots,
        Long userId
) {
}
