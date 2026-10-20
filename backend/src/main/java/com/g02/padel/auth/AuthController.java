package com.g02.padel.auth;

import com.g02.padel.auth.dto.AuthResponse;
import com.g02.padel.auth.dto.CurrentUserResponse;
import com.g02.padel.auth.dto.LoginRequest;
import com.g02.padel.auth.dto.RefreshTokenRequest;
import com.g02.padel.auth.dto.RegisterRequest;
import com.g02.padel.auth.usecase.GetCurrentUserUseCase;
import com.g02.padel.auth.usecase.LoginUseCase;
import com.g02.padel.auth.usecase.RefreshTokenUseCase;
import com.g02.padel.auth.usecase.RegisterClientUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final RegisterClientUseCase registerClient;
    private final LoginUseCase login;
    private final RefreshTokenUseCase refreshToken;
    private final GetCurrentUserUseCase getCurrentUser;

    public AuthController(RegisterClientUseCase registerClient, LoginUseCase login,
                          RefreshTokenUseCase refreshToken, GetCurrentUserUseCase getCurrentUser) {
        this.registerClient = registerClient;
        this.login = login;
        this.refreshToken = refreshToken;
        this.getCurrentUser = getCurrentUser;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return registerClient.execute(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return login.execute(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return refreshToken.execute(request);
    }

    @GetMapping("/me")
    public CurrentUserResponse me(Authentication authentication) {
        return getCurrentUser.execute(authentication.getName());
    }
}
