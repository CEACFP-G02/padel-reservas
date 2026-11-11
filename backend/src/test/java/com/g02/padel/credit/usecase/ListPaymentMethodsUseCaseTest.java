package com.g02.padel.credit.usecase;

import static com.g02.padel.credit.usecase.PaymentMethodFixtures.CLIENT_EMAIL;
import static com.g02.padel.credit.usecase.PaymentMethodFixtures.client;
import static com.g02.padel.credit.usecase.PaymentMethodFixtures.method;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.g02.padel.credit.PaymentMethodRepository;
import com.g02.padel.credit.dto.PaymentMethodResponse;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class ListPaymentMethodsUseCaseTest {

    private final PaymentMethodRepository methods = mock(PaymentMethodRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final ListPaymentMethodsUseCase useCase = new ListPaymentMethodsUseCase(methods, users);

    @Test
    void listsTheCallersActiveMethodsWithTheDefaultFirst() {
        User ana = client(42L, CLIENT_EMAIL);
        when(users.findByEmail(CLIENT_EMAIL)).thenReturn(Optional.of(ana));
        when(methods.findByUserIdAndActiveTrueOrderByIdAsc(42L)).thenReturn(List.of(
                method(1L, ana, "1111", false), method(2L, ana, "2222", true), method(3L, ana, "3333", false)));

        assertThat(useCase.execute(CLIENT_EMAIL)).extracting(PaymentMethodResponse::id).containsExactly(2L, 1L, 3L);
    }

    @Test
    void isEmptyWhenTheCallerHasNoMethods() {
        when(users.findByEmail(CLIENT_EMAIL)).thenReturn(Optional.of(client(42L, CLIENT_EMAIL)));
        when(methods.findByUserIdAndActiveTrueOrderByIdAsc(42L)).thenReturn(List.of());

        assertThat(useCase.execute(CLIENT_EMAIL)).isEmpty();
    }
}
