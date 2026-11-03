package com.g02.padel.schedule.usecase;

import com.g02.padel.court.Court;
import com.g02.padel.schedule.OpeningHours;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.dto.WeekdayHours;
import com.g02.padel.shared.enums.CourtType;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;

final class ScheduleFixtures {

    private ScheduleFixtures() {
    }

    static Court court(long id, boolean active) {
        var court = new Court();
        court.setId(id);
        court.setName("Court " + id);
        court.setType(CourtType.GLASS);
        court.setActive(active);
        return court;
    }

    static Schedule schedule(Court court, int slotMinutes, String price, OpeningHours... hours) {
        var schedule = new Schedule();
        schedule.setId(10L);
        schedule.setCourt(court);
        schedule.setSlotMinutes(slotMinutes);
        schedule.setPrice(new BigDecimal(price));
        for (OpeningHours h : hours) {
            schedule.addOpeningHours(h);
        }
        return schedule;
    }

    static OpeningHours hours(DayOfWeek day, String open, String close) {
        var hours = new OpeningHours();
        hours.setDayOfWeek(day);
        hours.setOpenTime(LocalTime.parse(open));
        hours.setCloseTime(LocalTime.parse(close));
        return hours;
    }

    static WeekdayHours weekday(DayOfWeek day, String open, String close) {
        return new WeekdayHours(day, LocalTime.parse(open), LocalTime.parse(close));
    }
}
