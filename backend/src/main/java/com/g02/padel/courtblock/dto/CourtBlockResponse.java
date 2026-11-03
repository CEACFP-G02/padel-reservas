package com.g02.padel.courtblock.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalTime;

public record CourtBlockResponse(
        Long id,
        Long courtId,
        LocalDate date,
        @JsonFormat(pattern = "HH:mm") LocalTime start,
        @JsonFormat(pattern = "HH:mm") LocalTime end,
        String reason
) {
}
