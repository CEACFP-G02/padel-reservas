package com.g02.padel.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.g02.padel.credit.CreditTransaction;
import com.g02.padel.credit.CreditTransactionRepository;
import com.g02.padel.credit.gateway.MockPaymentGateway;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.enums.CreditTransactionType;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.schedule.OpeningHours;
import com.g02.padel.schedule.Schedule;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/**
 * POST /bookings paid credit first, then money (docs/api.md, "Paying a client booking"), through the real use
 * case, ledger, mocked gateway and database. Deliberately NOT @Transactional: each request commits or rolls back
 * for real, so "nothing happens" on an error is observed as it would be in production. Rows are removed after
 * each test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = ClientBookingPaymentIntegrationTest.PAYER, roles = "CLIENT")
class ClientBookingPaymentIntegrationTest {

    static final String PAYER = "booking-pay-it-client@padel.test";
    private static final String OTHER = "booking-pay-it-other@padel.test";
    private static final String OWNER = "booking-pay-it-owner@padel.test";
    private static final LocalDate DATE = LocalDate.now().plusDays(10);
    private static final String EXPIRY = YearMonth.now().plusYears(2).toString();
    private static final String APPROVING_CARD = "4242 4242 4242 4242";
    private static final String DECLINING_CARD = "4000 0000 0002 0000";

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper json;
    @Autowired
    private UserRepository users;
    @Autowired
    private CourtRepository courts;
    @Autowired
    private ScheduleRepository schedules;
    @Autowired
    private CreditTransactionRepository transactions;
    @Autowired
    private JdbcTemplate jdbc;
    @SpyBean
    private MockPaymentGateway gateway;

    private User payer;
    private User other;
    private Court court;

    @BeforeEach
    void setUp() {
        payer = newUser(PAYER, Role.CLIENT);
        other = newUser(OTHER, Role.CLIENT);
        newUser(OWNER, Role.OWNER);
        court = new Court();
        court.setName("Court " + UUID.randomUUID());
        court.setType(CourtType.GLASS);
        court = courts.save(court);
        Schedule schedule = new Schedule();
        schedule.setCourt(court);
        schedule.setSlotMinutes(60);
        schedule.setPrice(new BigDecimal("16.50"));
        OpeningHours hours = new OpeningHours();
        hours.setDayOfWeek(DATE.getDayOfWeek());
        hours.setOpenTime(LocalTime.of(8, 0));
        hours.setCloseTime(LocalTime.of(12, 0));
        schedule.addOpeningHours(hours);
        schedules.save(schedule);
    }

    @AfterEach
    void cleanUp() {
        String ids = "SELECT id FROM app_user WHERE email IN ('" + PAYER + "', '" + OTHER + "', '" + OWNER + "')";
        jdbc.update("DELETE FROM credit_transaction WHERE user_id IN (" + ids + ")");
        jdbc.update("DELETE FROM booking_slot WHERE booking_id IN (SELECT id FROM booking WHERE court_id = ?)",
                court.getId());
        jdbc.update("DELETE FROM booking WHERE court_id = ?", court.getId());
        jdbc.update("DELETE FROM payment_method WHERE user_id IN (" + ids + ")");
        jdbc.update("DELETE FROM opening_hours WHERE schedule_id IN (SELECT id FROM schedule WHERE court_id = ?)",
                court.getId());
        jdbc.update("DELETE FROM schedule WHERE court_id = ?", court.getId());
        jdbc.update("DELETE FROM court WHERE id = ?", court.getId());
        jdbc.update("DELETE FROM app_user WHERE id IN (" + ids + ")");
    }

    @Test
    void creditsCoveringEverySlotPayTheBookingWithoutACard() throws Exception {
        giveCredits(payer, 3);

        book(null, "10:00", "11:00", "11:00", "12:00")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalPrice").value(33.00))
                .andExpect(jsonPath("$.slots[*].price").value(org.hamcrest.Matchers.contains(16.50, 16.50)))
                .andExpect(jsonPath("$.payment.creditsUsed").value(2))
                .andExpect(jsonPath("$.payment.slotsChargedInMoney").value(0))
                .andExpect(jsonPath("$.payment.amountCharged").value(0.00))
                .andExpect(jsonPath("$.payment.paymentMethodId").doesNotExist())
                .andExpect(jsonPath("$.payment.chargeReference").doesNotExist());

        balanceIs(1);
        mvc.perform(get("/api/v1/credit/transactions"))
                .andExpect(jsonPath("$.content[0].type").value("CONSUMPTION"))
                .andExpect(jsonPath("$.content[0].credits").value(-2))
                .andExpect(jsonPath("$.totalElements").value(2));
        verify(gateway, never()).charge(any(), any());
    }

    @Test
    void partialCreditPaysSomeSlotsAndTheRestIsChargedToTheCard() throws Exception {
        giveCredits(payer, 1);
        long card = addCard(APPROVING_CARD);

        String response = book(card, "10:00", "11:00", "11:00", "12:00")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.payment.creditsUsed").value(1))
                .andExpect(jsonPath("$.payment.slotsChargedInMoney").value(1))
                .andExpect(jsonPath("$.payment.amountCharged").value(16.50))
                .andExpect(jsonPath("$.payment.paymentMethodId").value((int) card))
                .andReturn().getResponse().getContentAsString();
        long bookingId = json.readTree(response).get("id").asLong();
        String reference = json.readTree(response).get("payment").get("chargeReference").asText();
        assertThat(reference).startsWith("ch_mock_");

        balanceIs(0);
        verify(gateway).charge(any(), org.mockito.ArgumentMatchers.eq(new BigDecimal("16.50")));
        Map<String, Object> consumption = jdbc.queryForMap(
                "SELECT credits, booking_id FROM credit_transaction WHERE user_id = ? AND type = 'CONSUMPTION'",
                payer.getId());
        assertThat(consumption).containsEntry("credits", -1).containsEntry("booking_id", bookingId);
        Map<String, Object> booking = jdbc.queryForMap(
                "SELECT credits_used, amount_charged, payment_method_id, charge_reference FROM booking WHERE id = ?",
                bookingId);
        assertThat(booking).containsEntry("credits_used", 1).containsEntry("payment_method_id", card)
                .containsEntry("charge_reference", reference);
        assertThat(booking.get("amount_charged").toString()).isEqualTo("16.50");
    }

    @Test
    void withoutCreditEverySlotIsChargedToTheCard() throws Exception {
        long card = addCard(APPROVING_CARD);

        book(card, "10:00", "11:00", "11:00", "12:00")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.payment.creditsUsed").value(0))
                .andExpect(jsonPath("$.payment.slotsChargedInMoney").value(2))
                .andExpect(jsonPath("$.payment.amountCharged").value(33.00));

        verify(gateway).charge(any(), org.mockito.ArgumentMatchers.eq(new BigDecimal("33.00")));
        balanceIs(0);
        mvc.perform(get("/api/v1/credit/transactions")).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void aDeclinedCardIs402AndNothingIsBookedOrConsumed() throws Exception {
        giveCredits(payer, 1);
        long declining = addCard(DECLINING_CARD);

        book(declining, "10:00", "11:00", "11:00", "12:00")
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.message").value("Payment declined: the booking was not made"));

        nothingWasBookedAndTheBalanceIs(1);
    }

    @Test
    void aMoneyRemainderWithoutAPaymentMethodIs400() throws Exception {
        giveCredits(payer, 1);

        book(null, "10:00", "11:00", "11:00", "12:00")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("paymentMethodId is required to pay the 1 slot not covered by credits"));

        nothingWasBookedAndTheBalanceIs(1);
        verify(gateway, never()).charge(any(), any());
    }

    @Test
    void someoneElsesPaymentMethodIs404() throws Exception {
        long theirs = addCard(APPROVING_CARD, OTHER);

        book(theirs, "10:00", "11:00")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Payment method " + theirs + " not found"));

        nothingWasBookedAndTheBalanceIs(0);
        verify(gateway, never()).charge(any(), any());
    }

    @Test
    void aSlotConflictIs409WithNoCreditSpentAndNoCharge() throws Exception {
        long theirCard = addCard(APPROVING_CARD, OTHER);
        mvc.perform(post("/api/v1/bookings").with(user(OTHER).roles("CLIENT"))
                        .contentType(MediaType.APPLICATION_JSON).content(body(theirCard, "11:00", "12:00")))
                .andExpect(status().isCreated());
        org.mockito.Mockito.clearInvocations(gateway);
        giveCredits(payer, 1);
        long card = addCard(APPROVING_CARD);

        book(card, "10:00", "11:00", "11:00", "12:00")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("11:00-12:00 is not available on court " + court.getId()));

        balanceIs(1);
        assertThat(bookingsOf(payer)).isZero();
        verify(gateway, never()).charge(any(), any());
    }

    @Test
    @WithMockUser(username = OWNER, roles = "OWNER")
    void anOwnerManualBookingDoesNotUseTheClientsCreditsNorChargeACard() throws Exception {
        giveCredits(payer, 2);

        mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON).content("""
                        { "courtId": %d, "date": "%s", "slots": [ { "start": "10:00", "end": "11:00" } ],
                          "clientId": %d }
                        """.formatted(court.getId(), DATE, payer.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(payer.getId().intValue()))
                .andExpect(jsonPath("$.payment").doesNotExist());

        assertThat(transactions.sumCreditsByUserId(payer.getId())).isEqualTo(2);
        verify(gateway, never()).charge(any(), any());
    }

    private void nothingWasBookedAndTheBalanceIs(long credits) throws Exception {
        balanceIs(credits);
        assertThat(bookingsOf(payer)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM credit_transaction WHERE user_id = ? AND type = 'CONSUMPTION'",
                Long.class, payer.getId())).isZero();
        mvc.perform(get("/api/v1/courts/" + court.getId() + "/availability").param("date", DATE.toString()))
                .andExpect(jsonPath("$.slots[*].available").value(org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is(true))));
    }

    private long bookingsOf(User client) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM booking WHERE user_id = ?", Long.class, client.getId());
    }

    private void balanceIs(long credits) throws Exception {
        mvc.perform(get("/api/v1/credit/balance").with(user(PAYER).roles("CLIENT")))
                .andExpect(jsonPath("$.balance").value(credits));
    }

    private ResultActions book(Long paymentMethodId, String... times) throws Exception {
        return mvc.perform(post("/api/v1/bookings").contentType(MediaType.APPLICATION_JSON)
                .content(body(paymentMethodId, times)));
    }

    private String body(Long paymentMethodId, String... times) {
        StringBuilder slots = new StringBuilder();
        for (int i = 0; i < times.length; i += 2) {
            slots.append(i == 0 ? "" : ", ")
                    .append("{ \"start\": \"%s\", \"end\": \"%s\" }".formatted(times[i], times[i + 1]));
        }
        return "{ \"courtId\": %d, \"date\": \"%s\", \"slots\": [ %s ]%s }".formatted(court.getId(), DATE, slots,
                paymentMethodId == null ? "" : ", \"paymentMethodId\": " + paymentMethodId);
    }

    private long addCard(String number) throws Exception {
        return addCard(number, PAYER);
    }

    private long addCard(String number, String email) throws Exception {
        String response = mvc.perform(post("/api/v1/payment-methods").with(user(email).roles("CLIENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"cardNumber\": \"" + number + "\", \"expiry\": \"" + EXPIRY
                                + "\", \"holder\": \"Ana López\" }"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("id").asLong();
    }

    /** Credits as if a pack had been bought (the purchase flow itself is covered by CreditIntegrationTest). */
    private void giveCredits(User client, int credits) {
        CreditTransaction purchase = new CreditTransaction();
        purchase.setUser(client);
        purchase.setType(CreditTransactionType.PURCHASE);
        purchase.setCredits(credits);
        purchase.setAmount(new BigDecimal("0.00"));
        purchase.setPackSize(credits);
        transactions.save(purchase);
    }

    private User newUser(String email, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setName("User " + email);
        user.setPasswordHash("x");
        user.setRole(role);
        return users.save(user);
    }
}
