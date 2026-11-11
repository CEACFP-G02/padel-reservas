package com.g02.padel.user.usecase;

import com.g02.padel.user.UserMapper;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.ClientResponse;
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
    public ClientResponse execute(Long id) {
        return UserMapper.toClientResponse(ClientLookup.clientOrThrow(userRepository, id));
    }
}
