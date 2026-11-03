package com.g02.padel.court.dto;

import com.g02.padel.shared.enums.CourtType;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Partial update (PATCH): null fields are left unchanged. */
public record UpdateCourtRequest(
        @Size(max = 100) @Pattern(regexp = ".*\\S.*", message = "must not be blank") String name,
        CourtType type,
        Boolean indoor,
        Boolean active
) {
}
