package com.g02.padel.booking;

import com.g02.padel.availability.CourtDaySlotCalculator;
import com.g02.padel.availability.DaySlot;
import com.g02.padel.booking.dto.TimeSlotRequest;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.shared.exception.NotFoundException;
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

    private final CourtRepository courtRepository;
    private final ScheduleRepository scheduleRepository;
    private final CourtDaySlotCalculator calculator;
    private final Clock clock;

    public BookableSlots(CourtRepository courtRepository, ScheduleRepository scheduleRepository,
                         CourtDaySlotCalculator calculator, Clock clock) {
        this.courtRepository = courtRepository;
        this.scheduleRepository = scheduleRepository;
        this.calculator = calculator;
        this.clock = clock;
    }

    /**
     * The court to book, locked until commit so a concurrent booking of it waits and then sees this one.
     * An inactive court is hidden (404) from clients; the owner is told it is inactive (400).
     */
    public Court lockCourt(Long courtId, boolean owner) {
        Court court = courtRepository.findByIdForUpdate(courtId)
                .filter(c -> c.isActive() || owner)
                .orElseThrow(() -> NotFoundException.of("Court", courtId));
        if (!court.isActive()) {
            throw new IllegalArgumentException("Court " + courtId + " is inactive");
        }
        return court;
    }

    public List<BookingSlot> priced(Court court, LocalDate date, List<TimeSlotRequest> requested) {
        return priced(court, date, requested, null);
    }

    /**
     * Validated, priced slots; {@code ignoredBookingId}'s own slots count as free (reschedule), null for none.
     *
     * @throws IllegalArgumentException   past, not consecutive, or outside the court's schedule (400)
     * @throws SlotNotAvailableException  a slot is taken by a booking or a block (409)
     */
    public List<BookingSlot> priced(Court court, LocalDate date, List<TimeSlotRequest> requested,
                                    Long ignoredBookingId) {
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

        List<DaySlot> grid = calculator.slotsOf(schedule, date, ignoredBookingId);
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
