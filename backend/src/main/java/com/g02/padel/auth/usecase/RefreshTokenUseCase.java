package com.g02.padel.auth.usecase;

import com.g02.padel.auth.dto.AuthResponse;
import com.g02.padel.auth.dto.RefreshTokenRequest;
import com.g02.padel.shared.security.JwtService;
import com.g02.padel.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: exchange a valid refresh token for a new token pair. */
@Service
public class RefreshTokenUseCase {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public RefreshTokenUseCase(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public AuthResponse execute(RefreshTokenRequest request) {
        // TODO: validate refresh token (typ=refresh), load still-active user by subject, issue new pair
        //  — see docs/api.md#post-apiv1authrefresh
        throw new UnsupportedOperationException("TODO: RefreshToken — see docs/api.md#post-apiv1authrefresh");
    }
}
