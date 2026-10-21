package com.g02.padel.court.usecase;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.shared.enums.CourtType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: list courts (public). */
@Service
public class ListCourtsUseCase {

    private final CourtRepository courtRepository;

    public ListCourtsUseCase(CourtRepository courtRepository) {
        this.courtRepository = courtRepository;
    }

    @Transactional(readOnly = true)
    public Page<CourtResponse> execute(CourtType type, Boolean active, Pageable pageable) {
        // TODO: paged query with the non-null filters (inactive courts only for OWNER) -> map
        //  — see docs/api.md#courts--apiv1courts
        throw new UnsupportedOperationException("TODO: ListCourts — see docs/api.md#get-apiv1courts");
    }
}
