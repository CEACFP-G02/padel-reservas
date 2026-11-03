package com.g02.padel.auth.dto;

import com.g02.padel.user.dto.UserResponse;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) {
}
