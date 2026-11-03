package com.g02.padel.auth.usecase;

import static com.g02.padel.auth.usecase.AuthFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.g02.padel.auth.dto.RefreshTokenRequest;
import com.g02.padel.auth.dto.RefreshTokenResponse;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.security.JwtService;
import com.g02.padel.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;

@ExtendWith(MockitoExtension.class)
class RefreshTokenUseCaseTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private RefreshTokenUseCase refreshToken;

    @Test
    void issuesANewAccessTokenForAValidRefreshToken() {
        var user = user(Role.CLIENT, true);
        when(jwtService.validateRefreshToken("refresh")).thenReturn(Optional.of("ana@padel.test"));
        when(userRepository.findByEmail("ana@padel.test")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(user)).thenReturn("new-access");

        assertThat(refreshToken.execute(new RefreshTokenRequest("refresh")))
                .isEqualTo(new RefreshTokenResponse("new-access"));
    }

    @Test
    void rejectsAnInvalidOrExpiredRefreshToken() {
        when(jwtService.validateRefreshToken("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshToken.execute(new RefreshTokenRequest("bad")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void rejectsTheTokenOfADeletedUser() {
        when(jwtService.validateRefreshToken("refresh")).thenReturn(Optional.of("ana@padel.test"));
        when(userRepository.findByEmail("ana@padel.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshToken.execute(new RefreshTokenRequest("refresh")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void rejectsTheTokenOfADeactivatedUser() {
        when(jwtService.validateRefreshToken("refresh")).thenReturn(Optional.of("ana@padel.test"));
        when(userRepository.findByEmail("ana@padel.test")).thenReturn(Optional.of(user(Role.CLIENT, false)));

        assertThatThrownBy(() -> refreshToken.execute(new RefreshTokenRequest("refresh")))
                .isInstanceOf(BadCredentialsException.class);
    }
}
