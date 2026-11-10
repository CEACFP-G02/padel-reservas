package com.g02.padel.availability;

import com.g02.padel.booking.BookingRepository;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.schedule.OpeningHours;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.shared.enums.BookingStatus;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.stereotype.Component;

/**
 * Computes a court's slots for one date (availability is never stored):
 * that weekday's opening hours split into {@code slotMinutes} slots, where a slot is taken if it overlaps a
 * non-cancelled booking slot or a court block, or has already started.
 */
@Component
public class CourtDaySlotCalculator {

    private final BookingRepository bookingRepository;
    private final CourtBlockRepository courtBlockRepository;
    private final Clock clock;

    public CourtDaySlotCalculator(BookingRepository bookingRepository, CourtBlockRepository courtBlockRepository,
                                  Clock clock) {
        this.bookingRepository = bookingRepository;
        this.courtBlockRepository = courtBlockRepository;
        this.clock = clock;
    }

    public List<DaySlot> slotsOf(Schedule schedule, LocalDate date) {
        return slotsOf(schedule, date, null);
    }

    /** As {@link #slotsOf(Schedule, LocalDate)}, but the slots of {@code ignoredBookingId} count as free (reschedule). */
    public List<DaySlot> slotsOf(Schedule schedule, LocalDate date, Long ignoredBookingId) {
        List<Range> grid = split(schedule, date);
        if (grid.isEmpty()) {
            return List.of();
        }
        Long courtId = schedule.getCourt().getId();
        List<Range> busy = Stream.concat(
                bookedRanges(courtId, date, ignoredBookingId).stream(), blockedRanges(courtId, date).stream())
                .toList();
        LocalDateTime now = LocalDateTime.now(clock);

        return grid.stream()
                .map(slot -> new DaySlot(slot.start(), slot.end(),
                        date.atTime(slot.start()).isAfter(now) && busy.stream().noneMatch(slot::overlaps)))
                .toList();
    }

    /**
     * Occupancy of a court's day, independent of the clock: the schedule slots not covered by a block, and how
     * many of those a non-cancelled booking takes (same overlap rule as {@link #slotsOf}).
     */
    public DayOccupancy occupancyOf(Schedule schedule, LocalDate date) {
        List<Range> grid = split(schedule, date);
        if (grid.isEmpty()) {
            return new DayOccupancy(0, 0);
        }
        Long courtId = schedule.getCourt().getId();
        List<Range> blocked = blockedRanges(courtId, date);
        List<Range> booked = bookedRanges(courtId, date, null);
        List<Range> bookable = grid.stream().filter(slot -> blocked.stream().noneMatch(slot::overlaps)).toList();
        int taken = (int) bookable.stream().filter(slot -> booked.stream().anyMatch(slot::overlaps)).count();
        return new DayOccupancy(bookable.size(), taken);
    }

    private List<Range> bookedRanges(Long courtId, LocalDate date, Long ignoredBookingId) {
        return bookingRepository.findByCourtIdAndDate(courtId, date).stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .filter(b -> ignoredBookingId == null || !ignoredBookingId.equals(b.getId()))
                .flatMap(b -> b.getSlots().stream())
                .map(s -> new Range(s.getStartTime(), s.getEndTime()))
                .toList();
    }

    private List<Range> blockedRanges(Long courtId, LocalDate date) {
        return courtBlockRepository.findByCourtIdAndDate(courtId, date).stream()
                .map(b -> new Range(b.getStartTime(), b.getEndTime()))
                .toList();
    }

    private static List<Range> split(Schedule schedule, LocalDate date) {
        List<Range> slots = new ArrayList<>();
        schedule.getOpeningHours().stream()
                .filter(h -> h.getDayOfWeek() == date.getDayOfWeek())
                .sorted(Comparator.comparing(OpeningHours::getOpenTime))
                .forEach(h -> {
                    // Minutes since midnight avoid LocalTime wrapping past 24:00.
                    int close = h.getCloseTime().toSecondOfDay() / 60;
                    for (int start = h.getOpenTime().toSecondOfDay() / 60;
                         start + schedule.getSlotMinutes() <= close; start += schedule.getSlotMinutes()) {
                        slots.add(new Range(LocalTime.ofSecondOfDay(start * 60L),
                                LocalTime.ofSecondOfDay((start + schedule.getSlotMinutes()) * 60L)));
                    }
                });
        return slots;
    }

    private record Range(LocalTime start, LocalTime end) {
        boolean overlaps(Range other) {
            return start.isBefore(other.end) && other.start.isBefore(end);
        }
    }
}
