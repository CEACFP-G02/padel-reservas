package com.g02.padel.schedule.usecase;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.schedule.dto.ScheduleResponse;
import com.g02.padel.schedule.dto.UpdateScheduleRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (admin): create or replace the weekly opening schedule of a court. */
@Service
public class UpdateScheduleUseCase {

    private final ScheduleRepository scheduleRepository;
    private final CourtRepository courtRepository;

    public UpdateScheduleUseCase(ScheduleRepository scheduleRepository, CourtRepository courtRepository) {
        this.scheduleRepository = scheduleRepository;
        this.courtRepository = courtRepository;
    }

    @Transactional
    public ScheduleResponse execute(Long courtId, UpdateScheduleRequest request) {
        // TODO: court must exist (NotFoundException); upsert Schedule; validate openTime < closeTime and no
        //  overlapping ranges per day; replace openingHours (orphanRemoval) — see docs/api.md#put-apiv1courtscourtidschedule
        throw new UnsupportedOperationException("TODO: UpdateSchedule — see docs/api.md#put-apiv1courtscourtidschedule");
    }
}
