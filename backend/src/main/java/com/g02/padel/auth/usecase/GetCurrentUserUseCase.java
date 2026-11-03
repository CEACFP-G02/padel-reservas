package com.g02.padel.auth.usecase;

import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: return the profile of the authenticated user. */
@Service
public class GetCurrentUserUseCase {

    private final UserRepository userRepository;

    public GetCurrentUserUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse execute(String email) {
        // TODO: findByEmail -> map to UserResponse (NotFoundException if missing) — see docs/api.md#auth--apiv1auth
        throw new UnsupportedOperationException("TODO: GetCurrentUser — see docs/api.md#auth--apiv1auth");
    }
}
