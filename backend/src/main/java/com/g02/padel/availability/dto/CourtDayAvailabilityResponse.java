package com.g02.padel.availability.dto;

import java.time.LocalDate;
import java.util.List;

public record CourtDayAvailabilityResponse(
        Long courtId,
        String courtName,
        LocalDate date,
        List<SlotResponse> slots
) {
}
