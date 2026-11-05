package com.g02.padel.court.usecase;

import static com.g02.padel.court.usecase.CourtFixtures.court;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.exception.NotFoundException;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DeactivateCourtUseCaseTest {

    @Mock
    private CourtRepository courtRepository;

    @InjectMocks
    private DeactivateCourtUseCase deactivateCourt;

    @Test
    void softDeletesByDeactivatingTheCourt() {
        var court = court(3L, "Court 3", CourtType.GLASS, false, true);
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court));

        deactivateCourt.execute(3L);

        assertThat(court.isActive()).isFalse();
        verify(courtRepository, never()).delete(any(Court.class));
        verify(courtRepository, never()).deleteById(any(Long.class));
    }

    @Test
    void isIdempotentForAnAlreadyInactiveCourt() {
        var court = court(3L, "Court 3", CourtType.GLASS, false, false);
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court));

        deactivateCourt.execute(3L);

        assertThat(court.isActive()).isFalse();
    }

    @Test
    void throwsNotFoundForAMissingCourt() {
        when(courtRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deactivateCourt.execute(99L)).isInstanceOf(NotFoundException.class);
    }
}
