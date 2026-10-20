package com.g02.padel.user.usecase;

import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** UC (owner): list all clients. */
@Service
public class ListClientsUseCase {

    private final UserRepository userRepository;

    public ListClientsUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> execute() {
        // TODO: findByRole(Role.CLIENT) -> map to UserResponse — see docs/api.md#get-apiv1users
        throw new UnsupportedOperationException("TODO: ListClients — see docs/api.md#get-apiv1users");
    }
}
