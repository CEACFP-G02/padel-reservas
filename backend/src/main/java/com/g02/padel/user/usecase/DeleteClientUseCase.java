package com.g02.padel.user.usecase;

import com.g02.padel.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (admin): delete a client. */
@Service
public class DeleteClientUseCase {

    private final UserRepository userRepository;

    public DeleteClientUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void execute(Long id) {
        // TODO: load client (NotFoundException); soft-delete (active=false) if it has bookings, else delete — see docs/api.md#delete-apiv1usersid
        throw new UnsupportedOperationException("TODO: DeleteClient — see docs/api.md#delete-apiv1usersid");
    }
}
