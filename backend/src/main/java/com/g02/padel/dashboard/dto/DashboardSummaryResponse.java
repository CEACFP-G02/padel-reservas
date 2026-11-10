package com.g02.padel.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Today's owner KPIs — see docs/api.md#dashboard--apiv1dashboard. */
public record DashboardSummaryResponse(
        LocalDate date,
        long activeCourts,
        long bookingsToday,
        long upcomingBookings,
        BigDecimal occupancyRate,
        BigDecimal revenueToday
) {
}
