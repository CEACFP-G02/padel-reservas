package com.g02.padel.user;

import com.g02.padel.user.dto.ClientResponse;
import com.g02.padel.user.dto.UserResponse;

/** Entity -> DTO for users. Never exposes the password hash. */
public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getRole());
    }

    public static ClientResponse toClientResponse(User user) {
        return new ClientResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.isActive());
    }
}
