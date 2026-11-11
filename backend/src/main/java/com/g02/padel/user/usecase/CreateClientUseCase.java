package com.g02.padel.user.usecase;

import com.g02.padel.auth.usecase.Emails;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserMapper;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.ClientResponse;
import com.g02.padel.user.dto.CreateClientRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): create a client account on their behalf. Always a CLIENT, active. */
@Service
public class CreateClientUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public CreateClientUseCase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public ClientResponse execute(CreateClientRequest request) {
        String email = Emails.normalize(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email " + email + " is already registered");
        }
        var user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhone(ClientLookup.phoneOrNull(request.phone()));
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.CLIENT);
        user.setActive(true);
        return UserMapper.toClientResponse(userRepository.save(user));
    }
}
