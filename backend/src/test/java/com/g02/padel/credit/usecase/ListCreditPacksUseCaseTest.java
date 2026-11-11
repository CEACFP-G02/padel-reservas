package com.g02.padel.credit.usecase;

import static com.g02.padel.credit.usecase.CreditPackFixtures.pack;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.g02.padel.credit.CreditPackRepository;
import com.g02.padel.credit.dto.CreditPackResponse;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class ListCreditPacksUseCaseTest {

    private final CreditPackRepository packs = mock(CreditPackRepository.class);
    private final ListCreditPacksUseCase useCase = new ListCreditPacksUseCase(packs);

    @Test
    void listsThePacksBySize() {
        when(packs.findAllByOrderBySizeAsc()).thenReturn(List.of(
                pack(1L, 5, "75.00"), pack(2L, 10, "140.00"), pack(3L, 15, "195.00"), pack(4L, 20, "240.00")));

        assertThat(useCase.execute()).containsExactly(
                new CreditPackResponse(1L, 5, new BigDecimal("75.00")),
                new CreditPackResponse(2L, 10, new BigDecimal("140.00")),
                new CreditPackResponse(3L, 15, new BigDecimal("195.00")),
                new CreditPackResponse(4L, 20, new BigDecimal("240.00")));
    }
}
