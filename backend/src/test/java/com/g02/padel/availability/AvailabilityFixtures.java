package com.g02.padel.availability;

import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingSlot;
import com.g02.padel.court.Court;
import com.g02.padel.courtblock.CourtBlock;
import com.g02.padel.schedule.OpeningHours;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.shared.enums.CourtType;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

public final class AvailabilityFixtures {

    public static final ZoneId ZONE = ZoneId.of("Europe/Madrid");
    /** A Monday. */
    public static final LocalDate MONDAY = LocalDate.of(2026, 6, 8);

    private AvailabilityFixtures() {
    }

    public static Clock clockAt(LocalDate date, String time) {
        return Clock.fixed(date.atTime(LocalTime.parse(time)).atZone(ZONE).toInstant(), ZONE);
    }

    public static Court court(long id, boolean active) {
        var court = new Court();
        court.setId(id);
        court.setName("Court " + id);
        court.setType(CourtType.GLASS);
        court.setActive(active);
        return court;
    }

    public static Schedule schedule(Court court, int slotMinutes, String price, OpeningHours... hours) {
        var schedule = new Schedule();
        schedule.setId(court.getId() * 10);
        schedule.setCourt(court);
        schedule.setSlotMinutes(slotMinutes);
        schedule.setPrice(new BigDecimal(price));
        for (OpeningHours h : hours) {
            schedule.addOpeningHours(h);
        }
        return schedule;
    }

    public static OpeningHours hours(DayOfWeek day, String open, String close) {
        var hours = new OpeningHours();
        hours.setDayOfWeek(day);
        hours.setOpenTime(LocalTime.parse(open));
        hours.setCloseTime(LocalTime.parse(close));
        return hours;
    }

    /** A booking on {@code court} with one slot per {@code "HH:mm-HH:mm"} range. */
    public static Booking booking(Court court, LocalDate date, BookingStatus status, String... ranges) {
        var booking = new Booking();
        booking.setCourt(court);
        booking.setDate(date);
        booking.setStatus(status);
        for (String range : ranges) {
            String[] parts = range.split("-");
            var slot = new BookingSlot();
            slot.setStartTime(LocalTime.parse(parts[0]));
            slot.setEndTime(LocalTime.parse(parts[1]));
            booking.addSlot(slot);
        }
        return booking;
    }

    public static CourtBlock block(Court court, LocalDate date, String start, String end) {
        var block = new CourtBlock();
        block.setCourt(court);
        block.setDate(date);
        block.setStartTime(LocalTime.parse(start));
        block.setEndTime(LocalTime.parse(end));
        block.setReason("Maintenance");
        return block;
    }
}
