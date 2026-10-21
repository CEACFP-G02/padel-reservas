package com.g02.padel.availability.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalTime;

/** One cell of a single court's day grid (admin calendar). */
public record CourtSlotResponse(
        @JsonFormat(pattern = "HH:mm") LocalTime start,
        @JsonFormat(pattern = "HH:mm") LocalTime end,
        boolean available
) {
}
