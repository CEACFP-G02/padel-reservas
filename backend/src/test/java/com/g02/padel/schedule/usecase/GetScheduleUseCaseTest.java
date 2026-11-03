package com.g02.padel.schedule.usecase;

import static com.g02.padel.schedule.usecase.ScheduleFixtures.court;
import static com.g02.padel.schedule.usecase.ScheduleFixtures.hours;
import static com.g02.padel.schedule.usecase.ScheduleFixtures.schedule;
import static com.g02.padel.schedule.usecase.ScheduleFixtures.weekday;
import static java.time.DayOfWeek.MONDAY;
import static java.time.DayOfWeek.SUNDAY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.schedule.dto.ScheduleResponse;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GetScheduleUseCaseTest {

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private CourtRepository courtRepository;

    @InjectMocks
    private GetScheduleUseCase getSchedule;

    @Test
    void returnsTheScheduleWithItsHoursSortedByDayAndTime() {
        var court = court(3, true);
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court));
        when(scheduleRepository.findByCourtId(3L)).thenReturn(Optional.of(schedule(court, 60, "16.00",
                hours(SUNDAY, "09:00", "14:00"), hours(MONDAY, "17:00", "22:00"), hours(MONDAY, "08:00", "13:00"))));

        assertThat(getSchedule.execute(3L, Role.CLIENT)).isEqualTo(new ScheduleResponse(60, new BigDecimal("16.00"),
                List.of(weekday(MONDAY, "08:00", "13:00"), weekday(MONDAY, "17:00", "22:00"),
                        weekday(SUNDAY, "09:00", "14:00"))));
    }

    @Test
    void throwsNotFoundForAMissingCourt() {
        when(courtRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> getSchedule.execute(99L, Role.OWNER))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Court 99 not found");
    }

    @Test
    void throwsNotFoundWhenTheCourtHasNoScheduleYet() {
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court(3, true)));
        when(scheduleRepository.findByCourtId(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> getSchedule.execute(3L, Role.OWNER))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Schedule of court 3 not found");
    }

    @Test
    void hidesTheScheduleOfAnInactiveCourtFromAClient() {
        when(courtRepository.findById(4L)).thenReturn(Optional.of(court(4, false)));

        assertThatThrownBy(() -> getSchedule.execute(4L, Role.CLIENT))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Court 4 not found");
    }

    @Test
    void ownerReadsTheScheduleOfAnInactiveCourt() {
        var court = court(4, false);
        when(courtRepository.findById(4L)).thenReturn(Optional.of(court));
        when(scheduleRepository.findByCourtId(4L)).thenReturn(Optional.of(schedule(court, 90, "24.00")));

        assertThat(getSchedule.execute(4L, Role.OWNER).slotMinutes()).isEqualTo(90);
    }
}
