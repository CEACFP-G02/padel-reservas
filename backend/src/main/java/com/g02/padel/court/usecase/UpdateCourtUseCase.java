package com.g02.padel.court.usecase;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtRequest;
import com.g02.padel.court.dto.CourtResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: owner updates a court. */
@Service
public class UpdateCourtUseCase {

    private final CourtRepository courtRepository;

    public UpdateCourtUseCase(CourtRepository courtRepository) {
        this.courtRepository = courtRepository;
    }

    @Transactional
    public CourtResponse execute(Long id, CourtRequest request) {
        // TODO: load (NotFoundException), apply fields, save — see docs/api.md#put-apiv1courtsid
        throw new UnsupportedOperationException("TODO: UpdateCourt — see docs/api.md#put-apiv1courtsid");
    }
}
