package com.g02.padel.credit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.credit.dto.CreditBalanceResponse;
import com.g02.padel.credit.dto.CreditTransactionResponse;
import com.g02.padel.credit.dto.PurchaseCreditsRequest;
import com.g02.padel.credit.dto.PurchaseResponse;
import com.g02.padel.credit.usecase.GetCreditBalanceUseCase;
import com.g02.padel.credit.usecase.ListCreditTransactionsUseCase;
import com.g02.padel.credit.usecase.PurchaseCreditsUseCase;
import com.g02.padel.shared.enums.CreditTransactionType;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.shared.exception.PaymentDeclinedException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** HTTP contract of credits (docs/api.md#credits--apiv1credit), use cases mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = CreditControllerTest.CLIENT, roles = "CLIENT")
class CreditControllerTest {

    static final String CLIENT = "ana@padel.test";
    private static final String BODY = "{ \"packId\": 2, \"paymentMethodId\": 7 }";
    private static final CreditTransactionResponse PURCHASE = new CreditTransactionResponse(31L,
            CreditTransactionType.PURCHASE, 10, new BigDecimal("140.00"), 10, 7L,
            Instant.parse("2026-06-08T10:15:00Z"));

    @Autowired
    private MockMvc mvc;

    @MockBean
    private PurchaseCreditsUseCase purchase;
    @MockBean
    private GetCreditBalanceUseCase balance;
    @MockBean
    private ListCreditTransactionsUseCase transactions;

    @Test
    void buysAPackAndAnswersTheNewBalanceAndTheTransaction() throws Exception {
        when(purchase.execute(eq(CLIENT), any())).thenReturn(new PurchaseResponse(15L, PURCHASE));

        mvc.perform(post("/api/v1/credit/purchases").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated())
                .andExpect(content().json("""
                        { "balance": 15, "transaction": { "id": 31, "type": "PURCHASE", "credits": 10,
                          "amount": 140.00, "packSize": 10, "paymentMethodId": 7,
                          "createdAt": "2026-06-08T10:15:00Z" } }
                        """, true));
        verify(purchase).execute(CLIENT, new PurchaseCreditsRequest(2L, 7L));
    }

    @Test
    void answers402WhenTheChargeIsDeclined() throws Exception {
        when(purchase.execute(eq(CLIENT), any())).thenThrow(new PaymentDeclinedException());

        mvc.perform(post("/api/v1/credit/purchases").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.status").value(402))
                .andExpect(jsonPath("$.error").value("Payment Required"))
                .andExpect(jsonPath("$.message").value("Payment declined: no credits were added"));
    }

    @Test
    void answers404ForAnUnknownPackOrPaymentMethod() throws Exception {
        when(purchase.execute(eq(CLIENT), any())).thenThrow(NotFoundException.of("Payment method", 7L));

        mvc.perform(post("/api/v1/credit/purchases").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Payment method 7 not found"));
    }

    @Test
    void answers400WhenThePackOrPaymentMethodIsMissing() throws Exception {
        mvc.perform(post("/api/v1/credit/purchases").contentType(MediaType.APPLICATION_JSON).content("{ }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.packId").exists())
                .andExpect(jsonPath("$.fieldErrors.paymentMethodId").exists());
        verifyNoInteractions(purchase);
    }

    @Test
    void answersTheBalance() throws Exception {
        when(balance.execute(CLIENT)).thenReturn(new CreditBalanceResponse(15L));

        mvc.perform(get("/api/v1/credit/balance"))
                .andExpect(status().isOk())
                .andExpect(content().json("{ \"balance\": 15 }", true));
    }

    @Test
    void pagesTheTransactions() throws Exception {
        Pageable page = PageRequest.of(1, 5);
        when(transactions.execute(eq(CLIENT), eq(page))).thenReturn(new PageImpl<>(List.of(PURCHASE), page, 6));

        mvc.perform(get("/api/v1/credit/transactions").param("page", "1").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(31))
                .andExpect(jsonPath("$.content[0].type").value("PURCHASE"))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalElements").value(6));
    }

    @Test
    @WithMockUser(username = "owner@padel.test", roles = "OWNER")
    void ownerIsForbidden() throws Exception {
        mvc.perform(post("/api/v1/credit/purchases").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/credit/balance")).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/credit/transactions")).andExpect(status().isForbidden());
        verifyNoInteractions(purchase, balance, transactions);
    }

    @Test
    @WithAnonymousUser
    void anonymousIsUnauthorized() throws Exception {
        mvc.perform(post("/api/v1/credit/purchases").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/credit/balance")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/credit/transactions")).andExpect(status().isUnauthorized());
        verifyNoInteractions(purchase, balance, transactions);
    }
}
