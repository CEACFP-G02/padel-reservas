package com.g02.padel.credit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.g02.padel.shared.enums.CardBrand;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.time.YearMonth;
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
import org.springframework.transaction.annotation.Transactional;

/** Add → list → default → remove through the real use cases, mocked gateway and database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(username = PaymentMethodIntegrationTest.CLIENT_EMAIL, roles = "CLIENT")
class PaymentMethodIntegrationTest {

    static final String CLIENT_EMAIL = "payment-it-client@padel.test";
    private static final String PAN = "4242424242424242";
    private static final String EXPIRY = YearMonth.now().plusYears(2).toString();

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper json;
    @Autowired
    private UserRepository users;
    @Autowired
    private PaymentMethodRepository methods;
    @Autowired
    private JdbcTemplate jdbc;

    private User client;
    private User other;

    @BeforeEach
    void setUp() {
        client = user(CLIENT_EMAIL);
        other = user("payment-it-other@padel.test");
    }

    @Test
    void neverPersistsTheCardNumber() throws Exception {
        long id = add("4242 4242 4242 4242");
        methods.flush();

        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM payment_method WHERE id = ?", id);
        assertThat(row.values()).allSatisfy(value -> {
            String stored = String.valueOf(value).replaceAll("[\\s-]", "");
            assertThat(stored).doesNotContain(PAN).doesNotContain(PAN.substring(0, 12));
        });
        assertThat(row.keySet()).map(String::toLowerCase).containsExactlyInAnyOrder(
                "id", "user_id", "brand", "last4", "exp_month", "exp_year", "gateway_token", "is_default", "active",
                "created_at");
        assertThat(row).containsEntry("brand", "VISA").containsEntry("last4", "4242");
        assertThat((String) row.get("gateway_token")).startsWith("tok_mock_");
    }

    @Test
    void addsListsSetsTheDefaultAndRemoves() throws Exception {
        long first = add("4242 4242 4242 4242");
        long second = add("5555 5555 5555 4444");

        mvc.perform(get("/api/v1/payment-methods"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id").value(contains((int) first, (int) second)))
                .andExpect(jsonPath("$[0].default").value(true))
                .andExpect(jsonPath("$[1].default").value(false))
                .andExpect(jsonPath("$[1].brand").value("MASTERCARD"))
                .andExpect(content().string(not(containsString("tok_"))));

        mvc.perform(patch("/api/v1/payment-methods/" + second).contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"default\": true }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.default").value(true));
        mvc.perform(get("/api/v1/payment-methods"))
                .andExpect(jsonPath("$[0].id").value((int) second))
                .andExpect(jsonPath("$[?(@.default == true)]").value(hasSize(1)));

        mvc.perform(delete("/api/v1/payment-methods/" + second)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/payment-methods"))
                .andExpect(jsonPath("$[*].id").value(contains((int) first)))
                .andExpect(jsonPath("$[0].default").value(false));
        mvc.perform(delete("/api/v1/payment-methods/" + second)).andExpect(status().isNotFound());
    }

    @Test
    void rejectsAnInvalidCardAndStoresNothing() throws Exception {
        mvc.perform(post("/api/v1/payment-methods").contentType(MediaType.APPLICATION_JSON)
                        .content(body("4242 4242 4242 4241")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid card number"));

        assertThat(methods.findByUserIdAndActiveTrueOrderByIdAsc(client.getId())).isEmpty();
    }

    @Test
    void rejectsAnExpiredCard() throws Exception {
        mvc.perform(post("/api/v1/payment-methods").contentType(MediaType.APPLICATION_JSON)
                        .content(body("4242 4242 4242 4242").replace(EXPIRY, YearMonth.now().minusMonths(1).toString())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Card expired"));
    }

    @Test
    void doesNotExposeOrTouchAnotherClientsMethods() throws Exception {
        PaymentMethod theirs = new PaymentMethod();
        theirs.setUser(other);
        theirs.setBrand(CardBrand.VISA);
        theirs.setLast4("1111");
        theirs.setExpMonth(12);
        theirs.setExpYear(2030);
        theirs.setGatewayToken("tok_mock_theirs");
        theirs.setDefaultMethod(true);
        theirs = methods.save(theirs);

        mvc.perform(get("/api/v1/payment-methods")).andExpect(content().json("[]"));
        mvc.perform(patch("/api/v1/payment-methods/" + theirs.getId()).contentType(MediaType.APPLICATION_JSON)
                .content("{ \"default\": true }")).andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/payment-methods/" + theirs.getId())).andExpect(status().isNotFound());
        assertThat(methods.findById(theirs.getId())).get().satisfies(m -> assertThat(m.isActive()).isTrue());
    }

    private long add(String cardNumber) throws Exception {
        String response = mvc.perform(post("/api/v1/payment-methods").contentType(MediaType.APPLICATION_JSON)
                        .content(body(cardNumber)))
                .andExpect(status().isCreated())
                .andExpect(content().string(not(containsString(cardNumber.replace(" ", "")))))
                .andReturn().getResponse().getContentAsString();
        JsonNode created = json.readTree(response);
        return created.get("id").asLong();
    }

    private static String body(String cardNumber) {
        return "{ \"cardNumber\": \"" + cardNumber + "\", \"expiry\": \"" + EXPIRY + "\", \"holder\": \"Ana López\" }";
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
