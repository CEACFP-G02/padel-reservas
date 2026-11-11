package com.g02.padel.user.usecase;

import static com.g02.padel.user.usecase.UserFixtures.client;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.ClientResponse;
import com.g02.padel.user.dto.UpdateClientRequest;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UpdateClientUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UpdateClientUseCase updateClient;

    @BeforeEach
    void setUp() {
        when(userRepository.findByIdAndRole(42L, Role.CLIENT))
                .thenReturn(Optional.of(client(42L, "Ana López", "ana@padel.test", "600000000", false)));
    }

    @Test
    void appliesOnlyTheFieldsPresentInTheRequest() {
        var response = updateClient.execute(42L, new UpdateClientRequest(null, null, "611111111", null));

        assertThat(response).isEqualTo(new ClientResponse(42L, "Ana López", "ana@padel.test", "611111111", false));
        verify(userRepository, never()).existsByEmailAndIdNot(any(), anyLong());
    }

    @Test
    void updatesEveryFieldTrimmingAndNormalizing() {
        when(userRepository.existsByEmailAndIdNot("ana.lopez@padel.test", 42L)).thenReturn(false);

        var response = updateClient.execute(42L,
                new UpdateClientRequest(" Ana López Ruiz ", " Ana.Lopez@Padel.test ", " 622 ", true));

        assertThat(response)
                .isEqualTo(new ClientResponse(42L, "Ana López Ruiz", "ana.lopez@padel.test", "622", true));
    }

    @Test
    void anEmptyPhoneClearsIt() {
        var response = updateClient.execute(42L, new UpdateClientRequest(null, null, "", null));

        assertThat(response.phone()).isNull();
    }

    @Test
    void keepingTheOwnEmailIsFine() {
        when(userRepository.existsByEmailAndIdNot("ana@padel.test", 42L)).thenReturn(false);

        assertThat(updateClient.execute(42L, new UpdateClientRequest(null, "ANA@padel.test", null, null)).email())
                .isEqualTo("ana@padel.test");
    }

    @Test
    void rejectsAnEmailAnotherUserHas() {
        when(userRepository.existsByEmailAndIdNot("bruno@padel.test", 42L)).thenReturn(true);

        assertThatThrownBy(() -> updateClient.execute(42L, new UpdateClientRequest(null, "bruno@padel.test", null, null)))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Email bruno@padel.test is already registered");
    }

    @Test
    void throwsNotFoundForAMissingIdOrAnOwner() {
        when(userRepository.findByIdAndRole(1L, Role.CLIENT)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> updateClient.execute(1L, new UpdateClientRequest("X", null, null, null)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Client 1 not found");
    }
}
