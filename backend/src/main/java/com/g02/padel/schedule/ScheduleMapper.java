package com.g02.padel.schedule;

import com.g02.padel.schedule.dto.ScheduleResponse;
import com.g02.padel.schedule.dto.WeekdayHours;
import java.util.Comparator;

/** Entity -> DTO for schedules; opening ranges are listed by weekday (Monday first), then by opening time. */
public final class ScheduleMapper {

    private ScheduleMapper() {
    }

    public static ScheduleResponse toResponse(Schedule schedule) {
        return new ScheduleResponse(
                schedule.getSlotMinutes(),
                schedule.getPrice(),
                schedule.getOpeningHours().stream()
                        .sorted(Comparator.comparing(OpeningHours::getDayOfWeek).thenComparing(OpeningHours::getOpenTime))
                        .map(h -> new WeekdayHours(h.getDayOfWeek(), h.getOpenTime(), h.getCloseTime()))
                        .toList());
    }
}
