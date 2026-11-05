package com.g02.padel.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

/** Persistence slice: booking + booking_slot mapping, status as VARCHAR and the slot price snapshot. */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class BookingRepositoryTest {

    private static final LocalDate DATE = LocalDate.of(2026, 6, 8);

    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private ScheduleRepository scheduleRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EntityManager em;
    @Autowired
    private JdbcTemplate jdbc;

    private Court court;
    private User client;

    @BeforeEach
    void setUp() {
        court = new Court();
        court.setName("Court " + UUID.randomUUID());
        court.setType(CourtType.GLASS);
        court = courtRepository.save(court);
        client = new User();
        client.setEmail(UUID.randomUUID() + "@padel.test");
        client.setPasswordHash("x");
        client.setName("Demo Client");
        client.setRole(Role.CLIENT);
        client = userRepository.save(client);
    }

    @Test
    void savesTheBookingWithItsPricedSlotsOrderedByStart() {
        Booking booking = booking(slot(9, "16.50"), slot(8, "16.00"));
        bookingRepository.saveAndFlush(booking);
        em.clear();

        Booking found = bookingRepository.findById(booking.getId()).orElseThrow();

        assertThat(found.getCourt().getId()).isEqualTo(court.getId());
        assertThat(found.getUser().getName()).isEqualTo("Demo Client");
        assertThat(found.getTotalPrice()).isEqualTo(new BigDecimal("32.50"));
        assertThat(found.getSlots()).extracting(BookingSlot::getStartTime)
                .containsExactly(LocalTime.of(8, 0), LocalTime.of(9, 0));
        assertThat(found.getSlots()).extracting(BookingSlot::getPrice)
                .containsExactly(new BigDecimal("16.00"), new BigDecimal("16.50"));
        assertThat(jdbc.queryForObject("SELECT status FROM booking WHERE id = ?", String.class, booking.getId()))
                .isEqualTo("CONFIRMED");
    }

    @Test
    void aLaterSchedulePriceChangeDoesNotAlterABookedSlot() {
        var schedule = new Schedule();
        schedule.setCourt(court);
        schedule.setSlotMinutes(60);
        schedule.setPrice(new BigDecimal("16.00"));
        scheduleRepository.saveAndFlush(schedule);
        Booking booking = bookingRepository.saveAndFlush(booking(slot(8, schedule.getPrice().toPlainString())));

        schedule.setPrice(new BigDecimal("25.00"));
        scheduleRepository.saveAndFlush(schedule);
        em.clear();

        Booking found = bookingRepository.findById(booking.getId()).orElseThrow();
        assertThat(found.getSlots().get(0).getPrice()).isEqualTo(new BigDecimal("16.00"));
        assertThat(found.getTotalPrice()).isEqualTo(new BigDecimal("16.00"));
    }

    @Test
    void reschedulingRemovesTheOldSlotRows() {
        Booking booking = bookingRepository.saveAndFlush(booking(slot(8, "16.00"), slot(9, "16.00")));

        booking.reschedule(DATE.plusDays(1), List.of(slot(18, "16.00")));
        bookingRepository.saveAndFlush(booking);

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM booking_slot WHERE booking_id = ?", Integer.class,
                booking.getId())).isEqualTo(1);
    }

    @Test
    void theSchemaRejectsASlotWithoutPriceOrWithANegativeOne() {
        Booking booking = bookingRepository.saveAndFlush(booking(slot(8, "16.00")));

        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO booking_slot (booking_id, start_time, end_time) VALUES (?, '10:00', '11:00')""",
                booking.getId())).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO booking_slot (booking_id, start_time, end_time, price) VALUES (?, '10:00', '11:00', -1)""",
                booking.getId())).isInstanceOf(DataIntegrityViolationException.class);
    }

    private Booking booking(BookingSlot... slots) {
        var booking = new Booking();
        booking.setCourt(court);
        booking.setUser(client);
        booking.setDate(DATE);
        for (BookingSlot slot : slots) {
            booking.addSlot(slot);
        }
        return booking;
    }

    private static BookingSlot slot(int startHour, String price) {
        return BookingSlot.of(LocalTime.of(startHour, 0), LocalTime.of(startHour + 1, 0), new BigDecimal(price));
    }
}
