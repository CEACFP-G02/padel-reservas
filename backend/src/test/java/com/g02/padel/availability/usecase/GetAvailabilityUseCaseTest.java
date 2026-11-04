package com.g02.padel.availability.usecase;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.clockAt;
import static com.g02.padel.availability.AvailabilityFixtures.court;
import static com.g02.padel.availability.AvailabilityFixtures.schedule;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

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
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Multi-court search and the nearby-days window (±7 clamped to today). Day slots come from a stubbed calculator. */
class GetAvailabilityUseCaseTest {

    private static final LocalDate TODAY = MONDAY;

    private final CourtRepository courts = mock(CourtRepository.class);
    private final ScheduleRepository schedules = mock(ScheduleRepository.class);
    private final CourtDaySlotCalculator calculator = mock(CourtDaySlotCalculator.class);
    private final GetAvailabilityUseCase useCase =
            new GetAvailabilityUseCase(courts, schedules, calculator, clockAt(TODAY, "06:00"), 7);

    /** (courtId, date) → that court's day slots. Absent → no slots. */
    private final Map<String, List<DaySlot>> days = new HashMap<>();
    private final List<LocalDate> queriedDates = new ArrayList<>();

    @BeforeEach
    void threeActiveCourts() {
        givenActiveCourts(court(1L, true), court(2L, true), court(3L, true));
        when(calculator.slotsOf(any(), any())).thenAnswer(inv -> {
            Schedule schedule = inv.getArgument(0);
            LocalDate date = inv.getArgument(1);
            queriedDates.add(date);
            return days.getOrDefault(schedule.getCourt().getId() + "@" + date, List.of());
        });
    }

    @Test
    void requestedDaySatisfiableListsTheSlotsWithEnoughFreeCourts() {
        LocalDate date = TODAY.plusDays(2);
        day(1L, date, "08:00-09:00", "09:00-10:00");
        day(2L, date, "08:00-09:00", "!09:00-10:00");
        day(3L, date, "09:00-10:00", "10:00-11:00");

        assertThat(useCase.execute(date, 2)).isEqualTo(new AvailabilityResponse(date, 2, true, List.of(
                slot("08:00", "09:00", List.of(1L, 2L), "16.00"),
                slot("09:00", "10:00", List.of(1L, 3L), "16.00")), List.of()));
    }

    @Test
    void oneCourtRequestedListsEverySlotWithAnyFreeCourt() {
        LocalDate date = TODAY.plusDays(2);
        day(1L, date, "08:00-09:00");
        day(3L, date, "08:00-09:00", "10:00-11:00");

        assertThat(useCase.execute(date, 1).slots()).containsExactly(
                slot("08:00", "09:00", List.of(1L, 3L), "16.00"),
                slot("10:00", "11:00", List.of(3L), "16.00"));
    }

    @Test
    void courtsCountTogetherOnlyForTheSameExactSlot() {
        LocalDate date = TODAY.plusDays(2);
        day(1L, date, "08:00-09:00");
        day(2L, date, "08:30-09:30");

        assertThat(useCase.execute(date, 2).available()).isFalse();
    }

    @Test
    void theSlotPriceIsTheLowestAmongItsFreeCourts() {
        Court cheap = court(1L, true);
        Court dear = court(2L, true);
        givenActiveCourts(cheap, dear);
        when(schedules.findByCourtId(1L)).thenReturn(Optional.of(schedule(cheap, 60, "14.50")));
        when(schedules.findByCourtId(2L)).thenReturn(Optional.of(schedule(dear, 60, "18.00")));
        LocalDate date = TODAY.plusDays(2);
        day(1L, date, "08:00-09:00");
        day(2L, date, "08:00-09:00");

        assertThat(useCase.execute(date, 2).slots())
                .containsExactly(slot("08:00", "09:00", List.of(1L, 2L), "14.50"));
    }

    @Test
    void courtsWithoutScheduleAreIgnored() {
        when(schedules.findByCourtId(2L)).thenReturn(Optional.empty());
        LocalDate date = TODAY.plusDays(2);
        day(1L, date, "08:00-09:00");

        assertThat(useCase.execute(date, 1).slots())
                .containsExactly(slot("08:00", "09:00", List.of(1L), "16.00"));
    }

