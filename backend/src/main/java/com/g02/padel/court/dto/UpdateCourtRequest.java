package com.g02.padel.court.dto;

import com.g02.padel.shared.enums.CourtType;
import jakarta.validation.constraints.Size;

/** Partial update (PATCH): null fields are left unchanged. */
public record UpdateCourtRequest(
        @Size(min = 1, max = 100) String name,
        CourtType type,
        Boolean indoor,
        Boolean active
) {
}
