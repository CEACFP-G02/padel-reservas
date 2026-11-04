package com.g02.padel.availability;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.BookingSlot;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.courtblock.CourtBlock;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.schedule.OpeningHours;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Schedule − bookings − blocks through the real use cases and database (rolled back after each test). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(username = "ana@padel.test", roles = "CLIENT")
class AvailabilityIntegrationTest {

    /** Far enough ahead that no slot has started and the lower window bound is not today. */
    private static final LocalDate DATE = LocalDate.now().plusDays(10);

    @Autowired
    private MockMvc mvc;
    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private ScheduleRepository scheduleRepository;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private CourtBlockRepository courtBlockRepository;
    @Autowired
    private UserRepository userRepository;

    private Court first;
    private Court second;

    @BeforeEach
    void twoCourtsOpenFromEightToEleven() {
        // Courts left by other tests must not take part in the club-wide search.
        courtRepository.findAll().forEach(c -> c.setActive(false));
        first = courtOpenOn(DATE, "08:00", "11:00");
        second = courtOpenOn(DATE, "08:00", "11:00");
    }

    @Test
    void courtDayIsTheScheduleMinusActiveBookingsAndBlocks() throws Exception {
        book(first, DATE, BookingStatus.CONFIRMED, "08:00", "09:00");
        book(first, DATE, BookingStatus.CANCELLED, "09:00", "10:00");
        block(first, DATE, "10:30", "11:00");

        mvc.perform(get("/api/v1/courts/" + first.getId() + "/availability").param("date", DATE.toString()))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        { "courtId": %d, "date": "%s", "slots": [
                          { "start": "08:00", "end": "09:00", "available": false },
                          { "start": "09:00", "end": "10:00", "available": true },
                          { "start": "10:00", "end": "11:00", "available": false } ] }
                        """.formatted(first.getId(), DATE)));
    }

    @Test
    void searchListsOnlySlotsWithEnoughCourtsAndProposesNearbyDays() throws Exception {
        book(first, DATE, BookingStatus.CONFIRMED, "08:00", "09:00");
        block(second, DATE, "10:00", "11:00");

        mvc.perform(get("/api/v1/availability").param("date", DATE.toString()).param("courts", "2"))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        { "available": true, "slots": [
                          { "start": "09:00", "end": "10:00", "courtsFree": 2, "courtIds": [%d, %d], "price": 16.00 } ],
                          "alternativeDays": [] }
                        """.formatted(first.getId(), second.getId())));

        block(first, DATE, "09:00", "10:00");

        // Both courts open the same weekday only, so the next room is a week away.
        mvc.perform(get("/api/v1/availability").param("date", DATE.toString()).param("courts", "2"))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        { "available": false, "slots": [], "alternativeDays": [
                          { "date": "%s", "freeSlotCount": 3 },
                          { "date": "%s", "freeSlotCount": 3 } ] }
                        """.formatted(DATE.minusDays(7), DATE.plusDays(7))));
    }

    @Test
    void anInactiveCourtGivesClientsNoSlots() throws Exception {
        first.setActive(false);

        mvc.perform(get("/api/v1/courts/" + first.getId() + "/availability").param("date", DATE.toString()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/availability").param("date", DATE.toString()).param("courts", "2"))
                .andExpect(status().isOk())
                .andExpect(content().json("{ \"available\": false, \"alternativeDays\": [] }"));
    }

    @Test
    void aPastDateIsRejected() throws Exception {
        mvc.perform(get("/api/v1/availability").param("date", LocalDate.now().minusDays(1).toString()))
                .andExpect(status().isBadRequest())
                .andExpect(content().json("{ \"status\": 400, \"message\": \"date must be today or later\" }"));
    }

    private Court courtOpenOn(LocalDate date, String open, String close) {
        var court = new Court();
        court.setName("Court " + UUID.randomUUID());
        court.setType(CourtType.GLASS);
        court = courtRepository.save(court);
        var schedule = new Schedule();
        schedule.setCourt(court);
        schedule.setSlotMinutes(60);
        schedule.setPrice(new BigDecimal("16.00"));
        var hours = new OpeningHours();
        hours.setDayOfWeek(date.getDayOfWeek());
        hours.setOpenTime(LocalTime.parse(open));
        hours.setCloseTime(LocalTime.parse(close));
        schedule.addOpeningHours(hours);
        scheduleRepository.save(schedule);
        return court;
    }

    private void book(Court court, LocalDate date, BookingStatus status, String start, String end) {
        var booking = new Booking();
        booking.setCourt(court);
        booking.setUser(client());
        booking.setDate(date);
        booking.setStatus(status);
        booking.setTotalPrice(new BigDecimal("16.00"));
        var slot = new BookingSlot();
        slot.setStartTime(LocalTime.parse(start));
        slot.setEndTime(LocalTime.parse(end));
        booking.addSlot(slot);
        bookingRepository.save(booking);
    }

    private void block(Court court, LocalDate date, String start, String end) {
        var block = new CourtBlock();
        block.setCourt(court);
        block.setDate(date);
        block.setStartTime(LocalTime.parse(start));
        block.setEndTime(LocalTime.parse(end));
        courtBlockRepository.save(block);
    }

    private User client() {
        var user = new User();
        user.setEmail(UUID.randomUUID() + "@padel.test");
        user.setPasswordHash("x");
        user.setName("Demo Client");
        user.setRole(Role.CLIENT);
        return userRepository.save(user);
    }
}
