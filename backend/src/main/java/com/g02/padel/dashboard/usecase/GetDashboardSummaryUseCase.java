package com.g02.padel.dashboard.usecase;

import com.g02.padel.booking.BookingRepository;
import com.g02.padel.dashboard.dto.DashboardSummaryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/** UC (owner): booking KPIs for a date range. */
@Service
public class GetDashboardSummaryUseCase {

    private final BookingRepository bookingRepository;

    public GetDashboardSummaryUseCase(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse execute(LocalDate from, LocalDate to) {
        // TODO: default range = current month when null; from <= to; aggregate findByDateBetween:
        //  counts by status, revenue = sum(totalPrice) of non-CANCELLED, bookings per court
        //  — see docs/api.md#get-apiv1dashboardsummary
        throw new UnsupportedOperationException("TODO: GetDashboardSummary — see docs/api.md#get-apiv1dashboardsummary");
    }
}
