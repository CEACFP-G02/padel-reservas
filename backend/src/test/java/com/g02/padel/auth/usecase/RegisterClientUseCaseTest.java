package com.g02.padel.auth.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.auth.dto.RegisterRequest;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class RegisterClientUseCaseTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private RegisterClientUseCase registerClient;

    @Test
    void registersAnActiveClientWithAHashedPassword() {
        when(userRepository.existsByEmail("ana@padel.test")).thenReturn(false);
        when(passwordEncoder.encode("s3cret-pass")).thenReturn("$2a$hash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(42L);
            return u;
        });

        UserResponse response = registerClient.execute(
                new RegisterRequest("Ana López", "ana@padel.test", "s3cret-pass", "600000000"));

        var saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getRole()).isEqualTo(Role.CLIENT);
        assertThat(saved.getValue().getPasswordHash()).isEqualTo("$2a$hash");
        assertThat(saved.getValue().isActive()).isTrue();
        assertThat(response).isEqualTo(new UserResponse(42L, "Ana López", "ana@padel.test", "600000000", Role.CLIENT));
    }

    @Test
    void normalizesTheEmailToTrimmedLowerCase() {
        when(userRepository.existsByEmail("ana@padel.test")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = registerClient.execute(new RegisterRequest("Ana", "  Ana@Padel.TEST ", "s3cret-pass", null));

        assertThat(response.email()).isEqualTo("ana@padel.test");
    }

    @Test
    void rejectsADuplicateEmailWithConflict() {
        when(userRepository.existsByEmail("ana@padel.test")).thenReturn(true);

        assertThatThrownBy(() -> registerClient.execute(
                new RegisterRequest("Ana", "ana@padel.test", "s3cret-pass", null)))
                .isInstanceOf(ConflictException.class);
        verify(userRepository, never()).save(any());
    }
}
