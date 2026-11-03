package com.g02.padel.court.usecase;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.UpdateCourtRequest;
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
    public CourtResponse execute(Long id, UpdateCourtRequest request) {
        // TODO: load (NotFoundException), apply non-null fields (reject duplicate name), save
        //  — see docs/api.md#courts--apiv1courts
        throw new UnsupportedOperationException("TODO: UpdateCourt — see docs/api.md#courts--apiv1courts");
    }
}
