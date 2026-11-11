package com.g02.padel.courtblock.usecase;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.block;
import static com.g02.padel.availability.AvailabilityFixtures.court;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.courtblock.CourtBlock;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.shared.exception.NotFoundException;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class RemoveBlockUseCaseTest {

    private final CourtBlockRepository blocks = mock(CourtBlockRepository.class);
    private final RemoveBlockUseCase useCase = new RemoveBlockUseCase(blocks);

    @Test
    void deletesTheBlock() {
        CourtBlock block = block(court(3L, true), MONDAY, "07:00", "09:00");
        when(blocks.findById(9L)).thenReturn(Optional.of(block));

        useCase.execute(9L);

        verify(blocks).delete(block);
    }

    @Test
    void throwsNotFoundForAMissingBlock() {
        when(blocks.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(99L))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Court block 99 not found");
        verify(blocks, never()).delete(any(CourtBlock.class));
    }
}
