package com.g02.padel.booking.dto;

import com.g02.padel.shared.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long id,
        Long courtId,
        String courtName,
        Long userId,
        String userEmail,
        LocalDate date,
        List<BookingSlotDto> slots,
        BookingStatus status,
        BigDecimal totalPrice,
        LocalDateTime createdAt,
        LocalDateTime cancelledAt
) {
}
