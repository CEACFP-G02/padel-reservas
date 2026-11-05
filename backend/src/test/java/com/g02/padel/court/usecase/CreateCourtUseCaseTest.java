package com.g02.padel.court.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtRequest;
import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.exception.ConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CreateCourtUseCaseTest {

    @Mock
    private CourtRepository courtRepository;

    @InjectMocks
    private CreateCourtUseCase createCourt;

    @BeforeEach
    void setUp() {
        when(courtRepository.save(any(Court.class))).thenAnswer(inv -> {
            Court c = inv.getArgument(0);
            c.setId(7L);
            return c;
        });
    }

    @Test
    void createsTheCourtAndReturnsIt() {
        var response = createCourt.execute(new CourtRequest("Court 7", CourtType.WALL, true, false));

        assertThat(response).isEqualTo(new CourtResponse(7L, "Court 7", CourtType.WALL, true, false));
    }

    @Test
    void activeDefaultsToTrueWhenOmitted() {
        createCourt.execute(new CourtRequest("Court 7", CourtType.GLASS, false, null));

        var saved = ArgumentCaptor.forClass(Court.class);
        verify(courtRepository).save(saved.capture());
        assertThat(saved.getValue().isActive()).isTrue();
    }

    @Test
    void trimsTheName() {
        var response = createCourt.execute(new CourtRequest("  Court 7 ", CourtType.GLASS, false, null));

        assertThat(response.name()).isEqualTo("Court 7");
    }

    @Test
    void rejectsADuplicateNameIgnoringCase() {
        when(courtRepository.existsByNameIgnoreCase("court 7")).thenReturn(true);

        assertThatThrownBy(() -> createCourt.execute(new CourtRequest("court 7", CourtType.GLASS, false, null)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("court 7");
        verify(courtRepository, never()).save(any());
    }
}
