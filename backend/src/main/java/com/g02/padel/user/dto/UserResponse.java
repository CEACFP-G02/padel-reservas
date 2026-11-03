package com.g02.padel.user.dto;

import com.g02.padel.shared.enums.Role;

/** User as returned by auth ({@code user} in login, {@code /auth/me}) and the owner's client endpoints. */
public record UserResponse(
        Long id,
        String name,
        String email,
        String phone,
        Role role
) {
}
