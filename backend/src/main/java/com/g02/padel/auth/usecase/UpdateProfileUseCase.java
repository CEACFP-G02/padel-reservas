package com.g02.padel.auth.usecase;

import com.g02.padel.auth.dto.UpdateProfileRequest;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: the authenticated user edits their own profile (name, phone). */
@Service
public class UpdateProfileUseCase {

    private final UserRepository userRepository;

    public UpdateProfileUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserResponse execute(String email, UpdateProfileRequest request) {
        // TODO: findByEmail (NotFoundException), apply non-null fields, save, map
        //  — see docs/api.md#users--clients--apiv1users (self edits go through PATCH /auth/me)
        throw new UnsupportedOperationException("TODO: UpdateProfile — see docs/api.md#users--clients--apiv1users");
    }
}
