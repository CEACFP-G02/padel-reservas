package com.g02.padel.schedule.usecase;

import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.OpeningHours;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleMapper;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.schedule.dto.ScheduleResponse;
import com.g02.padel.schedule.dto.UpdateScheduleRequest;
import com.g02.padel.schedule.dto.WeekdayHours;
import com.g02.padel.shared.exception.NotFoundException;
import java.time.DayOfWeek;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC (owner): create or replace the weekly opening schedule and slot price of a court. Each range must close after
 * it opens and fit at least one slot; ranges of the same day must not overlap (they may touch).
 */
@Service
public class UpdateScheduleUseCase {

    private final ScheduleRepository scheduleRepository;
    private final CourtRepository courtRepository;

    public UpdateScheduleUseCase(ScheduleRepository scheduleRepository, CourtRepository courtRepository) {
        this.scheduleRepository = scheduleRepository;
        this.courtRepository = courtRepository;
    }

    @Transactional
    public ScheduleResponse execute(Long courtId, UpdateScheduleRequest request) {
        Court court = courtRepository.findById(courtId).orElseThrow(() -> NotFoundException.of("Court", courtId));
        validate(request);

        Schedule schedule = scheduleRepository.findByCourtId(courtId).orElseGet(() -> {
            var created = new Schedule();
            created.setCourt(court);
            return created;
        });
        schedule.setSlotMinutes(request.slotMinutes());
        schedule.setPrice(request.price());
        schedule.getOpeningHours().clear();
        for (WeekdayHours range : request.weekdays()) {
            var hours = new OpeningHours();
            hours.setDayOfWeek(range.day());
            hours.setOpenTime(range.open());
            hours.setCloseTime(range.close());
            schedule.addOpeningHours(hours);
        }
        return ScheduleMapper.toResponse(scheduleRepository.save(schedule));
    }

    private static void validate(UpdateScheduleRequest request) {
        Duration slot = Duration.ofMinutes(request.slotMinutes());
        for (WeekdayHours range : request.weekdays()) {
            if (!range.close().isAfter(range.open())) {
                throw new IllegalArgumentException(describe(range) + ": close must be after open");
            }
            if (Duration.between(range.open(), range.close()).compareTo(slot) < 0) {
                throw new IllegalArgumentException(
                        describe(range) + ": shorter than one " + request.slotMinutes() + "-minute slot");
            }
        }
        Map<DayOfWeek, List<WeekdayHours>> byDay = request.weekdays().stream()
                .collect(Collectors.groupingBy(WeekdayHours::day));
        byDay.values().forEach(ranges -> {
            List<WeekdayHours> sorted = ranges.stream().sorted(Comparator.comparing(WeekdayHours::open)).toList();
            for (int i = 1; i < sorted.size(); i++) {
                WeekdayHours previous = sorted.get(i - 1);
                WeekdayHours current = sorted.get(i);
                if (current.open().isBefore(previous.close())) {
                    throw new IllegalArgumentException(describe(current) + " overlaps "
                            + previous.open() + "-" + previous.close());
                }
            }
        });
    }

    private static String describe(WeekdayHours range) {
        return range.day() + " " + range.open() + "-" + range.close();
    }
}
