package com.g02.padel.booking.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record TimeSlotRequest(
        @NotNull @JsonFormat(pattern = "HH:mm") LocalTime start,
        @NotNull @JsonFormat(pattern = "HH:mm") LocalTime end
) {
}
