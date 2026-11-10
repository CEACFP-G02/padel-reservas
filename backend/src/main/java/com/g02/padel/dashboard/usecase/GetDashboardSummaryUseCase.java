package com.g02.padel.dashboard.usecase;

import com.g02.padel.availability.CourtDaySlotCalculator;
import com.g02.padel.availability.DayOccupancy;
import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.BookingSlot;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.dashboard.dto.DashboardSummaryResponse;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.shared.enums.BookingStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC (owner): today's KPIs — active courts, CONFIRMED bookings today and in the next 7 days, today's occupancy of
 * the active courts and the revenue booked today (sum of slot price snapshots).
 */
@Service
public class GetDashboardSummaryUseCase {

    private static final int UPCOMING_DAYS = 7;

    private final CourtRepository courtRepository;
    private final ScheduleRepository scheduleRepository;
    private final BookingRepository bookingRepository;
    private final CourtDaySlotCalculator calculator;
    private final Clock clock;

    public GetDashboardSummaryUseCase(CourtRepository courtRepository, ScheduleRepository scheduleRepository,
                                      BookingRepository bookingRepository, CourtDaySlotCalculator calculator,
                                      Clock clock) {
        this.courtRepository = courtRepository;
        this.scheduleRepository = scheduleRepository;
        this.bookingRepository = bookingRepository;
        this.calculator = calculator;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse execute() {
        LocalDate today = LocalDate.now(clock);
        List<Court> activeCourts = courtRepository.findByActiveTrue();
        List<Booking> confirmedToday = confirmedBetween(today, today);
        long upcoming = confirmedBetween(today.plusDays(1), today.plusDays(UPCOMING_DAYS)).size();
        BigDecimal revenue = confirmedToday.stream()
                .flatMap(b -> b.getSlots().stream())
                .map(BookingSlot::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return new DashboardSummaryResponse(today, activeCourts.size(), confirmedToday.size(), upcoming,
                occupancyRate(activeCourts, today), revenue);
    }

    private List<Booking> confirmedBetween(LocalDate from, LocalDate to) {
        return bookingRepository.findByDateBetween(from, to).stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .toList();
    }

    /** Booked share of the bookable slots of every active court today, as a percentage with one decimal. */
    private BigDecimal occupancyRate(List<Court> activeCourts, LocalDate today) {
        int bookable = 0;
        int booked = 0;
        for (Court court : activeCourts) {
            var schedule = scheduleRepository.findByCourtId(court.getId());
            if (schedule.isPresent()) {
                DayOccupancy day = calculator.occupancyOf(schedule.get(), today);
                bookable += day.bookableSlots();
                booked += day.bookedSlots();
            }
        }
        if (bookable == 0) {
            return new BigDecimal("0.0");
        }
        return BigDecimal.valueOf(booked * 100L).divide(BigDecimal.valueOf(bookable), 1, RoundingMode.HALF_UP);
    }
}
