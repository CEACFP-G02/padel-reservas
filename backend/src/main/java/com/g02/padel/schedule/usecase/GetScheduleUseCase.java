package com.g02.padel.schedule.usecase;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.ScheduleMapper;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.schedule.dto.ScheduleResponse;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: get the weekly opening schedule and slot price of a court. An inactive court is hidden from non-owners. */
@Service
public class GetScheduleUseCase {

    private final ScheduleRepository scheduleRepository;
    private final CourtRepository courtRepository;

    public GetScheduleUseCase(ScheduleRepository scheduleRepository, CourtRepository courtRepository) {
        this.scheduleRepository = scheduleRepository;
        this.courtRepository = courtRepository;
    }

    @Transactional(readOnly = true)
    public ScheduleResponse execute(Long courtId, Role viewer) {
        courtRepository.findById(courtId)
                .filter(court -> court.isActive() || viewer == Role.OWNER)
                .orElseThrow(() -> NotFoundException.of("Court", courtId));
        return scheduleRepository.findByCourtId(courtId)
                .map(ScheduleMapper::toResponse)
                .orElseThrow(() -> new NotFoundException("Schedule of court " + courtId + " not found"));
    }
}
