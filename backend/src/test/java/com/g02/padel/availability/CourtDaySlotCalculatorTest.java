package com.g02.padel.availability;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.block;
import static com.g02.padel.availability.AvailabilityFixtures.booking;
import static com.g02.padel.availability.AvailabilityFixtures.clockAt;
import static com.g02.padel.availability.AvailabilityFixtures.court;
import static com.g02.padel.availability.AvailabilityFixtures.hours;
import static com.g02.padel.availability.AvailabilityFixtures.schedule;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.court.Court;
import com.g02.padel.courtblock.CourtBlock;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.shared.enums.BookingStatus;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CourtDaySlotCalculatorTest {

    private final BookingRepository bookings = mock(BookingRepository.class);
    private final CourtBlockRepository blocks = mock(CourtBlockRepository.class);
    private final Court court = court(1L, true);

    /** Clock: early on the Monday, so no slot of that day has started yet. */
    private CourtDaySlotCalculator calculator = calculatorAt(clockAt(MONDAY, "06:00"));

    @BeforeEach
    void noBookingsOrBlocksByDefault() {
        given(MONDAY, List.of(), List.of());
    }

    @Test
    void splitsTheWeekdayOpeningHoursIntoFreeSlotsOfSlotMinutes() {
        Schedule schedule = schedule(court, 60, "16.00", hours(DayOfWeek.MONDAY, "08:00", "11:00"));

        assertThat(render(calculator.slotsOf(schedule, MONDAY)))
                .containsExactly("08:00-09:00 free", "09:00-10:00 free", "10:00-11:00 free");
    }

    @Test
    void usesOnlyTheRangesOfThatWeekdaySortedAndDropsATrailingPartialSlot() {
        Schedule schedule = schedule(court, 90, "16.00",
                hours(DayOfWeek.MONDAY, "18:00", "21:00"),
                hours(DayOfWeek.TUESDAY, "08:00", "22:00"),
                hours(DayOfWeek.MONDAY, "08:00", "11:00"));

        assertThat(render(calculator.slotsOf(schedule, MONDAY))).containsExactly(
                "08:00-09:30 free", "09:30-11:00 free", "18:00-19:30 free", "19:30-21:00 free");

        Schedule partial = schedule(court, 60, "16.00", hours(DayOfWeek.MONDAY, "08:00", "10:30"));
        assertThat(render(calculator.slotsOf(partial, MONDAY)))
                .containsExactly("08:00-09:00 free", "09:00-10:00 free");
    }

    @Test
    void aClosedWeekdayYieldsNoSlots() {
        Schedule schedule = schedule(court, 60, "16.00", hours(DayOfWeek.TUESDAY, "08:00", "22:00"));

        assertThat(calculator.slotsOf(schedule, MONDAY)).isEmpty();
    }

    @Test
    void scheduleMinusConfirmedBookingsMinusBlocks() {
        Schedule schedule = schedule(court, 60, "16.00", hours(DayOfWeek.MONDAY, "08:00", "13:00"));
        given(MONDAY,
                List.of(booking(court, MONDAY, BookingStatus.CONFIRMED, "09:00-10:00", "10:00-11:00")),
                List.of(block(court, MONDAY, "12:00", "13:00")));

        assertThat(render(calculator.slotsOf(schedule, MONDAY))).containsExactly(
                "08:00-09:00 free", "09:00-10:00 taken", "10:00-11:00 taken", "11:00-12:00 free",
                "12:00-13:00 taken");
    }

    @Test
    void aCancelledBookingFreesItsSlotButACompletedOneStillHoldsIt() {
        Schedule schedule = schedule(court, 60, "16.00", hours(DayOfWeek.MONDAY, "08:00", "10:00"));
        given(MONDAY, List.of(
                booking(court, MONDAY, BookingStatus.CANCELLED, "08:00-09:00"),
                booking(court, MONDAY, BookingStatus.COMPLETED, "09:00-10:00")), List.of());

        assertThat(render(calculator.slotsOf(schedule, MONDAY)))
                .containsExactly("08:00-09:00 free", "09:00-10:00 taken");
    }

    @Test
    void anyPartialOverlapTakesTheSlot() {
        Schedule schedule = schedule(court, 60, "16.00", hours(DayOfWeek.MONDAY, "08:00", "12:00"));
        given(MONDAY,
                List.of(booking(court, MONDAY, BookingStatus.CONFIRMED, "08:30-09:30")),
                List.of(block(court, MONDAY, "10:59", "11:01")));

        assertThat(render(calculator.slotsOf(schedule, MONDAY))).containsExactly(
                "08:00-09:00 taken", "09:00-10:00 taken", "10:00-11:00 taken", "11:00-12:00 taken");
    }

    @Test
    void backToBackRangesDoNotTakeTheAdjacentSlots() {
        Schedule schedule = schedule(court, 60, "16.00", hours(DayOfWeek.MONDAY, "08:00", "12:00"));
        given(MONDAY,
                List.of(booking(court, MONDAY, BookingStatus.CONFIRMED, "09:00-10:00")),
                List.of(block(court, MONDAY, "11:00", "12:00")));

        assertThat(render(calculator.slotsOf(schedule, MONDAY))).containsExactly(
                "08:00-09:00 free", "09:00-10:00 taken", "10:00-11:00 free", "11:00-12:00 taken");
    }

    @Test
    void onTodaySlotsThatAlreadyStartedAreTaken() {
        calculator = calculatorAt(clockAt(MONDAY, "09:30"));
        Schedule schedule = schedule(court, 60, "16.00", hours(DayOfWeek.MONDAY, "08:00", "11:00"));

        assertThat(render(calculator.slotsOf(schedule, MONDAY)))
                .containsExactly("08:00-09:00 taken", "09:00-10:00 taken", "10:00-11:00 free");
    }

    @Test
    void aPastDayHasNoFreeSlots() {
        calculator = calculatorAt(clockAt(MONDAY.plusDays(1), "06:00"));
        Schedule schedule = schedule(court, 60, "16.00", hours(DayOfWeek.MONDAY, "08:00", "10:00"));

        assertThat(render(calculator.slotsOf(schedule, MONDAY)))
                .containsExactly("08:00-09:00 taken", "09:00-10:00 taken");
    }

    private CourtDaySlotCalculator calculatorAt(Clock clock) {
        return new CourtDaySlotCalculator(bookings, blocks, clock);
    }

    private void given(LocalDate date, List<Booking> courtBookings, List<CourtBlock> courtBlocks) {
        when(bookings.findByCourtIdAndDate(court.getId(), date)).thenReturn(courtBookings);
        when(blocks.findByCourtIdAndDate(court.getId(), date)).thenReturn(courtBlocks);
    }

    private static List<String> render(List<DaySlot> slots) {
        return slots.stream().map(s -> s.start() + "-" + s.end() + (s.free() ? " free" : " taken")).toList();
    }
}
