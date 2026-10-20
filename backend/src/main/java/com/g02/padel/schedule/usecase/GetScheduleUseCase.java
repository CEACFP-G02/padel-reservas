package com.g02.padel.schedule.usecase;

import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.schedule.dto.ScheduleResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: get the weekly opening schedule of a court. */
@Service
public class GetScheduleUseCase {

    private final ScheduleRepository scheduleRepository;

    public GetScheduleUseCase(ScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    @Transactional(readOnly = true)
    public ScheduleResponse execute(Long courtId) {
        // TODO: findByCourtId else NotFoundException -> map — see docs/api.md#get-apiv1courtscourtidschedule
        throw new UnsupportedOperationException("TODO: GetSchedule — see docs/api.md#get-apiv1courtscourtidschedule");
    }
}
