package com.g02.padel.credit.usecase;

import static com.g02.padel.credit.usecase.PaymentMethodFixtures.CLIENT_EMAIL;
import static com.g02.padel.credit.usecase.PaymentMethodFixtures.client;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.g02.padel.credit.CreditTransactionRepository;
import com.g02.padel.credit.dto.CreditBalanceResponse;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;

/** The balance is the sum of the caller's transactions; the sum itself is covered by CreditIntegrationTest. */
class GetCreditBalanceUseCaseTest {

    private final CreditTransactionRepository transactions = mock(CreditTransactionRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final GetCreditBalanceUseCase useCase = new GetCreditBalanceUseCase(transactions, users);

    @Test
    void isTheSumOfTheCallersTransactions() {
        when(users.findByEmail(CLIENT_EMAIL)).thenReturn(Optional.of(client(42L, CLIENT_EMAIL)));
        when(transactions.sumCreditsByUserId(42L)).thenReturn(13L);

        assertThat(useCase.execute(CLIENT_EMAIL)).isEqualTo(new CreditBalanceResponse(13L));
    }

    @Test
    void isZeroWithoutTransactions() {
        when(users.findByEmail(CLIENT_EMAIL)).thenReturn(Optional.of(client(42L, CLIENT_EMAIL)));
        when(transactions.sumCreditsByUserId(42L)).thenReturn(0L);

        assertThat(useCase.execute(CLIENT_EMAIL).balance()).isZero();
    }

    @Test
    void throwsNotFoundForAnUnknownUser() {
        when(users.findByEmail("ghost@padel.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute("ghost@padel.test")).isInstanceOf(NotFoundException.class);
    }
}
