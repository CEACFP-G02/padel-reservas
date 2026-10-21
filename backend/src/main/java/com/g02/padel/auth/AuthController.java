package com.g02.padel.auth;

import com.g02.padel.auth.dto.LoginRequest;
import com.g02.padel.auth.dto.LoginResponse;
import com.g02.padel.auth.dto.RefreshTokenRequest;
import com.g02.padel.auth.dto.RefreshTokenResponse;
import com.g02.padel.auth.dto.RegisterRequest;
import com.g02.padel.auth.dto.UpdateProfileRequest;
import com.g02.padel.auth.usecase.GetCurrentUserUseCase;
import com.g02.padel.auth.usecase.LoginUseCase;
import com.g02.padel.auth.usecase.RefreshTokenUseCase;
import com.g02.padel.auth.usecase.RegisterClientUseCase;
import com.g02.padel.auth.usecase.UpdateProfileUseCase;
import com.g02.padel.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
    private final UpdateProfileUseCase updateProfile;

    public AuthController(RegisterClientUseCase registerClient, LoginUseCase login, RefreshTokenUseCase refreshToken,
                          GetCurrentUserUseCase getCurrentUser, UpdateProfileUseCase updateProfile) {
        this.registerClient = registerClient;
        this.login = login;
        this.refreshToken = refreshToken;
        this.getCurrentUser = getCurrentUser;
        this.updateProfile = updateProfile;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return registerClient.execute(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return login.execute(request);
    }

    @PostMapping("/refresh")
    public RefreshTokenResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return refreshToken.execute(request);
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return getCurrentUser.execute(authentication.getName());
    }

    @PatchMapping("/me")
    public UserResponse updateMe(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        return updateProfile.execute(authentication.getName(), request);
    }
}
