package com.g02.padel.dashboard.dto;

public record CourtBookingCount(
        Long courtId,
        String courtName,
        long bookings
) {
}
