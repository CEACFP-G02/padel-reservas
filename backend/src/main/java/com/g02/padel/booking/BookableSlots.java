package com.g02.padel.booking;

import com.g02.padel.availability.CourtDaySlotCalculator;
import com.g02.padel.availability.DaySlot;
import com.g02.padel.booking.dto.TimeSlotRequest;
import com.g02.padel.court.Court;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.shared.exception.SlotNotAvailableException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Turns requested times into bookable, priced slots. Free/taken comes from the availability computation
 * ({@link CourtDaySlotCalculator}), so booking and availability can never disagree.
 */
@Component
public class BookableSlots {

    private final ScheduleRepository scheduleRepository;
    private final CourtDaySlotCalculator calculator;
    private final Clock clock;

    public BookableSlots(ScheduleRepository scheduleRepository, CourtDaySlotCalculator calculator, Clock clock) {
        this.scheduleRepository = scheduleRepository;
        this.calculator = calculator;
        this.clock = clock;
    }

    /**
     * @throws IllegalArgumentException   past, not consecutive, or outside the court's schedule (400)
     * @throws SlotNotAvailableException  a slot is taken by a booking or a block (409)
     */
    public List<BookingSlot> priced(Court court, LocalDate date, List<TimeSlotRequest> requested) {
        Schedule schedule = scheduleRepository.findByCourtId(court.getId())
                .orElseThrow(() -> new IllegalArgumentException("Court " + court.getId() + " has no schedule"));
        List<TimeSlotRequest> sorted = requested.stream().sorted(Comparator.comparing(TimeSlotRequest::start)).toList();
        for (int i = 1; i < sorted.size(); i++) {
            if (!sorted.get(i).start().equals(sorted.get(i - 1).end())) {
                throw new IllegalArgumentException("Slots must be consecutive");
            }
        }
        if (!date.atTime(sorted.get(0).start()).isAfter(LocalDateTime.now(clock))) {
            throw new IllegalArgumentException("Cannot book a slot that has already started");
        }

        List<DaySlot> grid = calculator.slotsOf(schedule, date);
        return sorted.stream().map(slot -> {
            String label = slot.start() + "-" + slot.end();
            DaySlot cell = grid.stream()
                    .filter(c -> c.start().equals(slot.start()) && c.end().equals(slot.end()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException(
                            label + " is outside the schedule of court " + court.getId()));
            if (!cell.free()) {
                throw new SlotNotAvailableException(label + " is not available on court " + court.getId());
            }
            return BookingSlot.of(slot.start(), slot.end(), schedule.getPrice());
        }).toList();
    }
}
