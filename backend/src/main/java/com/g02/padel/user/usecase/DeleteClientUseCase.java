package com.g02.padel.user.usecase;

import com.g02.padel.booking.BookingRepository;
import com.g02.padel.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): remove a client. Soft delete (inactive) if it has bookings, so they are kept; otherwise for good. */
@Service
public class DeleteClientUseCase {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public DeleteClientUseCase(UserRepository userRepository, BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional
    public void execute(Long id) {
        var client = ClientLookup.clientOrThrow(userRepository, id);
        if (bookingRepository.existsByUserId(id)) {
            client.setActive(false);
        } else {
            userRepository.delete(client);
        }
    }
}
