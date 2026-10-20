package com.g02.padel.schedule.dto;

import java.util.List;

public record ScheduleResponse(
        Long courtId,
        int slotDurationMinutes,
        List<OpeningHoursDto> openingHours
) {
}
