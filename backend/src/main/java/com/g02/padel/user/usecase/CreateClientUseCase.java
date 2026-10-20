package com.g02.padel.user.usecase;

import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.CreateClientRequest;
import com.g02.padel.user.dto.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): create a client account on their behalf. */
@Service
public class CreateClientUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public CreateClientUseCase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse execute(CreateClientRequest request) {
        // TODO: reject duplicate email, hash password, save with Role.CLIENT — see docs/api.md#post-apiv1users
        throw new UnsupportedOperationException("TODO: CreateClient — see docs/api.md#post-apiv1users");
    }
}
