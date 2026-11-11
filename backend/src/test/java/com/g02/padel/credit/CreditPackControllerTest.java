package com.g02.padel.credit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.credit.dto.CreditPackResponse;
import com.g02.padel.credit.dto.UpdateCreditPackPriceRequest;
import com.g02.padel.credit.usecase.ListCreditPacksUseCase;
import com.g02.padel.credit.usecase.UpdateCreditPackPriceUseCase;
import com.g02.padel.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** HTTP contract of credit packs (docs/api.md#credit-packs--apiv1credit-packs), use cases mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "owner@padel.test", roles = "OWNER")
class CreditPackControllerTest {

    private static final CreditPackResponse TEN = new CreditPackResponse(2L, 10, new BigDecimal("140.00"));

    @Autowired
    private MockMvc mvc;

    @MockBean
    private ListCreditPacksUseCase listPacks;
    @MockBean
    private UpdateCreditPackPriceUseCase updatePrice;

    @Test
    void listsThePacks() throws Exception {
        when(listPacks.execute()).thenReturn(List.of(new CreditPackResponse(1L, 5, new BigDecimal("75.00")), TEN));

        mvc.perform(get("/api/v1/credit-packs"))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        [ { "id": 1, "size": 5, "price": 75.00 }, { "id": 2, "size": 10, "price": 140.00 } ]
                        """, true));
    }

    @Test
    void updatesThePriceOfAPack() throws Exception {
        CreditPackResponse updated = new CreditPackResponse(2L, 10, new BigDecimal("130.50"));
        when(updatePrice.execute(eq(2L), any())).thenReturn(updated);

        mvc.perform(patch("/api/v1/credit-packs/2").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"price\": 130.50 }"))
                .andExpect(status().isOk())
                .andExpect(content().json("{ \"id\": 2, \"size\": 10, \"price\": 130.50 }", true));
        verify(updatePrice).execute(2L, new UpdateCreditPackPriceRequest(new BigDecimal("130.50")));
    }

    @Test
    void ignoresTheSizeInTheBody() throws Exception {
        when(updatePrice.execute(eq(2L), any())).thenReturn(TEN);

        mvc.perform(patch("/api/v1/credit-packs/2").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"price\": 140.00, \"size\": 7 }"))
                .andExpect(status().isOk());
        verify(updatePrice).execute(2L, new UpdateCreditPackPriceRequest(new BigDecimal("140.00")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{ \"price\": -1 }", "{ \"price\": 12.345 }", "{ \"price\": 1000000 }", "{ }"})
    void rejectsAnInvalidPriceWith400(String body) throws Exception {
        mvc.perform(patch("/api/v1/credit-packs/2").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.price").exists());
        verifyNoInteractions(updatePrice);
    }

    @Test
    void rejectsANonNumericPriceWith400() throws Exception {
        mvc.perform(patch("/api/v1/credit-packs/2").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"price\": \"cheap\" }"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(updatePrice);
    }

    @Test
    void answers404ForAMissingPack() throws Exception {
        when(updatePrice.execute(eq(99L), any())).thenThrow(NotFoundException.of("Credit pack", 99L));

        mvc.perform(patch("/api/v1/credit-packs/99").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"price\": 10 }"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Credit pack 99 not found"));
    }

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void clientCannotListPacks() throws Exception {
        mvc.perform(get("/api/v1/credit-packs"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        verify(listPacks, never()).execute();
    }

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void clientCannotUpdateAPrice() throws Exception {
        mvc.perform(patch("/api/v1/credit-packs/2").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"price\": 1 }"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(updatePrice);
    }

    @Test
    @WithAnonymousUser
    void anonymousIsUnauthorized() throws Exception {
        mvc.perform(get("/api/v1/credit-packs")).andExpect(status().isUnauthorized());
        verifyNoInteractions(listPacks);
    }
}
