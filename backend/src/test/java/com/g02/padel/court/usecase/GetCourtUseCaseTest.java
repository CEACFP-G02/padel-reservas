package com.g02.padel.court.usecase;

import static com.g02.padel.court.usecase.CourtFixtures.court;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.exception.NotFoundException;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GetCourtUseCaseTest {

    @Mock
    private CourtRepository courtRepository;

    @InjectMocks
    private GetCourtUseCase getCourt;

    @Test
    void returnsTheCourt() {
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court(3L, "Court 3", CourtType.GLASS, true, true)));

        assertThat(getCourt.execute(3L)).isEqualTo(new CourtResponse(3L, "Court 3", CourtType.GLASS, true, true));
    }

    @Test
    void throwsNotFoundForAMissingCourt() {
        when(courtRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> getCourt.execute(99L))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Court 99 not found");
    }
}
