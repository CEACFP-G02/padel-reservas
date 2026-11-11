package com.g02.padel.credit.usecase;

import static com.g02.padel.credit.usecase.PaymentMethodFixtures.CLIENT_EMAIL;
import static com.g02.padel.credit.usecase.PaymentMethodFixtures.client;
import static com.g02.padel.credit.usecase.PaymentMethodFixtures.method;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.g02.padel.credit.PaymentMethod;
import com.g02.padel.credit.PaymentMethodRepository;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RemovePaymentMethodUseCaseTest {

    private final PaymentMethodRepository methods = mock(PaymentMethodRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final RemovePaymentMethodUseCase useCase = new RemovePaymentMethodUseCase(methods, users);

    private final User ana = client(42L, CLIENT_EMAIL);

    @BeforeEach
    void setUp() {
        when(users.findByEmail(CLIENT_EMAIL)).thenReturn(Optional.of(ana));
    }

    @Test
    void deactivatesTheMethod() {
        PaymentMethod method = method(2L, ana, "2222", false);
        when(methods.findByIdAndUserIdAndActiveTrue(2L, 42L)).thenReturn(Optional.of(method));

        useCase.execute(2L, CLIENT_EMAIL);

        assertThat(method.isActive()).isFalse();
    }

    @Test
    void clearsTheDefaultWhenRemovingTheDefault() {
        PaymentMethod method = method(1L, ana, "1111", true);
        when(methods.findByIdAndUserIdAndActiveTrue(1L, 42L)).thenReturn(Optional.of(method));

        useCase.execute(1L, CLIENT_EMAIL);

        assertThat(method.isActive()).isFalse();
        assertThat(method.isDefaultMethod()).isFalse();
    }

    @Test
    void throwsNotFoundForAMethodThatIsMissingRemovedOrNotTheCallers() {
        when(methods.findByIdAndUserIdAndActiveTrue(9L, 42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(9L, CLIENT_EMAIL))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Payment method 9 not found");
    }
}
