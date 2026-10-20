package com.g02.padel.auth.dto;

import com.g02.padel.shared.enums.Role;

public record CurrentUserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phone,
        Role role
) {
}
