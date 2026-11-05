package com.g02.padel.booking.usecase;

import com.g02.padel.booking.BookableSlots;
import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingMapper;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.booking.dto.CreateBookingRequest;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC: book one or more consecutive slots of a court. A CLIENT books for themselves; the OWNER books for
 * {@code clientId}. Each slot keeps the schedule price of this moment.
 */
@Service
public class CreateBookingUseCase {

    private final BookingRepository bookingRepository;
    private final CourtRepository courtRepository;
    private final UserRepository userRepository;
    private final BookableSlots bookableSlots;

    public CreateBookingUseCase(BookingRepository bookingRepository, CourtRepository courtRepository,
                                UserRepository userRepository, BookableSlots bookableSlots) {
        this.bookingRepository = bookingRepository;
        this.courtRepository = courtRepository;
        this.userRepository = userRepository;
        this.bookableSlots = bookableSlots;
    }

    @Transactional
    public BookingResponse execute(String requesterEmail, CreateBookingRequest request) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> NotFoundException.of("User", requesterEmail));
        boolean owner = requester.getRole() == Role.OWNER;
        User client = owner ? clientFor(request.clientId()) : requester;

        // Locked until commit: a concurrent booking of the same court waits and then sees this one.
        Court court = courtRepository.findByIdForUpdate(request.courtId())
                .filter(c -> c.isActive() || owner)
                .orElseThrow(() -> NotFoundException.of("Court", request.courtId()));
        if (!court.isActive()) {
            throw new IllegalArgumentException("Court " + court.getId() + " is inactive");
        }

        var booking = new Booking();
        booking.setCourt(court);
        booking.setUser(client);
        booking.setDate(request.date());
        bookableSlots.priced(court, request.date(), request.slots()).forEach(booking::addSlot);
        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    private User clientFor(Long clientId) {
        if (clientId == null) {
            throw new IllegalArgumentException("clientId is required when the owner books");
        }
        return userRepository.findById(clientId)
                .filter(u -> u.getRole() == Role.CLIENT)
                .orElseThrow(() -> NotFoundException.of("Client", clientId));
    }
}
