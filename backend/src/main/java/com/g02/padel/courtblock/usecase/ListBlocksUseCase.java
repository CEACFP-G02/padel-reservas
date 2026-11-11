package com.g02.padel.courtblock.usecase;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.courtblock.CourtBlock;
import com.g02.padel.courtblock.CourtBlockMapper;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.courtblock.dto.CourtBlockResponse;
import com.g02.padel.shared.exception.NotFoundException;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): list the blocks of a court, optionally within an inclusive date range, by date and start. */
@Service
public class ListBlocksUseCase {

    private final CourtBlockRepository courtBlockRepository;
    private final CourtRepository courtRepository;

    public ListBlocksUseCase(CourtBlockRepository courtBlockRepository, CourtRepository courtRepository) {
        this.courtBlockRepository = courtBlockRepository;
        this.courtRepository = courtRepository;
    }

    @Transactional(readOnly = true)
    public List<CourtBlockResponse> execute(Long courtId, LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("from must not be after to");
        }
        if (!courtRepository.existsById(courtId)) {
            throw NotFoundException.of("Court", courtId);
        }
        Specification<CourtBlock> filter = (block, query, cb) -> cb.equal(block.get("court").get("id"), courtId);
        if (from != null) {
            filter = filter.and((block, query, cb) -> cb.greaterThanOrEqualTo(block.get("date"), from));
        }
        if (to != null) {
            filter = filter.and((block, query, cb) -> cb.lessThanOrEqualTo(block.get("date"), to));
        }
        return courtBlockRepository.findAll(filter, Sort.by("date", "startTime", "id")).stream()
                .map(CourtBlockMapper::toResponse)
                .toList();
    }
}
