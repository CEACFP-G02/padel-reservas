package com.g02.padel.court.usecase;

import static com.g02.padel.court.usecase.CourtFixtures.court;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.court.dto.UpdateCourtRequest;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.shared.exception.NotFoundException;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UpdateCourtUseCaseTest {

    @Mock
    private CourtRepository courtRepository;

    @InjectMocks
    private UpdateCourtUseCase updateCourt;

    @Test
    void appliesOnlyTheFieldsPresentInTheRequest() {
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court(3L, "Court 3", CourtType.GLASS, false, true)));

        var response = updateCourt.execute(3L, new UpdateCourtRequest(null, null, true, null));

        assertThat(response).isEqualTo(new CourtResponse(3L, "Court 3", CourtType.GLASS, true, true));
    }

    @Test
    void updatesEveryField() {
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court(3L, "Court 3", CourtType.GLASS, false, true)));
        when(courtRepository.existsByNameIgnoreCaseAndIdNot("Center court", 3L)).thenReturn(false);

        var response = updateCourt.execute(3L, new UpdateCourtRequest(" Center court ", CourtType.WALL, true, false));

        assertThat(response).isEqualTo(new CourtResponse(3L, "Center court", CourtType.WALL, true, false));
    }

    @Test
    void rejectsANameAlreadyUsedByAnotherCourt() {
        when(courtRepository.findById(3L)).thenReturn(Optional.of(court(3L, "Court 3", CourtType.GLASS, false, true)));
        when(courtRepository.existsByNameIgnoreCaseAndIdNot("Court 1", 3L)).thenReturn(true);

        assertThatThrownBy(() -> updateCourt.execute(3L, new UpdateCourtRequest("Court 1", null, null, null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void throwsNotFoundForAMissingCourt() {
        when(courtRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> updateCourt.execute(99L, new UpdateCourtRequest(null, null, true, null)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Court 99 not found");
    }
}
