package com.g02.padel.booking;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;

@Entity
@Table(name = "booking_slot")
@Getter
@Setter
@NoArgsConstructor
public class BookingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal price;

    /** A slot {@code [start, end)} with the price charged for it at booking time (never re-read from the schedule). */
    public static BookingSlot of(LocalTime start, LocalTime end, BigDecimal price) {
        if (!start.isBefore(end)) {
            throw new IllegalArgumentException("Slot start must be before its end");
        }
        if (price.signum() < 0) {
            throw new IllegalArgumentException("Slot price must not be negative");
        }
        var slot = new BookingSlot();
        slot.startTime = start;
        slot.endTime = end;
        slot.price = price.setScale(2, RoundingMode.HALF_UP);
        return slot;
    }
}
