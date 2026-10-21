package com.g02.padel.courtblock.usecase;

import com.g02.padel.courtblock.CourtBlockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): remove a court block. */
@Service
public class RemoveBlockUseCase {

    private final CourtBlockRepository courtBlockRepository;

    public RemoveBlockUseCase(CourtBlockRepository courtBlockRepository) {
        this.courtBlockRepository = courtBlockRepository;
    }

    @Transactional
    public void execute(Long id) {
        // TODO: findById else NotFoundException; delete — see docs/api.md#court-blocks-maintenance--apiv1courtsidblocks
        throw new UnsupportedOperationException(
                "TODO: RemoveBlock — see docs/api.md#court-blocks-maintenance--apiv1courtsidblocks");
    }
}
