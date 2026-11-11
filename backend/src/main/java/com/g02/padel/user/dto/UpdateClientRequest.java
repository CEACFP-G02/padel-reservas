package com.g02.padel.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Partial update (PATCH): null fields are left unchanged; an empty {@code phone} clears it. */
public record UpdateClientRequest(
        @Size(max = 200) @Pattern(regexp = ".*\\S.*", message = "must not be blank") String name,
        @Email @Pattern(regexp = ".*\\S.*", message = "must not be blank") String email,
        @Size(max = 30) String phone,
        Boolean active
) {
}
