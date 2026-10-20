package com.g02.padel.courtblock;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface CourtBlockRepository extends JpaRepository<CourtBlock, Long> {

    List<CourtBlock> findByCourtIdAndDate(Long courtId, LocalDate date);

    List<CourtBlock> findByCourtIdOrderByDateAscStartTimeAsc(Long courtId);
}
