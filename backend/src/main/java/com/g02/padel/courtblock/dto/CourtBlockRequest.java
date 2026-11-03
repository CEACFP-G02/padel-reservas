package com.g02.padel.courtblock.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record CourtBlockRequest(
        @NotNull @FutureOrPresent LocalDate date,
        @NotNull @JsonFormat(pattern = "HH:mm") LocalTime start,
        @NotNull @JsonFormat(pattern = "HH:mm") LocalTime end,
        @Size(max = 255) String reason
) {
}
