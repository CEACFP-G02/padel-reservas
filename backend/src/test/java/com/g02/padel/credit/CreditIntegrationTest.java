package com.g02.padel.credit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.g02.padel.shared.enums.CardBrand;
import com.g02.padel.shared.enums.CreditTransactionType;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

/** Purchase → balance → transactions through the real use cases, the mocked gateway and the database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(username = CreditIntegrationTest.CLIENT_EMAIL, roles = "CLIENT")
class CreditIntegrationTest {

    static final String CLIENT_EMAIL = "credit-it-client@padel.test";
    private static final String EXPIRY = YearMonth.now().plusYears(2).toString();

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper json;
    @Autowired
    private UserRepository users;
    @Autowired
    private CreditPackRepository packs;
    @Autowired
    private PaymentMethodRepository methods;
    @Autowired
    private CreditTransactionRepository transactions;
    @Autowired
    private JdbcTemplate jdbc;

    private User client;
    private long fivePack;
    private long tenPack;

    @BeforeEach
    void setUp() {
        client = user(CLIENT_EMAIL);
        fivePack = packs.findAllByOrderBySizeAsc().get(0).getId();
        tenPack = packs.findAllByOrderBySizeAsc().get(1).getId();
    }

    @Test
    void buysPacksAndKeepsABalanceAndAHistory() throws Exception {
        long card = addCard("4242 4242 4242 4242");

        mvc.perform(get("/api/v1/credit/balance")).andExpect(jsonPath("$.balance").value(0));

        buy(tenPack, card)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.balance").value(10))
                .andExpect(jsonPath("$.transaction.type").value("PURCHASE"))
                .andExpect(jsonPath("$.transaction.credits").value(10))
                .andExpect(jsonPath("$.transaction.amount").value(140.00))
                .andExpect(jsonPath("$.transaction.packSize").value(10))
                .andExpect(jsonPath("$.transaction.paymentMethodId").value((int) card));
        buy(fivePack, card).andExpect(status().isCreated()).andExpect(jsonPath("$.balance").value(15));

        // A later consumption (not exposed by the API yet) counts in the running sum.
        CreditTransaction consumption = new CreditTransaction();
        consumption.setUser(client);
        consumption.setType(CreditTransactionType.CONSUMPTION);
        consumption.setCredits(-1);
        consumption.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC).plusHours(1));
        transactions.save(consumption);

        mvc.perform(get("/api/v1/credit/balance")).andExpect(jsonPath("$.balance").value(14));
        mvc.perform(get("/api/v1/credit/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].credits").value(contains(-1, 5, 10)))
                .andExpect(jsonPath("$.content[0].amount").doesNotExist())
                .andExpect(jsonPath("$.totalElements").value(3));
        mvc.perform(get("/api/v1/credit/transactions").param("size", "1").param("page", "1"))
                .andExpect(jsonPath("$.content[*].credits").value(contains(5)))
                .andExpect(jsonPath("$.totalPages").value(3));
    }

    @Test
    void recordsAnAuditablePurchase() throws Exception {
        long card = addCard("4242 4242 4242 4242");
        buy(tenPack, card).andExpect(status().isCreated());
        transactions.flush();

        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM credit_transaction WHERE user_id = ?",
                client.getId());
        assertThat(row).containsEntry("type", "PURCHASE").containsEntry("credits", 10)
                .containsEntry("pack_size", 10).containsEntry("payment_method_id", card);
        assertThat(row.get("amount").toString()).isEqualTo("140.00");
        assertThat((String) row.get("charge_reference")).startsWith("ch_mock_");
        assertThat(row.get("created_at")).isNotNull();
    }

    @Test
    void aDeclinedCardAddsNoCreditsAndAnswers402() throws Exception {
        long declining = addCard("4000 0000 0002 0000");

        buy(tenPack, declining)
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.message").value("Payment declined: no credits were added"));

        mvc.perform(get("/api/v1/credit/balance")).andExpect(jsonPath("$.balance").value(0));
        mvc.perform(get("/api/v1/credit/transactions")).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void cannotPayWithSomeoneElsesCardOrBuyAnUnknownPack() throws Exception {
        User other = user("credit-it-other@padel.test");
        PaymentMethod theirs = new PaymentMethod();
        theirs.setUser(other);
        theirs.setBrand(CardBrand.VISA);
        theirs.setLast4("4242");
        theirs.setExpMonth(12);
        theirs.setExpYear(2030);
        theirs.setGatewayToken("tok_mock_other");
        theirs.setDefaultMethod(true);
        theirs = methods.save(theirs);
        long mine = addCard("4242 4242 4242 4242");

        buy(tenPack, theirs.getId())
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Payment method " + theirs.getId() + " not found"));
        buy(999_999L, mine)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Credit pack 999999 not found"));
        mvc.perform(get("/api/v1/credit/balance")).andExpect(jsonPath("$.balance").value(0));
    }

    private ResultActions buy(long packId, long paymentMethodId) throws Exception {
        return mvc.perform(post("/api/v1/credit/purchases").contentType(MediaType.APPLICATION_JSON)
                .content("{ \"packId\": " + packId + ", \"paymentMethodId\": " + paymentMethodId + " }"));
    }

    private long addCard(String number) throws Exception {
        String response = mvc.perform(post("/api/v1/payment-methods").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"cardNumber\": \"" + number + "\", \"expiry\": \"" + EXPIRY
                                + "\", \"holder\": \"Ana López\" }"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("id").asLong();
    }

    private User user(String email) {
        User user = new User();
        user.setEmail(email);
        user.setName("Cliente " + email);
        user.setPasswordHash("$2a$10$hash");
        user.setRole(Role.CLIENT);
        return users.save(user);
    }
}
