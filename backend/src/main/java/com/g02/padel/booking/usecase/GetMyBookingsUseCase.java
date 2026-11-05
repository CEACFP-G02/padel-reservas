package com.g02.padel.booking.usecase;

import com.g02.padel.booking.BookingMapper;
import com.g02.padel.booking.BookingSpecifications;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.user.UserRepository;
import com.g02.padel.shared.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/** UC (client): list the authenticated user's own bookings. */
@Service
public class GetMyBookingsUseCase {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public GetMyBookingsUseCase(BookingRepository bookingRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> execute(String requesterEmail, BookingStatus status, LocalDate from, LocalDate to,
                                         Pageable pageable) {
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> NotFoundException.of("User", requesterEmail));
        return bookingRepository
                .findAll(BookingSpecifications.filter(user.getId(), null, status, from, to),
                        BookingSpecifications.withDefaultSort(pageable))
                .map(BookingMapper::toResponse);
    }
}
