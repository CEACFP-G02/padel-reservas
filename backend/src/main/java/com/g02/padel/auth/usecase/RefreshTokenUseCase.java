package com.g02.padel.auth.usecase;

import com.g02.padel.auth.dto.RefreshTokenRequest;
import com.g02.padel.auth.dto.RefreshTokenResponse;
import com.g02.padel.shared.security.JwtService;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: exchange a valid refresh token of a still-active user for a new access token. */
@Service
public class RefreshTokenUseCase {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public RefreshTokenUseCase(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public RefreshTokenResponse execute(RefreshTokenRequest request) {
        var user = jwtService.validateRefreshToken(request.refreshToken())
                .flatMap(userRepository::findByEmail)
                .filter(User::isActive)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token"));
        return new RefreshTokenResponse(jwtService.generateAccessToken(user));
    }
}
