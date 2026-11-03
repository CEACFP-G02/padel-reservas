package com.g02.padel.availability.dto;

import java.time.LocalDate;

public record AlternativeDay(
        LocalDate date,
        int freeSlotCount
) {
}
