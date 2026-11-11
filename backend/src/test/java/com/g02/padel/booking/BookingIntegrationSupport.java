package com.g02.padel.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.court.Court;
import com.g02.padel.credit.CreditTransaction;
import com.g02.padel.credit.CreditTransactionRepository;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.OpeningHours;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.enums.CreditTransactionType;
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
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Shared data for booking integration tests: two clients, an owner and a court open 08:00-12:00 on DATE. Both
 * clients hold credits, so their bookings are paid by credit and need no card (paying is covered by
 * ClientBookingPaymentIntegrationTest).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(username = BookingIntegrationSupport.CLIENT_EMAIL, roles = "CLIENT")
abstract class BookingIntegrationSupport {

    static final String CLIENT_EMAIL = "booking-it-client@padel.test";
    static final String OTHER_EMAIL = "booking-it-other@padel.test";
    static final String OWNER_EMAIL = "booking-it-owner@padel.test";
    static final LocalDate DATE = LocalDate.now().plusDays(10);

    @Autowired
    MockMvc mvc;
    @Autowired
    CourtRepository courtRepository;
    @Autowired
    ScheduleRepository scheduleRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    BookingRepository bookingRepository;
    @Autowired
    CreditTransactionRepository creditTransactionRepository;

    Court court;
    Schedule schedule;
    User client;
    User other;

    @BeforeEach
    void setUp() {
        client = user(CLIENT_EMAIL, "Ana Client", Role.CLIENT);
        other = user(OTHER_EMAIL, "Other Client", Role.CLIENT);
        giveCredits(client, 20);
        giveCredits(other, 20);
        user(OWNER_EMAIL, "Owner", Role.OWNER);
        court = new Court();
        court.setName("Court " + UUID.randomUUID());
        court.setType(CourtType.GLASS);
        court = courtRepository.save(court);
        schedule = new Schedule();
        schedule.setCourt(court);
        schedule.setSlotMinutes(60);
        schedule.setPrice(new BigDecimal("16.50"));
        var hours = new OpeningHours();
        hours.setDayOfWeek(DATE.getDayOfWeek());
        hours.setOpenTime(LocalTime.of(8, 0));
        hours.setCloseTime(LocalTime.of(12, 0));
        schedule.addOpeningHours(hours);
        schedule = scheduleRepository.save(schedule);
    }

    String createBody(String... times) {
        var slots = new StringBuilder();
        for (int i = 0; i < times.length; i += 2) {
            slots.append(i == 0 ? "" : ", ")
                    .append("{ \"start\": \"%s\", \"end\": \"%s\" }".formatted(times[i], times[i + 1]));
        }
        return "{ \"courtId\": %d, \"date\": \"%s\", \"slots\": [ %s ] }".formatted(court.getId(), DATE, slots);
    }

    void giveCredits(User owner, int credits) {
        var purchase = new CreditTransaction();
        purchase.setUser(owner);
        purchase.setType(CreditTransactionType.PURCHASE);
        purchase.setCredits(credits);
        purchase.setAmount(new BigDecimal("0.00"));
        purchase.setPackSize(credits);
        creditTransactionRepository.save(purchase);
    }

    User user(String email, String name, Role role) {
        var user = new User();
        user.setEmail(email);
        user.setPasswordHash("x");
        user.setName(name);
        user.setRole(role);
        return userRepository.save(user);
    }
}
