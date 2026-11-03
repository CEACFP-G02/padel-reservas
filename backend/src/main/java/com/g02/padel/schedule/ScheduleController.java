package com.g02.padel.schedule;

import com.g02.padel.schedule.dto.ScheduleResponse;
import com.g02.padel.schedule.dto.UpdateScheduleRequest;
import com.g02.padel.schedule.usecase.GetScheduleUseCase;
import com.g02.padel.schedule.usecase.UpdateScheduleUseCase;
import com.g02.padel.shared.security.CurrentRole;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/courts/{courtId}/schedule")
public class ScheduleController {

    private final GetScheduleUseCase getSchedule;
    private final UpdateScheduleUseCase updateSchedule;

    public ScheduleController(GetScheduleUseCase getSchedule, UpdateScheduleUseCase updateSchedule) {
        this.getSchedule = getSchedule;
        this.updateSchedule = updateSchedule;
    }

    @GetMapping
    public ScheduleResponse get(@PathVariable Long courtId, Authentication authentication) {
        return getSchedule.execute(courtId, CurrentRole.of(authentication));
    }

    @PutMapping
    @PreAuthorize("hasRole('OWNER')")
    public ScheduleResponse update(@PathVariable Long courtId, @Valid @RequestBody UpdateScheduleRequest request) {
        return updateSchedule.execute(courtId, request);
    }
}
