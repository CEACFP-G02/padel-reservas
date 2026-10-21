package com.g02.padel.auth.usecase;

import com.g02.padel.auth.dto.LoginRequest;
import com.g02.padel.auth.dto.LoginResponse;
import com.g02.padel.shared.security.JwtService;
import com.g02.padel.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: a registered user (CLIENT or OWNER) logs in with email + password. */
@Service
public class LoginUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginUseCase(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse execute(LoginRequest request) {
        // TODO: findByEmail, check active + passwordEncoder.matches, issue access + refresh tokens and return
        //  them with the user; respond 401 with a generic message on any failure — see docs/api.md#auth--apiv1auth
        throw new UnsupportedOperationException("TODO: Login — see docs/api.md#auth--apiv1auth");
    }
}
