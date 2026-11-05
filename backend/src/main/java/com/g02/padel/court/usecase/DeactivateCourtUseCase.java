package com.g02.padel.court.usecase;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: owner removes a court. Soft delete: it is deactivated so its bookings are kept. */
@Service
public class DeactivateCourtUseCase {

    private final CourtRepository courtRepository;

    public DeactivateCourtUseCase(CourtRepository courtRepository) {
        this.courtRepository = courtRepository;
    }

    @Transactional
    public void execute(Long id) {
        courtRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Court", id))
                .setActive(false);
    }
}
