package com.g02.padel.availability.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Availability of all active courts for a date. {@code nearbyAvailableDays} is only filled
 * when {@code date} has no free slot at all.
 */
public record AvailabilityResponse(
        LocalDate date,
        List<CourtDayAvailabilityResponse> courts,
        List<LocalDate> nearbyAvailableDays
) {
}
