package com.g02.padel.courtblock;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;

public interface CourtBlockRepository extends JpaRepository<CourtBlock, Long>, JpaSpecificationExecutor<CourtBlock> {

    List<CourtBlock> findByCourtIdAndDate(Long courtId, LocalDate date);

    List<CourtBlock> findByCourtIdOrderByDateAscStartTimeAsc(Long courtId);
}
