package com.g02.padel.court.usecase;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** UC: list courts (public). */
@Service
public class ListCourtsUseCase {

    private final CourtRepository courtRepository;

    public ListCourtsUseCase(CourtRepository courtRepository) {
        this.courtRepository = courtRepository;
    }

    @Transactional(readOnly = true)
    public List<CourtResponse> execute(boolean includeInactive) {
        // TODO: findAll or findByActiveTrue (inactive only for OWNER) -> map — see docs/api.md#get-apiv1courts
        throw new UnsupportedOperationException("TODO: ListCourts — see docs/api.md#get-apiv1courts");
    }
}
