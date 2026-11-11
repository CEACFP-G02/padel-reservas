package com.g02.padel.credit.usecase;

import static com.g02.padel.credit.usecase.CreditPackFixtures.pack;
import static com.g02.padel.credit.usecase.PaymentMethodFixtures.CLIENT_EMAIL;
import static com.g02.padel.credit.usecase.PaymentMethodFixtures.client;
import static com.g02.padel.credit.usecase.PaymentMethodFixtures.method;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.g02.padel.credit.CreditPackRepository;
import com.g02.padel.credit.CreditTransaction;
import com.g02.padel.credit.CreditTransactionRepository;
import com.g02.padel.credit.PaymentMethod;
import com.g02.padel.credit.PaymentMethodRepository;
import com.g02.padel.credit.dto.CreditTransactionResponse;
import com.g02.padel.credit.dto.PurchaseCreditsRequest;
import com.g02.padel.credit.dto.PurchaseResponse;
import com.g02.padel.credit.gateway.ChargeResult;
import com.g02.padel.credit.gateway.ChargeStatus;
import com.g02.padel.credit.gateway.PaymentGateway;
import com.g02.padel.shared.enums.CreditTransactionType;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.shared.exception.PaymentDeclinedException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class PurchaseCreditsUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-06-08T10:15:00Z");
    private static final PurchaseCreditsRequest REQUEST = new PurchaseCreditsRequest(2L, 7L);

    private final CreditPackRepository packs = mock(CreditPackRepository.class);
    private final PaymentMethodRepository methods = mock(PaymentMethodRepository.class);
    private final CreditTransactionRepository transactions = mock(CreditTransactionRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final PaymentGateway gateway = mock(PaymentGateway.class);
    private final PurchaseCreditsUseCase useCase = new PurchaseCreditsUseCase(packs, methods, transactions, users,
            gateway, Clock.fixed(NOW, ZoneId.of("Europe/Madrid")));

    private final User ana = client(42L, CLIENT_EMAIL);
    private final PaymentMethod card = method(7L, ana, "4242", true);

    @BeforeEach
    void setUp() {
        when(users.findByEmail(CLIENT_EMAIL)).thenReturn(Optional.of(ana));
        when(packs.findById(2L)).thenReturn(Optional.of(pack(2L, 10, "140.00")));
        when(methods.findByIdAndUserIdAndActiveTrue(7L, 42L)).thenReturn(Optional.of(card));
        when(transactions.save(any(CreditTransaction.class))).thenAnswer(invocation -> {
            CreditTransaction saved = invocation.getArgument(0);
            saved.setId(31L);
            return saved;
        });
    }

    @Test
    void chargesThePackPriceAndAddsItsCreditsWithAnAuditablePurchase() {
        when(gateway.charge("tok_mock_7", new BigDecimal("140.00")))
                .thenReturn(new ChargeResult(ChargeStatus.APPROVED, "ch_mock_1"));
        when(transactions.sumCreditsByUserId(42L)).thenReturn(15L);

        PurchaseResponse response = useCase.execute(CLIENT_EMAIL, REQUEST);

        ArgumentCaptor<CreditTransaction> saved = ArgumentCaptor.forClass(CreditTransaction.class);
        verify(transactions).save(saved.capture());
        CreditTransaction purchase = saved.getValue();
        assertThat(purchase.getUser()).isSameAs(ana);
        assertThat(purchase.getType()).isEqualTo(CreditTransactionType.PURCHASE);
        assertThat(purchase.getCredits()).isEqualTo(10);
        assertThat(purchase.getAmount()).isEqualByComparingTo("140.00");
        assertThat(purchase.getPackSize()).isEqualTo(10);
        assertThat(purchase.getPaymentMethod()).isSameAs(card);
        assertThat(purchase.getChargeReference()).isEqualTo("ch_mock_1");
        assertThat(purchase.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 6, 8, 10, 15));

        assertThat(response).isEqualTo(new PurchaseResponse(15L, new CreditTransactionResponse(31L,
                CreditTransactionType.PURCHASE, 10, new BigDecimal("140.00"), 10, 7L, NOW)));
    }

    @Test
    void aDeclinedChargeAddsNoCreditsAndFails() {
        when(gateway.charge("tok_mock_7", new BigDecimal("140.00")))
                .thenReturn(new ChargeResult(ChargeStatus.DECLINED, "ch_mock_2"));

        assertThatThrownBy(() -> useCase.execute(CLIENT_EMAIL, REQUEST))
                .isInstanceOf(PaymentDeclinedException.class)
                .hasMessage("Payment declined: no credits were added");
        verify(transactions, never()).save(any(CreditTransaction.class));
    }

    @Test
    void aFreePackIsNotChargedAndStillAddsItsCredits() {
        when(packs.findById(1L)).thenReturn(Optional.of(pack(1L, 5, "0.00")));
        when(transactions.sumCreditsByUserId(42L)).thenReturn(5L);

        PurchaseResponse response = useCase.execute(CLIENT_EMAIL, new PurchaseCreditsRequest(1L, 7L));

        verifyNoInteractions(gateway);
        assertThat(response.balance()).isEqualTo(5L);
        assertThat(response.transaction().credits()).isEqualTo(5);
        assertThat(response.transaction().amount()).isEqualByComparingTo("0.00");
    }

    @Test
    void throwsNotFoundForAnUnknownPackWithoutCharging() {
        when(packs.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(CLIENT_EMAIL, new PurchaseCreditsRequest(99L, 7L)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Credit pack 99 not found");
        verifyNoInteractions(gateway);
        verify(transactions, never()).save(any(CreditTransaction.class));
    }

    @Test
    void throwsNotFoundForAPaymentMethodThatIsMissingRemovedOrSomeoneElsesWithoutCharging() {
        when(methods.findByIdAndUserIdAndActiveTrue(8L, 42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(CLIENT_EMAIL, new PurchaseCreditsRequest(2L, 8L)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Payment method 8 not found");
        verifyNoInteractions(gateway);
        verify(transactions, never()).save(any(CreditTransaction.class));
    }
}
