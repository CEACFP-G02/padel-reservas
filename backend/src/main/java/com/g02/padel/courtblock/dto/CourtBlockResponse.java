package com.g02.padel.courtblock.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record CourtBlockResponse(
        Long id,
        Long courtId,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        String reason,
        LocalDateTime createdAt
) {
}
