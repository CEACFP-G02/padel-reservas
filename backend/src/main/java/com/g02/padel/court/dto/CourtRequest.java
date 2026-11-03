package com.g02.padel.court.dto;

import com.g02.padel.shared.enums.CourtType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Create body; {@code active} defaults to true when omitted. */
public record CourtRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull CourtType type,
        @NotNull Boolean indoor,
        Boolean active
) {
}
