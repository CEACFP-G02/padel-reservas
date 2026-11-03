package com.g02.padel.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DashboardSummaryResponse(
        LocalDate from,
        LocalDate to,
        long totalBookings,
        long confirmedBookings,
        long cancelledBookings,
        BigDecimal revenue,
        List<CourtBookingCount> bookingsByCourt
) {
}
