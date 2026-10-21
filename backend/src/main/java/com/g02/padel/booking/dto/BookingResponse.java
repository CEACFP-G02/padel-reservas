package com.g02.padel.booking.dto;

import com.g02.padel.shared.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record BookingResponse(
        Long id,
        Long courtId,
        String courtName,
        Long userId,
        LocalDate date,
        BookingStatus status,
        BigDecimal totalPrice,
        Instant createdAt,
        List<BookingSlotResponse> slots
) {
}
