package com.g02.padel.availability.dto;

import java.time.LocalTime;

public record SlotResponse(
        LocalTime startTime,
        LocalTime endTime,
        boolean available
) {
}
