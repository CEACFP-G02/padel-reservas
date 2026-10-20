package com.g02.padel.auth.usecase;

import com.g02.padel.auth.dto.CurrentUserResponse;
import com.g02.padel.user.UserRepository;
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
    public CurrentUserResponse execute(String email) {
        // TODO: findByEmail -> map to CurrentUserResponse (NotFoundException if missing)
        //  — see docs/api.md#get-apiv1authme
        throw new UnsupportedOperationException("TODO: GetCurrentUser — see docs/api.md#get-apiv1authme");
    }
}
