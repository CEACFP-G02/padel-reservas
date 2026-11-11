package com.g02.padel.courtblock.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

/** Range and "not in the past" are checked by the use case against the server clock. */
public record CourtBlockRequest(
        @NotNull LocalDate date,
        @NotNull @JsonFormat(pattern = "HH:mm") LocalTime start,
        @NotNull @JsonFormat(pattern = "HH:mm") LocalTime end,
        @Size(max = 255) String reason
) {
}
