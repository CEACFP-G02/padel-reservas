package com.g02.padel.user.usecase;

import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): get one client by id. */
@Service
public class GetClientUseCase {

    private final UserRepository userRepository;

    public GetClientUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse execute(Long id) {
        // TODO: findById, must be a CLIENT, else NotFoundException — see docs/api.md#get-apiv1usersid
        throw new UnsupportedOperationException("TODO: GetClient — see docs/api.md#get-apiv1usersid");
    }
}
