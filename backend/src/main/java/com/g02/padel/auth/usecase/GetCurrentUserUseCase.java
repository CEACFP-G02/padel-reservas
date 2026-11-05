package com.g02.padel.auth.usecase;

import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.UserMapper;
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
        return userRepository.findByEmail(email)
                .map(UserMapper::toResponse)
                .orElseThrow(() -> NotFoundException.of("User", email));
    }
}
