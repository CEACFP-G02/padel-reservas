package com.g02.padel.courtblock.usecase;

import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): remove a court block; its slots become bookable again. */
@Service
public class RemoveBlockUseCase {

    private final CourtBlockRepository courtBlockRepository;

    public RemoveBlockUseCase(CourtBlockRepository courtBlockRepository) {
        this.courtBlockRepository = courtBlockRepository;
    }

    @Transactional
    public void execute(Long id) {
        courtBlockRepository.delete(
                courtBlockRepository.findById(id).orElseThrow(() -> NotFoundException.of("Court block", id)));
    }
}
