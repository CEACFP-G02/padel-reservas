package com.g02.padel.auth.usecase;

import com.g02.padel.auth.dto.LoginRequest;
import com.g02.padel.auth.dto.LoginResponse;
import com.g02.padel.shared.security.JwtService;
import com.g02.padel.user.UserMapper;
import com.g02.padel.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: a registered user (CLIENT or OWNER) logs in with email + password. */
@Service
public class LoginUseCase {

    /** Same message for every failure, so the response does not reveal which emails exist. */
    static final String INVALID_CREDENTIALS = "Invalid email or password";

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
        var user = userRepository.findByEmail(Emails.normalize(request.email()))
                .filter(u -> u.isActive() && passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException(INVALID_CREDENTIALS));
        return new LoginResponse(
                jwtService.generateAccessToken(user),
                jwtService.generateRefreshToken(user),
                UserMapper.toResponse(user));
    }
}
