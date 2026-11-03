package com.g02.padel.auth.usecase;

import static com.g02.padel.auth.usecase.AuthFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.g02.padel.auth.dto.LoginRequest;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.security.JwtService;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.UserResponse;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class LoginUseCaseTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private LoginUseCase login;

    @Test
    void returnsAccessAndRefreshTokensWithTheUser() {
        var user = user(Role.OWNER, true);
        when(userRepository.findByEmail("ana@padel.test")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("s3cret-pass", "$2a$hash")).thenReturn(true);
        when(jwtService.generateAccessToken(user)).thenReturn("access");
        when(jwtService.generateRefreshToken(user)).thenReturn("refresh");

        var response = login.execute(new LoginRequest(" Ana@padel.test", "s3cret-pass"));

        assertThat(response.accessToken()).isEqualTo("access");
        assertThat(response.refreshToken()).isEqualTo("refresh");
        assertThat(response.user())
                .isEqualTo(new UserResponse(42L, "Ana López", "ana@padel.test", "600000000", Role.OWNER));
    }

    @Test
    void rejectsAWrongPassword() {
        when(userRepository.findByEmail("ana@padel.test")).thenReturn(Optional.of(user(Role.CLIENT, true)));
        when(passwordEncoder.matches("wrong", "$2a$hash")).thenReturn(false);

        assertThatThrownBy(() -> login.execute(new LoginRequest("ana@padel.test", "wrong")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void rejectsAnUnknownEmailWithTheSameMessage() {
        when(userRepository.findByEmail("nobody@padel.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> login.execute(new LoginRequest("nobody@padel.test", "s3cret-pass")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void rejectsAnInactiveUserWithTheSameMessage() {
        when(userRepository.findByEmail("ana@padel.test")).thenReturn(Optional.of(user(Role.CLIENT, false)));

        assertThatThrownBy(() -> login.execute(new LoginRequest("ana@padel.test", "s3cret-pass")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }
}
