package com.g02.padel.credit.usecase;

import static com.g02.padel.credit.usecase.PaymentMethodFixtures.CLIENT_EMAIL;
import static com.g02.padel.credit.usecase.PaymentMethodFixtures.client;
import static com.g02.padel.credit.usecase.PaymentMethodFixtures.method;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.credit.CreditTransaction;
import com.g02.padel.credit.CreditTransactionRepository;
import com.g02.padel.credit.dto.CreditTransactionResponse;
import com.g02.padel.shared.enums.CreditTransactionType;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

class ListCreditTransactionsUseCaseTest {

    private final CreditTransactionRepository transactions = mock(CreditTransactionRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final ListCreditTransactionsUseCase useCase = new ListCreditTransactionsUseCase(transactions, users);

    @Test
    void pagesTheCallersTransactionsMostRecentFirstIgnoringTheRequestedSort() {
        User ana = client(42L, CLIENT_EMAIL);
        when(users.findByEmail(CLIENT_EMAIL)).thenReturn(Optional.of(ana));
        CreditTransaction consumption = new CreditTransaction();
        consumption.setId(32L);
        consumption.setUser(ana);
        consumption.setType(CreditTransactionType.CONSUMPTION);
        consumption.setCredits(-1);
        consumption.setCreatedAt(LocalDateTime.of(2026, 6, 9, 18, 0));
        CreditTransaction purchase = new CreditTransaction();
        purchase.setId(31L);
        purchase.setUser(ana);
        purchase.setType(CreditTransactionType.PURCHASE);
        purchase.setCredits(10);
        purchase.setAmount(new BigDecimal("140.00"));
        purchase.setPackSize(10);
        purchase.setPaymentMethod(method(7L, ana, "4242", true));
        purchase.setCreatedAt(LocalDateTime.of(2026, 6, 8, 10, 15));
        PageRequest unsorted = PageRequest.of(0, 20);
        when(transactions.findByUserIdOrderByCreatedAtDescIdDesc(42L, unsorted))
                .thenReturn(new PageImpl<>(List.of(consumption, purchase), unsorted, 2));

        Page<CreditTransactionResponse> page = useCase.execute(CLIENT_EMAIL, PageRequest.of(0, 20, Sort.by("credits")));

        verify(transactions).findByUserIdOrderByCreatedAtDescIdDesc(42L, unsorted);
        assertThat(page.getContent()).containsExactly(
                new CreditTransactionResponse(32L, CreditTransactionType.CONSUMPTION, -1, null, null, null,
                        Instant.parse("2026-06-09T18:00:00Z")),
                new CreditTransactionResponse(31L, CreditTransactionType.PURCHASE, 10, new BigDecimal("140.00"), 10,
                        7L, Instant.parse("2026-06-08T10:15:00Z")));
        assertThat(page.getTotalElements()).isEqualTo(2);
    }
}
