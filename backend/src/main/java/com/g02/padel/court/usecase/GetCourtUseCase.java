package com.g02.padel.court.usecase;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: get one court (public). */
@Service
public class GetCourtUseCase {

    private final CourtRepository courtRepository;

    public GetCourtUseCase(CourtRepository courtRepository) {
        this.courtRepository = courtRepository;
    }

    @Transactional(readOnly = true)
    public CourtResponse execute(Long id) {
        // TODO: findById else NotFoundException -> map — see docs/api.md#get-apiv1courtsid
        throw new UnsupportedOperationException("TODO: GetCourt — see docs/api.md#get-apiv1courtsid");
    }
}
