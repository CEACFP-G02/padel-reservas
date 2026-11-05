package com.g02.padel.availability.usecase;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.court;
import static com.g02.padel.availability.AvailabilityFixtures.hours;
import static com.g02.padel.availability.AvailabilityFixtures.schedule;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.availability.CourtDaySlotCalculator;
import com.g02.padel.availability.DaySlot;
import com.g02.padel.availability.dto.CourtDayAvailabilityResponse;
import com.g02.padel.availability.dto.CourtSlotResponse;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class GetCourtDayAvailabilityUseCaseTest {

    private final CourtRepository courts = mock(CourtRepository.class);
    private final ScheduleRepository schedules = mock(ScheduleRepository.class);
    private final CourtDaySlotCalculator calculator = mock(CourtDaySlotCalculator.class);
    private final GetCourtDayAvailabilityUseCase useCase =
            new GetCourtDayAvailabilityUseCase(courts, schedules, calculator);

    @Test
    void returnsTheCourtDayGridWithEachSlotFlagged() {
        Court court = court(3L, true);
        Schedule schedule = schedule(court, 60, "16.00", hours(DayOfWeek.MONDAY, "08:00", "10:00"));
        when(courts.findById(3L)).thenReturn(Optional.of(court));
        when(schedules.findByCourtId(3L)).thenReturn(Optional.of(schedule));
        when(calculator.slotsOf(schedule, MONDAY)).thenReturn(List.of(
                new DaySlot(LocalTime.of(8, 0), LocalTime.of(9, 0), true),
                new DaySlot(LocalTime.of(9, 0), LocalTime.of(10, 0), false)));

        assertThat(useCase.execute(3L, MONDAY, Role.CLIENT)).isEqualTo(new CourtDayAvailabilityResponse(
                3L, "Court 3", MONDAY, List.of(
                        new CourtSlotResponse(LocalTime.of(8, 0), LocalTime.of(9, 0), true),
                        new CourtSlotResponse(LocalTime.of(9, 0), LocalTime.of(10, 0), false))));
    }

    @Test
    void aCourtWithoutScheduleHasNoSlots() {
        when(courts.findById(3L)).thenReturn(Optional.of(court(3L, true)));
        when(schedules.findByCourtId(3L)).thenReturn(Optional.empty());

        assertThat(useCase.execute(3L, MONDAY, Role.CLIENT).slots()).isEmpty();
        verify(calculator, never()).slotsOf(any(), any());
    }

    @Test
    void aMissingCourtIsNotFound() {
        when(courts.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(9L, MONDAY, Role.OWNER))
                .isInstanceOf(NotFoundException.class).hasMessage("Court 9 not found");
    }

    @Test
    void aClientNeverGetsSlotsOfAnInactiveCourt() {
        when(courts.findById(3L)).thenReturn(Optional.of(court(3L, false)));

        assertThatThrownBy(() -> useCase.execute(3L, MONDAY, Role.CLIENT))
                .isInstanceOf(NotFoundException.class).hasMessage("Court 3 not found");
        verify(calculator, never()).slotsOf(any(), any());
    }

    @Test
    void anOwnerSeesTheGridOfAnInactiveCourt() {
        Court court = court(3L, false);
        Schedule schedule = schedule(court, 60, "16.00", hours(DayOfWeek.MONDAY, "08:00", "09:00"));
        when(courts.findById(3L)).thenReturn(Optional.of(court));
        when(schedules.findByCourtId(3L)).thenReturn(Optional.of(schedule));
        when(calculator.slotsOf(schedule, MONDAY))
                .thenReturn(List.of(new DaySlot(LocalTime.of(8, 0), LocalTime.of(9, 0), true)));

        assertThat(useCase.execute(3L, MONDAY, Role.OWNER).slots()).hasSize(1);
    }
}
