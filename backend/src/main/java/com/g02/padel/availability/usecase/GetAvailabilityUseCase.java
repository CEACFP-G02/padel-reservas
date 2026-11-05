package com.g02.padel.availability.usecase;

import com.g02.padel.availability.CourtDaySlotCalculator;
import com.g02.padel.availability.DaySlot;
import com.g02.padel.availability.dto.AlternativeDay;
import com.g02.padel.availability.dto.AvailabilityResponse;
import com.g02.padel.availability.dto.SlotResponse;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC: slots of a date with at least {@code courts} free active courts (computed, never stored).
 * If there are none, proposes the days with such a slot in {@code [max(today, date − N), date + N]}.
 */
@Service
public class GetAvailabilityUseCase {

    private final CourtRepository courtRepository;
    private final ScheduleRepository scheduleRepository;
    private final CourtDaySlotCalculator calculator;
    private final Clock clock;
    private final int nearbyDaysWindow;

    public GetAvailabilityUseCase(CourtRepository courtRepository,
                                  ScheduleRepository scheduleRepository,
                                  CourtDaySlotCalculator calculator,
                                  Clock clock,
                                  @Value("${app.availability.nearby-days-window}") int nearbyDaysWindow) {
        this.courtRepository = courtRepository;
        this.scheduleRepository = scheduleRepository;
        this.calculator = calculator;
        this.clock = clock;
        this.nearbyDaysWindow = nearbyDaysWindow;
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse execute(LocalDate date, int courts) {
        LocalDate today = LocalDate.now(clock);
        if (date.isBefore(today)) {
            throw new IllegalArgumentException("date must be today or later");
        }
        if (courts < 1) {
            throw new IllegalArgumentException("courts must be at least 1");
        }
        List<Schedule> scheduled = courtRepository.findByActiveTrue().stream()
                .sorted(Comparator.comparing(Court::getId))
                .map(court -> scheduleRepository.findByCourtId(court.getId()))
                .flatMap(Optional::stream)
                .toList();

        List<SlotResponse> slots = slotsOn(scheduled, date, courts);
        if (!slots.isEmpty()) {
            return new AvailabilityResponse(date, courts, true, slots, List.of());
        }
        return new AvailabilityResponse(date, courts, false, List.of(), nearbyDays(scheduled, date, courts, today));
    }

    private List<AlternativeDay> nearbyDays(List<Schedule> scheduled, LocalDate date, int courts, LocalDate today) {
        List<AlternativeDay> days = new ArrayList<>();
        if (scheduled.size() < courts) {
            return days;
        }
        LocalDate from = date.minusDays(nearbyDaysWindow);
        if (from.isBefore(today)) {
            from = today;
        }
        for (LocalDate day = from; !day.isAfter(date.plusDays(nearbyDaysWindow)); day = day.plusDays(1)) {
            if (day.equals(date)) {
                continue;
            }
            int freeSlots = slotsOn(scheduled, day, courts).size();
            if (freeSlots > 0) {
                days.add(new AlternativeDay(day, freeSlots));
            }
        }
        return days;
    }

    /** Slots of {@code date} free on at least {@code courts} courts, by start time. */
    private List<SlotResponse> slotsOn(List<Schedule> scheduled, LocalDate date, int courts) {
        if (scheduled.size() < courts) {
            return List.of();
        }
        Map<Interval, List<Schedule>> freeCourts = new TreeMap<>(
                Comparator.comparing(Interval::start).thenComparing(Interval::end));
        for (Schedule schedule : scheduled) {
            for (DaySlot slot : calculator.slotsOf(schedule, date)) {
                if (slot.free()) {
                    freeCourts.computeIfAbsent(new Interval(slot.start(), slot.end()), k -> new ArrayList<>())
                            .add(schedule);
                }
            }
        }
        return freeCourts.entrySet().stream()
                .filter(e -> e.getValue().size() >= courts)
                .map(e -> new SlotResponse(e.getKey().start(), e.getKey().end(), e.getValue().size(),
                        e.getValue().stream().map(s -> s.getCourt().getId()).toList(),
                        e.getValue().stream().map(Schedule::getPrice).min(BigDecimal::compareTo).orElseThrow()))
                .toList();
    }

    private record Interval(LocalTime start, LocalTime end) {
    }
}
