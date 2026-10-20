package com.g02.padel.courtblock.usecase;

import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.courtblock.dto.CourtBlockResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/** UC (owner): list blocks of a court, optionally for one date. */
@Service
public class ListBlocksUseCase {

    private final CourtBlockRepository courtBlockRepository;

    public ListBlocksUseCase(CourtBlockRepository courtBlockRepository) {
        this.courtBlockRepository = courtBlockRepository;
    }

    @Transactional(readOnly = true)
    public List<CourtBlockResponse> execute(Long courtId, LocalDate date) {
        // TODO: date != null -> findByCourtIdAndDate, else findByCourtIdOrderByDateAscStartTimeAsc; map
        //  — see docs/api.md#get-apiv1courtscourtidblocks
        throw new UnsupportedOperationException("TODO: ListBlocks — see docs/api.md#get-apiv1courtscourtidblocks");
    }
}
