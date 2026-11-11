package com.g02.padel.booking.usecase;

import com.g02.padel.booking.BookableSlots;
import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingCheckout;
import com.g02.padel.booking.BookingMapper;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.BookingSlot;
import com.g02.padel.booking.dto.BookingCreatedResponse;
import com.g02.padel.booking.dto.BookingPaymentResponse;
import com.g02.padel.booking.dto.CreateBookingRequest;
import com.g02.padel.court.Court;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC: book one or more consecutive slots of a court. A CLIENT books for themselves and pays credit first, then
 * money ({@link BookingCheckout}); the OWNER books for {@code clientId}, who must be an active client, with no
 * payment. Each slot keeps the schedule price of this moment. All or nothing: any error rolls everything back.
 */
@Service
public class CreateBookingUseCase {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final BookableSlots bookableSlots;
    private final BookingCheckout bookingCheckout;

    public CreateBookingUseCase(BookingRepository bookingRepository, UserRepository userRepository,
                                BookableSlots bookableSlots, BookingCheckout bookingCheckout) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.bookableSlots = bookableSlots;
        this.bookingCheckout = bookingCheckout;
    }

    @Transactional
    public BookingCreatedResponse execute(String requesterEmail, CreateBookingRequest request) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> NotFoundException.of("User", requesterEmail));
        boolean owner = requester.getRole() == Role.OWNER;
        User client = owner ? clientFor(request.clientId()) : requester;

        Court court = bookableSlots.lockCourt(request.courtId(), owner);

        var booking = new Booking();
        booking.setCourt(court);
        booking.setUser(client);
        booking.setDate(request.date());
        List<BookingSlot> slots = bookableSlots.priced(court, request.date(), request.slots());
        slots.forEach(booking::addSlot);

        if (owner) {
            return new BookingCreatedResponse(BookingMapper.toResponse(bookingRepository.save(booking)), null);
        }
        BookingCheckout.Plan plan = bookingCheckout.plan(client, slots, request.paymentMethodId());
        Booking saved = bookingRepository.save(booking);
        BookingPaymentResponse payment = bookingCheckout.settle(plan, saved);
        return new BookingCreatedResponse(BookingMapper.toResponse(saved), payment);
    }

    private User clientFor(Long clientId) {
        if (clientId == null) {
            throw new IllegalArgumentException("clientId is required when the owner books");
        }
        User client = userRepository.findById(clientId)
                .filter(u -> u.getRole() == Role.CLIENT)
                .orElseThrow(() -> NotFoundException.of("Client", clientId));
        if (!client.isActive()) {
            throw new IllegalArgumentException("Client " + clientId + " is inactive");
        }
        return client;
    }
}
