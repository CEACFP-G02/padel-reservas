package com.g02.padel.court.dto;

import com.g02.padel.shared.enums.CourtType;

public record CourtResponse(
        Long id,
        String name,
        CourtType type,
        boolean indoor,
        boolean active
) {
}
