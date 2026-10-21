package com.g02.padel.schedule.dto;

import java.math.BigDecimal;
import java.util.List;

/** {@code price} is the price of one slot of {@code slotMinutes}. */
public record ScheduleResponse(
        int slotMinutes,
        BigDecimal price,
        List<WeekdayHours> weekdays
) {
}
