package com.g02.padel.user.usecase;

import static com.g02.padel.user.usecase.UserFixtures.client;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.ClientResponse;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GetClientUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GetClientUseCase getClient;

    @Test
    void returnsTheClient() {
        when(userRepository.findByIdAndRole(42L, Role.CLIENT))
                .thenReturn(Optional.of(client(42L, "Ana López", "ana@padel.test", "600000000", true)));

        assertThat(getClient.execute(42L))
                .isEqualTo(new ClientResponse(42L, "Ana López", "ana@padel.test", "600000000", true));
    }

    @Test
    void throwsNotFoundForAMissingIdOrAnOwner() {
        when(userRepository.findByIdAndRole(1L, Role.CLIENT)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> getClient.execute(1L))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Client 1 not found");
    }
}
