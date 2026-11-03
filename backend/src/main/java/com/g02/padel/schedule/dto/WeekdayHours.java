package com.g02.padel.schedule.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record WeekdayHours(
        @NotNull DayOfWeek day,
        @NotNull @JsonFormat(pattern = "HH:mm") LocalTime open,
        @NotNull @JsonFormat(pattern = "HH:mm") LocalTime close
) {
}
