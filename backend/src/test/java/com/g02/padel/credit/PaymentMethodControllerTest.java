package com.g02.padel.credit;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.credit.dto.AddPaymentMethodRequest;
import com.g02.padel.credit.dto.PaymentMethodResponse;
import com.g02.padel.credit.gateway.InvalidCardException;
import com.g02.padel.credit.usecase.AddPaymentMethodUseCase;
import com.g02.padel.credit.usecase.ListPaymentMethodsUseCase;
import com.g02.padel.credit.usecase.RemovePaymentMethodUseCase;
import com.g02.padel.credit.usecase.SetDefaultPaymentMethodUseCase;
import com.g02.padel.shared.enums.CardBrand;
import com.g02.padel.shared.exception.NotFoundException;
import java.time.YearMonth;
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

/** HTTP contract of payment methods (docs/api.md#payment-methods--apiv1payment-methods), use cases mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = PaymentMethodControllerTest.CLIENT, roles = "CLIENT")
class PaymentMethodControllerTest {

    static final String CLIENT = "ana@padel.test";
    private static final String PAN = "4242424242424242";
    private static final String BODY = """
            { "cardNumber": "4242 4242 4242 4242", "expiry": "2028-12", "holder": "Ana López" }
            """;
    private static final PaymentMethodResponse VISA =
            new PaymentMethodResponse(7L, CardBrand.VISA, "4242", YearMonth.of(2028, 12), true);

    @Autowired
    private MockMvc mvc;

    @MockBean
    private AddPaymentMethodUseCase addMethod;
    @MockBean
    private ListPaymentMethodsUseCase listMethods;
    @MockBean
    private SetDefaultPaymentMethodUseCase setDefault;
    @MockBean
    private RemovePaymentMethodUseCase removeMethod;

    @Test
    void listsTheCallersMethods() throws Exception {
        when(listMethods.execute(CLIENT)).thenReturn(List.of(VISA));

        mvc.perform(get("/api/v1/payment-methods"))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        [ { "id": 7, "brand": "VISA", "last4": "4242", "expiry": "2028-12", "default": true } ]
                        """, true));
    }

    @Test
    void addsACardAndAnswersWithoutTheNumberOrToken() throws Exception {
        when(addMethod.execute(eq(CLIENT), any())).thenReturn(VISA);

        mvc.perform(post("/api/v1/payment-methods").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated())
                .andExpect(content().json("""
                        { "id": 7, "brand": "VISA", "last4": "4242", "expiry": "2028-12", "default": true }
                        """, true))
                .andExpect(content().string(not(containsString(PAN))))
                .andExpect(content().string(not(containsString("tok_"))));
        verify(addMethod).execute(CLIENT,
                new AddPaymentMethodRequest("4242 4242 4242 4242", YearMonth.of(2028, 12), "Ana López"));
    }

    @Test
    void answers400ForACardTheGatewayRejectsWithoutEchoingTheNumber() throws Exception {
        when(addMethod.execute(eq(CLIENT), any())).thenThrow(new InvalidCardException("Invalid card number"));

        mvc.perform(post("/api/v1/payment-methods").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid card number"))
                .andExpect(content().string(not(containsString("4242 4242"))));
    }

    @Test
    void answers400WithFieldErrorsForMissingFields() throws Exception {
        mvc.perform(post("/api/v1/payment-methods").contentType(MediaType.APPLICATION_JSON).content("{ }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.cardNumber").exists())
                .andExpect(jsonPath("$.fieldErrors.expiry").exists())
                .andExpect(jsonPath("$.fieldErrors.holder").exists());
        verifyNoInteractions(addMethod);
    }

    @Test
    void answers400ForAHolderOver100Characters() throws Exception {
        String body = BODY.replace("Ana López", "A".repeat(101));

        mvc.perform(post("/api/v1/payment-methods").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.holder").exists());
        verifyNoInteractions(addMethod);
    }

    @ParameterizedTest
    @ValueSource(strings = {"12/28", "2028-13", "2028"})
    void answers400ForAMalformedExpiry(String expiry) throws Exception {
        String body = BODY.replace("2028-12", expiry);

        mvc.perform(post("/api/v1/payment-methods").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(addMethod);
    }

    @Test
    void makesAMethodTheDefault() throws Exception {
        when(setDefault.execute(7L, CLIENT)).thenReturn(VISA);

        mvc.perform(patch("/api/v1/payment-methods/7").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"default\": true }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.default").value(true));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{ \"default\": false }", "{ }"})
    void onlyAcceptsDefaultTrue(String body) throws Exception {
        mvc.perform(patch("/api/v1/payment-methods/7").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Only {\"default\": true} is supported"));
        verifyNoInteractions(setDefault);
    }

    @Test
    void removesAMethod() throws Exception {
        mvc.perform(delete("/api/v1/payment-methods/7")).andExpect(status().isNoContent());
        verify(removeMethod).execute(7L, CLIENT);
    }

    @Test
    void answers404ForAnotherClientsOrMissingMethod() throws Exception {
        when(setDefault.execute(9L, CLIENT)).thenThrow(NotFoundException.of("Payment method", 9L));
        doThrow(NotFoundException.of("Payment method", 9L)).when(removeMethod).execute(9L, CLIENT);

        mvc.perform(patch("/api/v1/payment-methods/9").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"default\": true }"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Payment method 9 not found"));
        mvc.perform(delete("/api/v1/payment-methods/9")).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "owner@padel.test", roles = "OWNER")
    void ownerIsForbidden() throws Exception {
        mvc.perform(get("/api/v1/payment-methods")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/payment-methods").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/payment-methods/7").contentType(MediaType.APPLICATION_JSON)
                .content("{ \"default\": true }")).andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/payment-methods/7")).andExpect(status().isForbidden());
        verifyNoInteractions(addMethod, listMethods, setDefault, removeMethod);
    }

    @Test
    @WithAnonymousUser
    void anonymousIsUnauthorized() throws Exception {
        mvc.perform(get("/api/v1/payment-methods")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/payment-methods").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(addMethod, listMethods);
    }
}
