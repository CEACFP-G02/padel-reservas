package com.g02.padel.courtblock;

import com.g02.padel.courtblock.dto.CourtBlockResponse;

public final class CourtBlockMapper {

    private CourtBlockMapper() {
    }

    public static CourtBlockResponse toResponse(CourtBlock block) {
        return new CourtBlockResponse(block.getId(), block.getCourt().getId(), block.getDate(), block.getStartTime(),
                block.getEndTime(), block.getReason());
    }
}
