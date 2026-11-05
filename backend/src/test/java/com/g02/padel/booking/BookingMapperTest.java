package com.g02.padel.booking;

import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.booking.dto.BookingSlotResponse;
import com.g02.padel.court.Court;
import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.user.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BookingMapperTest {

    @Test
    void mapsBookingWithCourtAndClientNamesAndEachSlotsPriceSnapshot() {
        var response = BookingMapper.toResponse(booking(slot(7, "16.00"), slot(8, "18.50")));

        assertThat(response).isEqualTo(new BookingResponse(
                5001L, 3L, "Court 3", 42L, "Demo Client", LocalDate.of(2026, 6, 8), BookingStatus.CONFIRMED,
                new BigDecimal("34.50"), Instant.parse("2026-05-30T10:15:00Z"),
                List.of(new BookingSlotResponse(LocalTime.of(7, 0), LocalTime.of(8, 0), new BigDecimal("16.00")),
                        new BookingSlotResponse(LocalTime.of(8, 0), LocalTime.of(9, 0), new BigDecimal("18.50")))));
    }

    private static Booking booking(BookingSlot... slots) {
        var court = new Court();
        court.setId(3L);
        court.setName("Court 3");
        var user = new User();
        user.setId(42L);
        user.setName("Demo Client");

        var booking = new Booking();
        booking.setId(5001L);
        booking.setCourt(court);
        booking.setUser(user);
        booking.setDate(LocalDate.of(2026, 6, 8));
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setCreatedAt(LocalDateTime.of(2026, 5, 30, 10, 15));
        for (BookingSlot slot : slots) {
            booking.addSlot(slot);
        }
        return booking;
    }

    private static BookingSlot slot(int startHour, String price) {
        return BookingSlot.of(LocalTime.of(startHour, 0), LocalTime.of(startHour + 1, 0), new BigDecimal(price));
    }
}
