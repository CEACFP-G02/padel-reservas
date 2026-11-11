package com.g02.padel.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/**
 * {@code courtId} is one of the slot's free {@code courtIds} from {@code GET /availability}.
 * {@code clientId} is ignored for CLIENT (taken from the token) and required for an OWNER manual booking.
 * {@code paymentMethodId} is the CLIENT's card for the slots their credits do not cover; ignored for the OWNER.
 */
public record CreateBookingRequest(
        @NotNull Long courtId,
        @NotNull @FutureOrPresent LocalDate date,
        @NotEmpty List<@Valid TimeSlotRequest> slots,
        Long clientId,
        Long paymentMethodId
) {
}
