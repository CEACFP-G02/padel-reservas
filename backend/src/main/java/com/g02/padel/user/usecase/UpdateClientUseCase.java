package com.g02.padel.user.usecase;

import com.g02.padel.auth.usecase.Emails;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.user.UserMapper;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.ClientResponse;
import com.g02.padel.user.dto.UpdateClientRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): update a client (PATCH: only the fields present change). */
@Service
public class UpdateClientUseCase {

    private final UserRepository userRepository;

    public UpdateClientUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public ClientResponse execute(Long id, UpdateClientRequest request) {
        var client = ClientLookup.clientOrThrow(userRepository, id);
        if (request.name() != null) {
            client.setName(request.name().trim());
        }
        if (request.email() != null) {
            String email = Emails.normalize(request.email());
            if (userRepository.existsByEmailAndIdNot(email, id)) {
                throw new ConflictException("Email " + email + " is already registered");
            }
            client.setEmail(email);
        }
        if (request.phone() != null) {
            client.setPhone(ClientLookup.phoneOrNull(request.phone()));
        }
        if (request.active() != null) {
            client.setActive(request.active());
        }
        return UserMapper.toClientResponse(client);
    }
}
