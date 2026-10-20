package com.g02.padel.court.usecase;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtRequest;
import com.g02.padel.court.dto.CourtResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: admin creates a court. */
@Service
public class CreateCourtUseCase {

    private final CourtRepository courtRepository;

    public CreateCourtUseCase(CourtRepository courtRepository) {
        this.courtRepository = courtRepository;
    }

    @Transactional
    public CourtResponse execute(CourtRequest request) {
        // TODO: reject duplicate name, save active court — see docs/api.md#post-apiv1courts
        throw new UnsupportedOperationException("TODO: CreateCourt — see docs/api.md#post-apiv1courts");
    }
}
