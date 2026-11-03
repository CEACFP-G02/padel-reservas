package com.g02.padel.court;

import com.g02.padel.court.dto.CourtResponse;

/** Entity -> DTO for courts. */
public final class CourtMapper {

    private CourtMapper() {
    }

    public static CourtResponse toResponse(Court court) {
        return new CourtResponse(court.getId(), court.getName(), court.getType(), court.isIndoor(), court.isActive());
    }
}
