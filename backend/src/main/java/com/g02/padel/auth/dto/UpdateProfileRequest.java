package com.g02.padel.auth.dto;

import jakarta.validation.constraints.Size;

/** Partial self-profile update (PATCH /auth/me): null fields are left unchanged. */
public record UpdateProfileRequest(
        @Size(min = 1, max = 200) String name,
        @Size(max = 30) String phone
) {
}
