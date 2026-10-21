package com.g02.padel.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/** Partial update (PATCH): null fields are left unchanged. */
public record UpdateClientRequest(
        @Size(min = 1, max = 200) String name,
        @Email String email,
        @Size(max = 30) String phone
) {
}
