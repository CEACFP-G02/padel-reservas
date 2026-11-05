package com.g02.padel.auth.usecase;

import com.g02.padel.auth.dto.RegisterRequest;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserMapper;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: a visitor registers as a CLIENT (then logs in to get tokens). OWNER accounts are never self-registered. */
@Service
public class RegisterClientUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public RegisterClientUseCase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse execute(RegisterRequest request) {
        String email = Emails.normalize(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email " + email + " is already registered");
        }
        var user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhone(request.phone());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.CLIENT);
        user.setActive(true);
        return UserMapper.toResponse(userRepository.save(user));
    }
}
