package com.g02.padel.booking;

import com.g02.padel.court.Court;
import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Entity
@Table(name = "booking")
@Getter
@Setter
@NoArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "court_id", nullable = false)
    private Court court;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status = BookingStatus.CONFIRMED;

    @Column(name = "total_price", nullable = false, precision = 8, scale = 2)
    private BigDecimal totalPrice = new BigDecimal("0.00");

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("startTime")
    private List<BookingSlot> slots = new ArrayList<>();

    /** Adds a priced slot; the total is always the sum of the slot price snapshots. */
    public void addSlot(BookingSlot slot) {
        slots.add(slot);
        slot.setBooking(this);
        totalPrice = slots.stream().map(BookingSlot::getPrice).reduce(new BigDecimal("0.00"), BigDecimal::add);
    }

    /** Moves a confirmed booking to {@code newDate} with {@code newSlots}, replacing the old ones. */
    public void reschedule(LocalDate newDate, List<BookingSlot> newSlots) {
        requireConfirmed();
        date = newDate;
        slots.clear();
        newSlots.forEach(this::addSlot);
    }

    /** Soft-cancel: the booking is kept with status CANCELLED, freeing its slots. */
    public void cancel(LocalDateTime now) {
        requireConfirmed();
        status = BookingStatus.CANCELLED;
        cancelledAt = now;
    }

    public LocalDateTime startsAt() {
        return date.atTime(slots.stream().map(BookingSlot::getStartTime).min(Comparator.naturalOrder())
                .orElseThrow());
    }

    private void requireConfirmed() {
        if (status != BookingStatus.CONFIRMED) {
            throw new ConflictException("Booking " + id + " is " + status);
        }
    }
}
