package com.g02.padel.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.shared.exception.ConflictException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;

/** Entity invariants: status lifecycle and the per-slot price snapshot. */
class BookingTest {

    private static final LocalDate DATE = LocalDate.of(2026, 6, 8);

    @Test
    void aNewBookingIsConfirmedAndCostsNothingUntilItHasSlots() {
        var booking = new Booking();

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(booking.getTotalPrice()).isEqualByComparingTo("0.00");
        assertThat(booking.getCancelledAt()).isNull();
    }

    @Test
    void theTotalIsTheSumOfTheSlotPriceSnapshots() {
        var booking = new Booking();
        booking.addSlot(BookingSlot.of(LocalTime.of(7, 0), LocalTime.of(8, 0), new BigDecimal("16.00")));
        booking.addSlot(BookingSlot.of(LocalTime.of(8, 0), LocalTime.of(9, 0), new BigDecimal("16.50")));

        assertThat(booking.getTotalPrice()).isEqualByComparingTo("32.50");
        assertThat(booking.getSlots()).allSatisfy(s -> assertThat(s.getBooking()).isSameAs(booking));
    }

    @Test
    void aSlotPriceSnapshotIsNeverNegativeAndKeepsCents() {
        assertThatThrownBy(() -> BookingSlot.of(LocalTime.of(7, 0), LocalTime.of(8, 0), new BigDecimal("-0.01")))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> BookingSlot.of(LocalTime.of(8, 0), LocalTime.of(8, 0), BigDecimal.TEN))
                .isInstanceOf(IllegalArgumentException.class);

        assertThat(BookingSlot.of(LocalTime.of(7, 0), LocalTime.of(8, 0), new BigDecimal("16")).getPrice())
                .isEqualTo(new BigDecimal("16.00"));
    }

    @Test
    void replacingTheSlotsMovesTheBookingAndRecomputesTheTotal() {
        var booking = new Booking();
        booking.setDate(DATE);
        booking.addSlot(BookingSlot.of(LocalTime.of(7, 0), LocalTime.of(8, 0), new BigDecimal("16.00")));

        booking.reschedule(DATE.plusDays(1), List.of(
                BookingSlot.of(LocalTime.of(18, 0), LocalTime.of(19, 0), new BigDecimal("20.00")),
                BookingSlot.of(LocalTime.of(19, 0), LocalTime.of(20, 0), new BigDecimal("20.00"))));

        assertThat(booking.getDate()).isEqualTo(DATE.plusDays(1));
        assertThat(booking.getSlots()).extracting(BookingSlot::getStartTime)
                .containsExactly(LocalTime.of(18, 0), LocalTime.of(19, 0));
        assertThat(booking.getTotalPrice()).isEqualByComparingTo("40.00");
    }

    @Test
    void startsAtTheEarliestSlotOfItsDate() {
        var booking = new Booking();
        booking.setDate(DATE);
        booking.addSlot(BookingSlot.of(LocalTime.of(9, 0), LocalTime.of(10, 0), BigDecimal.TEN));
        booking.addSlot(BookingSlot.of(LocalTime.of(8, 0), LocalTime.of(9, 0), BigDecimal.TEN));

        assertThat(booking.startsAt()).isEqualTo(DATE.atTime(8, 0));
    }

    @Test
    void cancellingAConfirmedBookingKeepsItWithStatusCancelled() {
        var booking = new Booking();
        LocalDateTime now = LocalDateTime.of(2026, 6, 1, 12, 0);

        booking.cancel(now);

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(booking.getCancelledAt()).isEqualTo(now);
    }

    @Test
    void onlyAConfirmedBookingCanBeCancelledOrRescheduled() {
        var cancelled = new Booking();
        cancelled.setId(7L);
        cancelled.cancel(LocalDateTime.now());
        var completed = new Booking();
        completed.setId(8L);
        completed.setStatus(BookingStatus.COMPLETED);

        assertThatThrownBy(() -> cancelled.cancel(LocalDateTime.now()))
                .isInstanceOf(ConflictException.class).hasMessage("Booking 7 is CANCELLED");
        assertThatThrownBy(() -> completed.cancel(LocalDateTime.now()))
                .isInstanceOf(ConflictException.class).hasMessage("Booking 8 is COMPLETED");
        assertThatThrownBy(() -> completed.reschedule(DATE, List.of()))
                .isInstanceOf(ConflictException.class).hasMessage("Booking 8 is COMPLETED");
    }
}
