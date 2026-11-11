package com.g02.padel.user.usecase;

import com.g02.padel.booking.BookingMapper;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.BookingSpecifications;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC (owner): a client's bookings (any status), paged, most recent first unless sorted otherwise. */
@Service
public class ListClientBookingsUseCase {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public ListClientBookingsUseCase(UserRepository userRepository, BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> execute(Long clientId, Pageable pageable) {
        ClientLookup.clientOrThrow(userRepository, clientId);
        return bookingRepository
                .findAll(BookingSpecifications.filter(clientId, null, null, null, null),
                        BookingSpecifications.withDefaultSort(pageable))
                .map(BookingMapper::toResponse);
    }
}
