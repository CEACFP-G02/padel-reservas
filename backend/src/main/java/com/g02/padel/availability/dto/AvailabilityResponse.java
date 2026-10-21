package com.g02.padel.availability.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Slots of {@code requestedDate} with at least {@code courtsRequested} free courts. When {@code available} is
 * false, {@code slots} is empty and {@code alternativeDays} lists nearby days that have room.
 */
public record AvailabilityResponse(
        LocalDate requestedDate,
        int courtsRequested,
        boolean available,
        List<SlotResponse> slots,
        List<AlternativeDay> alternativeDays
) {
}
