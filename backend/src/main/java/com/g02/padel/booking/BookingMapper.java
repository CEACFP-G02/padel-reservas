package com.g02.padel.booking;

import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.booking.dto.BookingSlotResponse;

import java.time.ZoneOffset;

/** Entity -> DTO for bookings. Reads the court and user associations, so call it inside the transaction. */
public final class BookingMapper {

    private BookingMapper() {
    }

    public static BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getCourt().getId(),
                booking.getCourt().getName(),
                booking.getUser().getId(),
                booking.getUser().getName(),
                booking.getDate(),
                booking.getStatus(),
                booking.getTotalPrice(),
                booking.getCreatedAt().toInstant(ZoneOffset.UTC),
                booking.getSlots().stream()
                        .map(slot -> new BookingSlotResponse(slot.getStartTime(), slot.getEndTime(), slot.getPrice()))
                        .toList());
    }
}
