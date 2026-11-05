package com.g02.padel.availability.usecase;

import com.g02.padel.availability.CourtDaySlotCalculator;
import com.g02.padel.availability.dto.CourtDayAvailabilityResponse;
import com.g02.padel.availability.dto.CourtSlotResponse;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC: slot grid of a single court on a date, each slot flagged available or not.
 * An inactive court exists only for an OWNER; a court without schedule has no slots.
 */
@Service
public class GetCourtDayAvailabilityUseCase {

    private final CourtRepository courtRepository;
    private final ScheduleRepository scheduleRepository;
    private final CourtDaySlotCalculator calculator;

    public GetCourtDayAvailabilityUseCase(CourtRepository courtRepository, ScheduleRepository scheduleRepository,
                                          CourtDaySlotCalculator calculator) {
        this.courtRepository = courtRepository;
        this.scheduleRepository = scheduleRepository;
        this.calculator = calculator;
    }

    @Transactional(readOnly = true)
    public CourtDayAvailabilityResponse execute(Long courtId, LocalDate date, Role viewer) {
        Court court = courtRepository.findById(courtId)
                .filter(c -> c.isActive() || viewer == Role.OWNER)
                .orElseThrow(() -> NotFoundException.of("Court", courtId));
        List<CourtSlotResponse> slots = scheduleRepository.findByCourtId(courtId)
                .map(schedule -> calculator.slotsOf(schedule, date).stream()
                        .map(s -> new CourtSlotResponse(s.start(), s.end(), s.free()))
                        .toList())
                .orElse(List.of());
        return new CourtDayAvailabilityResponse(court.getId(), court.getName(), date, slots);
    }
}
