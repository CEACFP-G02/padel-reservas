package com.g02.padel.court.usecase;

import com.g02.padel.court.CourtMapper;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.court.dto.UpdateCourtRequest;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: owner updates a court (PATCH: only the fields present change). */
@Service
public class UpdateCourtUseCase {

    private final CourtRepository courtRepository;

    public UpdateCourtUseCase(CourtRepository courtRepository) {
        this.courtRepository = courtRepository;
    }

    @Transactional
    public CourtResponse execute(Long id, UpdateCourtRequest request) {
        var court = courtRepository.findById(id).orElseThrow(() -> NotFoundException.of("Court", id));
        if (request.name() != null) {
            String name = request.name().trim();
            if (courtRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
                throw new ConflictException("Court name " + name + " is already in use");
            }
            court.setName(name);
        }
        if (request.type() != null) {
            court.setType(request.type());
        }
        if (request.indoor() != null) {
            court.setIndoor(request.indoor());
        }
        if (request.active() != null) {
            court.setActive(request.active());
        }
        return CourtMapper.toResponse(court);
    }
}
