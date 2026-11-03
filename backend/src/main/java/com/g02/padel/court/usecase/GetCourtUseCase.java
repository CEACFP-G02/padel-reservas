package com.g02.padel.court.usecase;

import com.g02.padel.court.CourtMapper;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: get one court. */
@Service
public class GetCourtUseCase {

    private final CourtRepository courtRepository;

    public GetCourtUseCase(CourtRepository courtRepository) {
        this.courtRepository = courtRepository;
    }

    @Transactional(readOnly = true)
    public CourtResponse execute(Long id) {
        return courtRepository.findById(id)
                .map(CourtMapper::toResponse)
                .orElseThrow(() -> NotFoundException.of("Court", id));
    }
}
