package com.g02.padel.user.usecase;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;

/** The owner only manages clients: an owner id is reported like an unknown one. */
final class ClientLookup {

    private ClientLookup() {
    }

    static User clientOrThrow(UserRepository userRepository, Long id) {
        return userRepository.findByIdAndRole(id, Role.CLIENT).orElseThrow(() -> NotFoundException.of("Client", id));
    }

    /** Trimmed; blank means no phone. */
    static String phoneOrNull(String phone) {
        return phone == null || phone.isBlank() ? null : phone.trim();
    }
}
