package com.g02.padel.user.usecase;

import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.UpdateClientRequest;
import com.g02.padel.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (admin): update a client profile. */
@Service
public class UpdateClientUseCase {

    private final UserRepository userRepository;

    public UpdateClientUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserResponse execute(Long id, UpdateClientRequest request) {
        // TODO: load client (NotFoundException), apply fields, save — see docs/api.md#put-apiv1usersid
        throw new UnsupportedOperationException("TODO: UpdateClient — see docs/api.md#put-apiv1usersid");
    }
}
