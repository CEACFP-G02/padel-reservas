package com.g02.padel.credit.usecase;

import static com.g02.padel.credit.usecase.PaymentMethodFixtures.CLIENT_EMAIL;
import static com.g02.padel.credit.usecase.PaymentMethodFixtures.client;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.credit.PaymentMethod;
import com.g02.padel.credit.PaymentMethodRepository;
import com.g02.padel.credit.dto.AddPaymentMethodRequest;
import com.g02.padel.credit.dto.PaymentMethodResponse;
import com.g02.padel.credit.gateway.InvalidCardException;
import com.g02.padel.credit.gateway.PaymentGateway;
import com.g02.padel.credit.gateway.TokenizedCard;
import com.g02.padel.shared.enums.CardBrand;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.lang.reflect.Field;
import java.time.YearMonth;
import java.util.Arrays;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class AddPaymentMethodUseCaseTest {

    private static final String PAN = "4242424242424242";
    private static final YearMonth EXPIRY = YearMonth.of(2028, 12);
    private static final AddPaymentMethodRequest REQUEST = new AddPaymentMethodRequest(PAN, EXPIRY, "Ana López");

    private final PaymentMethodRepository methods = mock(PaymentMethodRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final PaymentGateway gateway = mock(PaymentGateway.class);
    private final AddPaymentMethodUseCase useCase = new AddPaymentMethodUseCase(methods, users, gateway);

    private final User ana = client(42L, CLIENT_EMAIL);

    @BeforeEach
    void setUp() {
        when(users.findByEmail(CLIENT_EMAIL)).thenReturn(Optional.of(ana));
        when(gateway.tokenize(PAN, EXPIRY, "Ana López"))
                .thenReturn(new TokenizedCard("tok_mock_abc", CardBrand.VISA, "4242"));
        when(methods.save(any(PaymentMethod.class))).thenAnswer(invocation -> {
            PaymentMethod saved = invocation.getArgument(0);
            saved.setId(7L);
            return saved;
        });
    }

    @Test
    void storesOnlyTheSafeFieldsReturnedByTheGateway() {
        PaymentMethodResponse response = useCase.execute(CLIENT_EMAIL, REQUEST);

        ArgumentCaptor<PaymentMethod> saved = ArgumentCaptor.forClass(PaymentMethod.class);
        verify(methods).save(saved.capture());
        PaymentMethod method = saved.getValue();
        assertThat(method.getUser()).isSameAs(ana);
        assertThat(method.getBrand()).isEqualTo(CardBrand.VISA);
        assertThat(method.getLast4()).isEqualTo("4242");
        assertThat(method.getExpMonth()).isEqualTo(12);
        assertThat(method.getExpYear()).isEqualTo(2028);
        assertThat(method.getGatewayToken()).isEqualTo("tok_mock_abc");
        assertThat(method.isActive()).isTrue();
        assertThat(response).isEqualTo(new PaymentMethodResponse(7L, CardBrand.VISA, "4242", EXPIRY, true));
    }

    @Test
    void neverPutsTheCardNumberOnTheEntity() throws IllegalAccessException {
        useCase.execute(CLIENT_EMAIL, REQUEST);

        ArgumentCaptor<PaymentMethod> saved = ArgumentCaptor.forClass(PaymentMethod.class);
        verify(methods).save(saved.capture());
        for (Field field : PaymentMethod.class.getDeclaredFields()) {
            field.setAccessible(true);
            assertThat(String.valueOf(field.get(saved.getValue()))).as(field.getName()).doesNotContain(PAN);
        }
        assertThat(Arrays.stream(PaymentMethod.class.getDeclaredFields()).map(Field::getName))
                .doesNotContain("cardNumber", "pan", "number", "holder");
    }

    @Test
    void theFirstMethodBecomesTheDefault() {
        when(methods.existsByUserIdAndActiveTrue(42L)).thenReturn(false);

        assertThat(useCase.execute(CLIENT_EMAIL, REQUEST).defaultMethod()).isTrue();
    }

    @Test
    void laterMethodsAreNotTheDefault() {
        when(methods.existsByUserIdAndActiveTrue(42L)).thenReturn(true);

        assertThat(useCase.execute(CLIENT_EMAIL, REQUEST).defaultMethod()).isFalse();
    }

    @Test
    void storesNothingWhenTheGatewayRejectsTheCard() {
        when(gateway.tokenize(PAN, EXPIRY, "Ana López")).thenThrow(new InvalidCardException("Invalid card number"));

        assertThatThrownBy(() -> useCase.execute(CLIENT_EMAIL, REQUEST)).isInstanceOf(InvalidCardException.class);
        verify(methods, never()).save(any(PaymentMethod.class));
    }

    @Test
    void throwsNotFoundForAnUnknownUser() {
        when(users.findByEmail("ghost@padel.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute("ghost@padel.test", REQUEST)).isInstanceOf(NotFoundException.class);
        verify(gateway, never()).tokenize(any(), any(), any());
    }

    @Test
    void theRequestNeverPrintsTheCardNumber() {
        assertThat(REQUEST.toString()).doesNotContain(PAN).contains("4242");
    }
}
