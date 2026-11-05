package com.g02.padel.booking;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.clockAt;
import static com.g02.padel.availability.AvailabilityFixtures.court;
import static com.g02.padel.availability.AvailabilityFixtures.hours;
import static com.g02.padel.availability.AvailabilityFixtures.schedule;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.g02.padel.availability.CourtDaySlotCalculator;
import com.g02.padel.availability.DaySlot;
import com.g02.padel.booking.dto.TimeSlotRequest;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.shared.exception.SlotNotAvailableException;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Which requested slots can be booked, priced at the schedule's current price. Free/taken comes from T15's calculator. */
class BookableSlotsTest {

    private final CourtRepository courts = mock(CourtRepository.class);
    private final ScheduleRepository schedules = mock(ScheduleRepository.class);
    private final CourtDaySlotCalculator calculator = mock(CourtDaySlotCalculator.class);
    private final Court court = court(3L, true);
    private final Schedule schedule =
            schedule(court, 60, "16.50", hours(DayOfWeek.MONDAY, "08:00", "12:00"));

    /** Monday 09:30: the 08:00 and 09:00 slots have started. */
    private final BookableSlots bookable =
            new BookableSlots(courts, schedules, calculator, clockAt(MONDAY, "09:30"));

    @BeforeEach
    void grid() {
        when(schedules.findByCourtId(3L)).thenReturn(Optional.of(schedule));
        when(calculator.slotsOf(schedule, MONDAY, null)).thenReturn(List.of(
                slot("08:00", "09:00", false), slot("09:00", "10:00", false),
                slot("10:00", "11:00", true), slot("11:00", "12:00", true)));
        when(calculator.slotsOf(schedule, MONDAY.plusDays(7), null)).thenReturn(List.of(
                slot("08:00", "09:00", true), slot("09:00", "10:00", false),
                slot("10:00", "11:00", true), slot("11:00", "12:00", true)));
    }

    @Test
    void consecutiveFreeSlotsArePricedWithTheCurrentSchedulePrice() {
        List<BookingSlot> slots = bookable.priced(court, MONDAY, List.of(req("11:00", "12:00"), req("10:00", "11:00")));

        assertThat(slots).extracting(BookingSlot::getStartTime)
                .containsExactly(LocalTime.of(10, 0), LocalTime.of(11, 0));
        assertThat(slots).extracting(BookingSlot::getPrice)
                .containsOnly(new BigDecimal("16.50"));
    }

    @Test
    void aSlotTakenByABookingOrBlockIsAConflict() {
        assertThatThrownBy(() -> bookable.priced(court, MONDAY.plusDays(7), List.of(req("09:00", "10:00"))))
                .isInstanceOf(SlotNotAvailableException.class)
                .hasMessage("09:00-10:00 is not available on court 3");
    }

    @Test
    void slotsMustBeConsecutive() {
        assertThatThrownBy(() -> bookable.priced(court, MONDAY.plusDays(7),
                List.of(req("08:00", "09:00"), req("10:00", "11:00"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Slots must be consecutive");
        assertThatThrownBy(() -> bookable.priced(court, MONDAY.plusDays(7),
                List.of(req("10:00", "11:00"), req("10:00", "11:00"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Slots must be consecutive");
    }

    @Test
    void aSlotOutsideTheScheduleGridIsBadRequest() {
        assertThatThrownBy(() -> bookable.priced(court, MONDAY.plusDays(7), List.of(req("10:30", "11:30"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("10:30-11:30 is outside the schedule of court 3");
        assertThatThrownBy(() -> bookable.priced(court, MONDAY.plusDays(7), List.of(req("12:00", "13:00"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("12:00-13:00 is outside the schedule of court 3");
    }

    @Test
    void aClosedDayIsOutsideTheSchedule() {
        when(calculator.slotsOf(schedule, MONDAY.plusDays(1), null)).thenReturn(List.of());

        assertThatThrownBy(() -> bookable.priced(court, MONDAY.plusDays(1), List.of(req("10:00", "11:00"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("10:00-11:00 is outside the schedule of court 3");
    }

    @Test
    void aCourtWithoutScheduleCannotBeBooked() {
        when(schedules.findByCourtId(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookable.priced(court, MONDAY.plusDays(7), List.of(req("10:00", "11:00"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Court 3 has no schedule");
    }

    @Test
    void bookingInThePastIsBadRequestNotAConflict() {
        assertThatThrownBy(() -> bookable.priced(court, MONDAY, List.of(req("09:00", "10:00"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cannot book a slot that has already started");
        assertThatThrownBy(() -> bookable.priced(court, MONDAY.minusDays(7), List.of(req("10:00", "11:00"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cannot book a slot that has already started");
    }

    @Test
    void whenReschedulingTheBookingsOwnSlotsCountAsFree() {
        when(calculator.slotsOf(schedule, MONDAY.plusDays(7), 5001L)).thenReturn(List.of(
                slot("08:00", "09:00", true), slot("09:00", "10:00", true)));

        assertThat(bookable.priced(court, MONDAY.plusDays(7), List.of(req("09:00", "10:00")), 5001L))
                .extracting(BookingSlot::getStartTime).containsExactly(LocalTime.of(9, 0));
    }

    @Test
    void locksAnActiveCourtForBooking() {
        when(courts.findByIdForUpdate(3L)).thenReturn(Optional.of(court));

        assertThat(bookable.lockCourt(3L, false)).isSameAs(court);
    }

    @Test
    void aMissingCourtOrAnInactiveOneForAClientIsNotFound() {
        when(courts.findByIdForUpdate(9L)).thenReturn(Optional.empty());
        when(courts.findByIdForUpdate(4L)).thenReturn(Optional.of(court(4L, false)));

        assertThatThrownBy(() -> bookable.lockCourt(9L, true))
                .isInstanceOf(NotFoundException.class).hasMessage("Court 9 not found");
        assertThatThrownBy(() -> bookable.lockCourt(4L, false))
                .isInstanceOf(NotFoundException.class).hasMessage("Court 4 not found");
    }

    @Test
    void theOwnerIsToldAnInactiveCourtCannotBeBooked() {
        when(courts.findByIdForUpdate(4L)).thenReturn(Optional.of(court(4L, false)));

        assertThatThrownBy(() -> bookable.lockCourt(4L, true))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Court 4 is inactive");
    }

    private static DaySlot slot(String start, String end, boolean free) {
        return new DaySlot(LocalTime.parse(start), LocalTime.parse(end), free);
    }

    static TimeSlotRequest req(String start, String end) {
        return new TimeSlotRequest(LocalTime.parse(start), LocalTime.parse(end));
    }
}