    @Test
    void notSatisfiableProposesNearbyDaysInDateOrderWithTheirSlotCount() {
        LocalDate date = TODAY.plusDays(10);
        day(1L, date, "08:00-09:00");                       // only one court free on the requested day
        both(date.minusDays(2), "08:00-09:00", "09:00-10:00");
        both(date.plusDays(1), "18:00-19:00");
        both(date.minusDays(8), "08:00-09:00");             // outside the window
        both(date.plusDays(8), "08:00-09:00");              // outside the window

        assertThat(useCase.execute(date, 2)).isEqualTo(new AvailabilityResponse(date, 2, false, List.of(), List.of(
                new AlternativeDay(date.minusDays(2), 2),
                new AlternativeDay(date.plusDays(1), 1))));
    }

    @Test
    void requestedTodayNeverProposesPastDays() {
        both(TODAY.minusDays(1), "08:00-09:00");
        both(TODAY.plusDays(3), "08:00-09:00");
        both(TODAY.plusDays(7), "08:00-09:00");
        both(TODAY.plusDays(8), "08:00-09:00");

        AvailabilityResponse response = useCase.execute(TODAY, 2);

        assertThat(response.alternativeDays()).extracting(AlternativeDay::date)
                .containsExactly(TODAY.plusDays(3), TODAY.plusDays(7));
        assertThat(queriedDates).allSatisfy(d -> assertThat(d).isBetween(TODAY, TODAY.plusDays(7)));
    }

    @Test
    void requestedWithinAWeekOfTodayClampsTheLowerBoundToToday() {
        LocalDate date = TODAY.plusDays(3);
        both(TODAY.minusDays(1), "08:00-09:00");
        both(TODAY, "20:00-21:00");
        both(TODAY.plusDays(10), "08:00-09:00");
        both(TODAY.plusDays(11), "08:00-09:00");

        AvailabilityResponse response = useCase.execute(date, 2);

        assertThat(response.alternativeDays()).extracting(AlternativeDay::date)
                .containsExactly(TODAY, TODAY.plusDays(10));
        assertThat(queriedDates).allSatisfy(d -> assertThat(d).isBetween(TODAY, TODAY.plusDays(10)));
    }

    @Test
    void nothingAvailableInTheWholeWindow() {
        LocalDate date = TODAY.plusDays(10);
        day(1L, date, "08:00-09:00");

        assertThat(useCase.execute(date, 2))
                .isEqualTo(new AvailabilityResponse(date, 2, false, List.of(), List.of()));
    }

    @Test
    void moreCourtsThanTheClubHasIsNeverAvailable() {
        LocalDate date = TODAY.plusDays(2);
        for (long id = 1; id <= 3; id++) {
            day(id, date, "08:00-09:00");
        }

        assertThat(useCase.execute(date, 4))
                .isEqualTo(new AvailabilityResponse(date, 4, false, List.of(), List.of()));
    }

    @Test
    void rejectsAPastDate() {
        assertThatThrownBy(() -> useCase.execute(TODAY.minusDays(1), 1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("date must be today or later");
    }

    @Test
    void rejectsLessThanOneCourt() {
        assertThatThrownBy(() -> useCase.execute(TODAY, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("courts must be at least 1");
    }

    private void givenActiveCourts(Court... active) {
        when(courts.findByActiveTrue()).thenReturn(List.of(active));
        for (Court c : active) {
            when(schedules.findByCourtId(c.getId())).thenReturn(Optional.of(schedule(c, 60, "16.00")));
        }
    }

    /** Court {@code courtId}'s slots that day; a leading {@code !} marks a taken slot. */
    private void day(long courtId, LocalDate date, String... ranges) {
        List<DaySlot> slots = new ArrayList<>();
        for (String range : ranges) {
            boolean free = !range.startsWith("!");
            String[] parts = range.replace("!", "").split("-");
            slots.add(new DaySlot(LocalTime.parse(parts[0]), LocalTime.parse(parts[1]), free));
        }
        days.put(courtId + "@" + date, slots);
    }

    /** Courts 1 and 2 both free in {@code ranges}. */
    private void both(LocalDate date, String... ranges) {
        day(1L, date, ranges);
        day(2L, date, ranges);
    }

    private static SlotResponse slot(String start, String end, List<Long> courtIds, String price) {
        return new SlotResponse(LocalTime.parse(start), LocalTime.parse(end), courtIds.size(), courtIds,
                new BigDecimal(price));
    }
}
