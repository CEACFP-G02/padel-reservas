package com.g02.padel.booking.usecase;

import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingSlot;
import com.g02.padel.court.Court;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

final class BookingFixtures {

    private BookingFixtures() {
    }

    static User user(long id, String email, String name, Role role) {
        var user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setName(name);
        user.setRole(role);
        return user;
    }

    /** A confirmed one-hour-per-slot booking starting at {@code startHour}. */
    static Booking booking(long id, Court court, User user, LocalDate date, int startHour, int slots) {
        var booking = new Booking();
        booking.setId(id);
        booking.setCourt(court);
        booking.setUser(user);
        booking.setDate(date);
        for (int h = startHour; h < startHour + slots; h++) {
            booking.addSlot(BookingSlot.of(LocalTime.of(h, 0), LocalTime.of(h + 1, 0), new BigDecimal("16.00")));
        }
        return booking;
    }
}
