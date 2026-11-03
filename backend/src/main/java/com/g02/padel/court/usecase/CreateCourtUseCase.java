package com.g02.padel.court.usecase;

import com.g02.padel.court.Court;
import com.g02.padel.court.CourtMapper;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtRequest;
import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.shared.exception.ConflictException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: owner creates a court. Names are unique, ignoring case. */
@Service
public class CreateCourtUseCase {

    private final CourtRepository courtRepository;

    public CreateCourtUseCase(CourtRepository courtRepository) {
        this.courtRepository = courtRepository;
    }

    @Transactional
    public CourtResponse execute(CourtRequest request) {
        String name = request.name().trim();
        if (courtRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("Court name " + name + " is already in use");
        }
        var court = new Court();
        court.setName(name);
        court.setType(request.type());
        court.setIndoor(request.indoor());
        court.setActive(request.active() == null || request.active());
        return CourtMapper.toResponse(courtRepository.save(court));
    }
}
