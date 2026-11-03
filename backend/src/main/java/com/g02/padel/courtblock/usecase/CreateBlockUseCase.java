package com.g02.padel.courtblock.usecase;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.courtblock.dto.CourtBlockRequest;
import com.g02.padel.courtblock.dto.CourtBlockResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): block a court for a time range on a date. */
@Service
public class CreateBlockUseCase {

    private final CourtBlockRepository courtBlockRepository;
    private final CourtRepository courtRepository;

    public CreateBlockUseCase(CourtBlockRepository courtBlockRepository, CourtRepository courtRepository) {
        this.courtBlockRepository = courtBlockRepository;
        this.courtRepository = courtRepository;
    }

    @Transactional
    public CourtBlockResponse execute(Long courtId, CourtBlockRequest request) {
        // TODO: court must exist (NotFoundException); start < end; decide policy for overlapping
        //  CONFIRMED bookings (reject vs. warn) per docs; save
        //  — see docs/api.md#court-blocks-maintenance--apiv1courtsidblocks
        throw new UnsupportedOperationException(
                "TODO: CreateBlock — see docs/api.md#court-blocks-maintenance--apiv1courtsidblocks");
    }
}
