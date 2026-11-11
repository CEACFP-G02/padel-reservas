package com.g02.padel.schedule.usecase;

import static com.g02.padel.schedule.usecase.ScheduleFixtures.court;
import static com.g02.padel.schedule.usecase.ScheduleFixtures.hours;
import static com.g02.padel.schedule.usecase.ScheduleFixtures.schedule;
import static com.g02.padel.schedule.usecase.ScheduleFixtures.weekday;
import static java.time.DayOfWeek.MONDAY;
import static java.time.DayOfWeek.SUNDAY;
import static java.time.DayOfWeek.TUESDAY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.OpeningHours;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.schedule.dto.ScheduleResponse;
import com.g02.padel.schedule.dto.UpdateScheduleRequest;
import com.g02.padel.schedule.dto.WeekdayHours;
import com.g02.padel.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UpdateScheduleUseCaseTest {

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private CourtRepository courtRepository;

    @InjectMocks
    private UpdateScheduleUseCase updateSchedule;

    private static UpdateScheduleRequest request(int slotMinutes, String price, WeekdayHours... weekdays) {
        return new UpdateScheduleRequest(slotMinutes, new BigDecimal(price), List.of(weekdays));
    }

    @Test
    void createsTheScheduleTheFirstTime() {
        var court = court(3, true);
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court));
        when(scheduleRepository.findByCourtId(3L)).thenReturn(Optional.empty());
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = updateSchedule.execute(3L, request(60, "16.00",
                weekday(SUNDAY, "09:00", "14:00"), weekday(MONDAY, "08:00", "22:00")));

        var saved = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(saved.capture());
        assertThat(saved.getValue().getCourt()).isSameAs(court);
        assertThat(saved.getValue().getOpeningHours()).allSatisfy(h -> assertThat(h.getSchedule()).isSameAs(saved.getValue()));
        assertThat(response).isEqualTo(new ScheduleResponse(60, new BigDecimal("16.00"),
                List.of(weekday(MONDAY, "08:00", "22:00"), weekday(SUNDAY, "09:00", "14:00"))));
    }

    @Test
    void replacesSlotLengthPriceAndEveryRangeOfAnExistingSchedule() {
        var court = court(3, true);
        var existing = schedule(court, 60, "16.00", hours(MONDAY, "08:00", "22:00"), hours(SUNDAY, "09:00", "14:00"));
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court));
        when(scheduleRepository.findByCourtId(3L)).thenReturn(Optional.of(existing));
        when(scheduleRepository.save(existing)).thenReturn(existing);

        var response = updateSchedule.execute(3L, request(90, "24.50", weekday(TUESDAY, "10:00", "20:00")));

        assertThat(existing.getSlotMinutes()).isEqualTo(90);
        assertThat(existing.getPrice()).isEqualByComparingTo("24.50");
        assertThat(existing.getOpeningHours()).extracting(OpeningHours::getDayOfWeek).containsExactly(TUESDAY);
        assertThat(response.weekdays()).containsExactly(weekday(TUESDAY, "10:00", "20:00"));
    }

    @Test
    void allowsSeveralNonOverlappingRangesOnTheSameDay() {
        var court = court(3, true);
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court));
        when(scheduleRepository.findByCourtId(3L)).thenReturn(Optional.empty());
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = updateSchedule.execute(3L, request(60, "16.00",
                weekday(MONDAY, "14:00", "20:00"), weekday(MONDAY, "08:00", "14:00")));

        assertThat(response.weekdays())
                .containsExactly(weekday(MONDAY, "08:00", "14:00"), weekday(MONDAY, "14:00", "20:00"));
    }

    @Test
    void anEmptyWeekClosesTheCourtAndAFreeCourtIsAllowed() {
        var court = court(3, true);
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court));
        when(scheduleRepository.findByCourtId(3L)).thenReturn(Optional.empty());
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = updateSchedule.execute(3L, request(60, "0.00"));

        assertThat(response.weekdays()).isEmpty();
        assertThat(response.price()).isEqualByComparingTo("0.00");
    }

    @Test
    void throwsNotFoundForAMissingCourt() {
        when(courtRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> updateSchedule.execute(99L, request(60, "16.00")))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Court 99 not found");
    }

    @Test
    void rejectsARangeThatDoesNotCloseAfterItOpens() {
        assertInvalid(request(60, "16.00", weekday(MONDAY, "22:00", "08:00")), "MONDAY 22:00-08:00: close must be after open");
        assertInvalid(request(60, "16.00", weekday(MONDAY, "08:00", "08:00")), "MONDAY 08:00-08:00: close must be after open");
    }

    @Test
    void rejectsARangeShorterThanOneSlot() {
        assertInvalid(request(90, "16.00", weekday(MONDAY, "08:00", "09:00")),
                "MONDAY 08:00-09:00: shorter than one 90-minute slot");
    }

    @Test
    void rejectsOverlappingRangesOnTheSameDay() {
        assertInvalid(request(60, "16.00", weekday(MONDAY, "08:00", "14:00"), weekday(MONDAY, "13:00", "20:00")),
                "MONDAY 13:00-20:00 overlaps 08:00-14:00");
        assertInvalid(request(60, "16.00", weekday(MONDAY, "08:00", "14:00"), weekday(MONDAY, "08:00", "14:00")),
                "MONDAY 08:00-14:00 overlaps 08:00-14:00");
    }

    @Test
    void rejectsARangeNestedInAWiderEarlierRangeEvenWhenItClearsThePreviousOne() {
        // Sorted: 08-22, 11-12, 13-14. 13:00 is after the previous close (12:00) but inside 08:00-22:00.
        assertInvalid(request(60, "16.00", weekday(MONDAY, "13:00", "14:00"), weekday(MONDAY, "08:00", "22:00"),
                        weekday(MONDAY, "11:00", "12:00")),
                "MONDAY 11:00-12:00 overlaps 08:00-22:00");
        assertInvalid(request(60, "16.00", weekday(MONDAY, "08:00", "22:00"), weekday(MONDAY, "08:00", "09:00"),
                        weekday(MONDAY, "21:00", "22:00")),
                "MONDAY 08:00-09:00 overlaps 08:00-22:00");
    }

    @Test
    void rejectsALaterRangeInsideTheWidestEarlierOne() {
        assertInvalid(request(60, "16.00", weekday(MONDAY, "08:00", "22:00"), weekday(MONDAY, "08:00", "20:00"),
                        weekday(MONDAY, "21:00", "22:00")),
                "MONDAY 08:00-20:00 overlaps 08:00-22:00");
    }

    @Test
    void aRangeTouchingTheLatestCloseIsStillAllowed() {
        var court = court(3, true);
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court));
        when(scheduleRepository.findByCourtId(3L)).thenReturn(Optional.empty());
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = updateSchedule.execute(3L, request(60, "16.00", weekday(MONDAY, "08:00", "14:00"),
                weekday(MONDAY, "14:00", "15:00"),
                weekday(MONDAY, "15:00", "20:00")));

        assertThat(response.weekdays()).hasSize(3);
    }

    @Test
    void sameHoursOnDifferentDaysDoNotOverlap() {
        var court = court(3, true);
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court));
        when(scheduleRepository.findByCourtId(3L)).thenReturn(Optional.empty());
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = updateSchedule.execute(3L, request(60, "16.00",
                weekday(MONDAY, "08:00", "14:00"), weekday(TUESDAY, "08:00", "14:00")));

        assertThat(response.weekdays()).hasSize(2);
    }

    private void assertInvalid(UpdateScheduleRequest request, String message) {
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court(3, true)));

        assertThatThrownBy(() -> updateSchedule.execute(3L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(message);
        verify(scheduleRepository, never()).save(any());
    }
}
