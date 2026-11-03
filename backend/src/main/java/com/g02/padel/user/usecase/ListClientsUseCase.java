package com.g02.padel.user.usecase;

import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): list clients, optionally matching {@code search}. */
@Service
public class ListClientsUseCase {

    private final UserRepository userRepository;

    public ListClientsUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> execute(String search, Pageable pageable) {
        // TODO: paged CLIENT users, filtered by name/email/phone containing `search` when present -> map
        //  — see docs/api.md#users--clients--apiv1users
        throw new UnsupportedOperationException("TODO: ListClients — see docs/api.md#get-apiv1users");
    }
}
