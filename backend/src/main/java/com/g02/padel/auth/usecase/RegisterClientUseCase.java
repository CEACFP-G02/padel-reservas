package com.g02.padel.auth.usecase;

import com.g02.padel.auth.dto.RegisterRequest;
import com.g02.padel.shared.security.JwtService;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: a visitor registers as a CLIENT (then logs in to get tokens). */
@Service
public class RegisterClientUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public RegisterClientUseCase(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public UserResponse execute(RegisterRequest request) {
        // TODO: reject duplicate email (existsByEmail -> 409), hash password, save User with Role.CLIENT,
        //  return the created user (201) — see docs/api.md#auth--apiv1auth
        throw new UnsupportedOperationException("TODO: RegisterClient — see docs/api.md#auth--apiv1auth");
    }
}
