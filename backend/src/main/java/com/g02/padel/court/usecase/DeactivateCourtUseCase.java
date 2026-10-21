package com.g02.padel.court.usecase;

import com.g02.padel.court.CourtRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: owner deactivates a court. */
@Service
public class DeactivateCourtUseCase {

    private final CourtRepository courtRepository;

    public DeactivateCourtUseCase(CourtRepository courtRepository) {
        this.courtRepository = courtRepository;
    }

    @Transactional
    public void execute(Long id) {
        // TODO: load (NotFoundException), set active=false (soft delete; existing bookings are kept)
        //  — see docs/api.md#courts--apiv1courts
        throw new UnsupportedOperationException("TODO: DeactivateCourt — see docs/api.md#courts--apiv1courts");
    }
}
