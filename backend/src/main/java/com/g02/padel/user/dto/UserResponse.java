package com.g02.padel.user.dto;

import com.g02.padel.shared.enums.Role;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phone,
        Role role,
        boolean active,
        LocalDateTime createdAt
) {
}
