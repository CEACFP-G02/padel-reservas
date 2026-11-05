package com.g02.padel.court.usecase;

import com.g02.padel.court.CourtMapper;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: get one court. An inactive court exists only for an OWNER; anyone else gets 404. */
@Service
public class GetCourtUseCase {

    private final CourtRepository courtRepository;

    public GetCourtUseCase(CourtRepository courtRepository) {
        this.courtRepository = courtRepository;
    }

    @Transactional(readOnly = true)
    public CourtResponse execute(Long id, Role viewer) {
        return courtRepository.findById(id)
                .filter(court -> court.isActive() || viewer == Role.OWNER)
                .map(CourtMapper::toResponse)
                .orElseThrow(() -> NotFoundException.of("Court", id));
    }
}
