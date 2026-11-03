package com.g02.padel.auth.usecase;

import static com.g02.padel.auth.usecase.AuthFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.UserResponse;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GetCurrentUserUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GetCurrentUserUseCase getCurrentUser;

    @Test
    void returnsTheAuthenticatedUsersProfile() {
        when(userRepository.findByEmail("ana@padel.test")).thenReturn(Optional.of(user(Role.CLIENT, true)));

        assertThat(getCurrentUser.execute("ana@padel.test"))
                .isEqualTo(new UserResponse(42L, "Ana López", "ana@padel.test", "600000000", Role.CLIENT));
    }

    @Test
    void throwsNotFoundWhenTheUserIsGone() {
        when(userRepository.findByEmail("gone@padel.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> getCurrentUser.execute("gone@padel.test")).isInstanceOf(NotFoundException.class);
    }
}
