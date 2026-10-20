package com.g02.padel.court.dto;

import com.g02.padel.shared.enums.CourtType;

import java.math.BigDecimal;

public record CourtResponse(
        Long id,
        String name,
        CourtType type,
        BigDecimal pricePerHour,
        boolean active
) {
}
