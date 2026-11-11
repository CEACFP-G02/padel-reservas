package com.g02.padel.credit.usecase;

import static com.g02.padel.credit.usecase.CreditPackFixtures.pack;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.credit.CreditPack;
import com.g02.padel.credit.CreditPackRepository;
import com.g02.padel.credit.dto.CreditPackResponse;
import com.g02.padel.credit.dto.UpdateCreditPackPriceRequest;
import com.g02.padel.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class UpdateCreditPackPriceUseCaseTest {

    private final CreditPackRepository packs = mock(CreditPackRepository.class);
    private final UpdateCreditPackPriceUseCase useCase = new UpdateCreditPackPriceUseCase(packs);

    @Test
    void updatesOnlyThePrice() {
        CreditPack pack = pack(2L, 10, "140.00");
        when(packs.findById(2L)).thenReturn(Optional.of(pack));

        CreditPackResponse updated = useCase.execute(2L, new UpdateCreditPackPriceRequest(new BigDecimal("130.50")));

        assertThat(updated).isEqualTo(new CreditPackResponse(2L, 10, new BigDecimal("130.50")));
        assertThat(pack.getSize()).isEqualTo(10);
        assertThat(pack.getPrice()).isEqualByComparingTo("130.50");
    }

    @Test
    void acceptsAFreePack() {
        when(packs.findById(1L)).thenReturn(Optional.of(pack(1L, 5, "75.00")));

        assertThat(useCase.execute(1L, new UpdateCreditPackPriceRequest(BigDecimal.ZERO)).price())
                .isEqualByComparingTo("0");
    }

    @Test
    void storesThePriceWithTwoDecimals() {
        when(packs.findById(1L)).thenReturn(Optional.of(pack(1L, 5, "75.00")));

        assertThat(useCase.execute(1L, new UpdateCreditPackPriceRequest(new BigDecimal("70"))).price())
                .isEqualTo(new BigDecimal("70.00"));
    }

    @Test
    void throwsNotFoundForAMissingPack() {
        when(packs.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(99L, new UpdateCreditPackPriceRequest(BigDecimal.TEN)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Credit pack 99 not found");
        verify(packs, never()).save(any(CreditPack.class));
    }
}
