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
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SetDefaultPaymentMethodUseCaseTest {

    private final PaymentMethodRepository methods = mock(PaymentMethodRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final SetDefaultPaymentMethodUseCase useCase = new SetDefaultPaymentMethodUseCase(methods, users);

    private final User ana = client(42L, CLIENT_EMAIL);

    @BeforeEach
    void setUp() {
        when(users.findByEmail(CLIENT_EMAIL)).thenReturn(Optional.of(ana));
    }

    @Test
    void makesItTheDefaultAndUnsetsTheOthers() {
        PaymentMethod oldDefault = method(1L, ana, "1111", true);
        PaymentMethod chosen = method(2L, ana, "2222", false);
        PaymentMethod other = method(3L, ana, "3333", false);
        when(methods.findByIdAndUserIdAndActiveTrue(2L, 42L)).thenReturn(Optional.of(chosen));
        when(methods.findByUserIdAndActiveTrueOrderByIdAsc(42L)).thenReturn(List.of(oldDefault, chosen, other));

        assertThat(useCase.execute(2L, CLIENT_EMAIL).defaultMethod()).isTrue();

        assertThat(chosen.isDefaultMethod()).isTrue();
        assertThat(oldDefault.isDefaultMethod()).isFalse();
        assertThat(other.isDefaultMethod()).isFalse();
    }

    @Test
    void keepsTheDefaultWhenItIsAlreadyTheDefault() {
        PaymentMethod chosen = method(1L, ana, "1111", true);
        when(methods.findByIdAndUserIdAndActiveTrue(1L, 42L)).thenReturn(Optional.of(chosen));
        when(methods.findByUserIdAndActiveTrueOrderByIdAsc(42L)).thenReturn(List.of(chosen));

        useCase.execute(1L, CLIENT_EMAIL);

        assertThat(chosen.isDefaultMethod()).isTrue();
    }

    @Test
    void throwsNotFoundForAMethodThatIsMissingRemovedOrNotTheCallers() {
        when(methods.findByIdAndUserIdAndActiveTrue(9L, 42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(9L, CLIENT_EMAIL))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Payment method 9 not found");
    }
}
