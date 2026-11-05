package com.g02.padel.court.usecase;

import com.g02.padel.court.Court;
import com.g02.padel.court.CourtMapper;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC: list courts, optionally filtered by type and active flag (null = no filter), paged. Only an OWNER sees
 * inactive courts; for anyone else they are always excluded, whatever the {@code active} filter says.
 */
@Service
public class ListCourtsUseCase {

    private final CourtRepository courtRepository;

    public ListCourtsUseCase(CourtRepository courtRepository) {
        this.courtRepository = courtRepository;
    }

    @Transactional(readOnly = true)
    public Page<CourtResponse> execute(CourtType type, Boolean active, Role viewer, Pageable pageable) {
        Specification<Court> filter = Specification.where(null);
        if (type != null) {
            filter = filter.and((court, query, cb) -> cb.equal(court.get("type"), type));
        }
        if (active != null) {
            filter = filter.and((court, query, cb) -> cb.equal(court.get("active"), active));
        }
        if (viewer != Role.OWNER) {
            filter = filter.and((court, query, cb) -> cb.isTrue(court.get("active")));
        }
        return courtRepository.findAll(filter, pageable).map(CourtMapper::toResponse);
    }
}
