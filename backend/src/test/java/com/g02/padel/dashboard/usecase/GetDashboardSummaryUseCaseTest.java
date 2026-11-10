package com.g02.padel.dashboard.usecase;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.clockAt;
import static com.g02.padel.availability.AvailabilityFixtures.court;
import static com.g02.padel.availability.AvailabilityFixtures.hours;
import static com.g02.padel.availability.AvailabilityFixtures.schedule;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.availability.CourtDaySlotCalculator;
import com.g02.padel.availability.DayOccupancy;
import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.BookingSlot;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.dashboard.dto.DashboardSummaryResponse;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.shared.enums.BookingStatus;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GetDashboardSummaryUseCaseTest {

    private final CourtRepository courts = mock(CourtRepository.class);
    private final ScheduleRepository schedules = mock(ScheduleRepository.class);
    private final BookingRepository bookings = mock(BookingRepository.class);
    private final CourtDaySlotCalculator calculator = mock(CourtDaySlotCalculator.class);
    private final GetDashboardSummaryUseCase useCase = new GetDashboardSummaryUseCase(
            courts, schedules, bookings, calculator, clockAt(MONDAY, "10:00"));

    private final Court central = court(1L, true);
    private final Court side = court(2L, true);
    private final Court retired = court(3L, false);
    private final Schedule centralSchedule = schedule(central, 60, "16.00", hours(DayOfWeek.MONDAY, "08:00", "14:00"));
    private final Schedule sideSchedule = schedule(side, 60, "16.00", hours(DayOfWeek.MONDAY, "08:00", "12:00"));

    @BeforeEach
    void nothingByDefault() {
        when(courts.findByActiveTrue()).thenReturn(List.of());
        when(bookings.findByDateBetween(any(), any())).thenReturn(List.of());
    }

    @Test
    void summarisesTodayFromCourtsBookingsAndOccupancy() {
        when(courts.findByActiveTrue()).thenReturn(List.of(central, side));
        when(schedules.findByCourtId(1L)).thenReturn(Optional.of(centralSchedule));
        when(schedules.findByCourtId(2L)).thenReturn(Optional.empty());
        when(calculator.occupancyOf(centralSchedule, MONDAY)).thenReturn(new DayOccupancy(6, 2));
        when(bookings.findByDateBetween(MONDAY, MONDAY)).thenReturn(List.of(
                booking(central, MONDAY, BookingStatus.CONFIRMED, "16.00", "16.50"),
                booking(central, MONDAY, BookingStatus.CANCELLED, "20.00"),
                booking(retired, MONDAY, BookingStatus.CONFIRMED, "12.00")));
        when(bookings.findByDateBetween(MONDAY.plusDays(1), MONDAY.plusDays(7))).thenReturn(List.of(
                booking(central, MONDAY.plusDays(1), BookingStatus.CONFIRMED, "16.00"),
                booking(side, MONDAY.plusDays(7), BookingStatus.CONFIRMED, "16.00"),
                booking(side, MONDAY.plusDays(3), BookingStatus.CANCELLED, "16.00")));

        DashboardSummaryResponse summary = useCase.execute();

        assertThat(summary).isEqualTo(new DashboardSummaryResponse(
                MONDAY, 2, 2, 2, new BigDecimal("33.3"), new BigDecimal("44.50")));
    }

    @Test
    void occupancyAggregatesTheSlotsOfEveryActiveCourtWithASchedule() {
        when(courts.findByActiveTrue()).thenReturn(List.of(central, side));
        when(schedules.findByCourtId(1L)).thenReturn(Optional.of(centralSchedule));
        when(schedules.findByCourtId(2L)).thenReturn(Optional.of(sideSchedule));
        when(calculator.occupancyOf(centralSchedule, MONDAY)).thenReturn(new DayOccupancy(6, 1));
        when(calculator.occupancyOf(sideSchedule, MONDAY)).thenReturn(new DayOccupancy(3, 3));

        // (1 + 3) booked of (6 + 3) bookable
        assertThat(useCase.execute().occupancyRate()).isEqualTo(new BigDecimal("44.4"));
    }

    @Test
    void roundsTheOccupancyHalfUpToOneDecimal() {
        when(courts.findByActiveTrue()).thenReturn(List.of(central));
        when(schedules.findByCourtId(1L)).thenReturn(Optional.of(centralSchedule));
        when(calculator.occupancyOf(centralSchedule, MONDAY)).thenReturn(new DayOccupancy(3, 2));

        assertThat(useCase.execute().occupancyRate()).isEqualTo(new BigDecimal("66.7"));
    }

    @Test
    void anEmptyDayIsAllZeroesWithoutDividingByZero() {
        when(courts.findByActiveTrue()).thenReturn(List.of(side));
        when(schedules.findByCourtId(2L)).thenReturn(Optional.empty());

        DashboardSummaryResponse summary = useCase.execute();

        assertThat(summary).isEqualTo(new DashboardSummaryResponse(
                MONDAY, 1, 0, 0, new BigDecimal("0.0"), new BigDecimal("0.00")));
        verify(calculator, never()).occupancyOf(any(), any());
    }

    @Test
    void todayComesFromTheClock() {
        var later = new GetDashboardSummaryUseCase(courts, schedules, bookings, calculator,
                clockAt(LocalDate.of(2026, 6, 20), "23:59"));

        assertThat(later.execute().date()).isEqualTo(LocalDate.of(2026, 6, 20));
        verify(bookings).findByDateBetween(LocalDate.of(2026, 6, 21), LocalDate.of(2026, 6, 27));
    }

    /** A booking with one 1-hour slot per given price snapshot. */
    private static Booking booking(Court court, LocalDate date, BookingStatus status, String... prices) {
        var booking = new Booking();
        booking.setCourt(court);
        booking.setDate(date);
        booking.setStatus(status);
        LocalTime start = LocalTime.of(8, 0);
        for (String price : prices) {
            booking.addSlot(BookingSlot.of(start, start.plusHours(1), new BigDecimal(price)));
            start = start.plusHours(1);
        }
        return booking;
    }
}
