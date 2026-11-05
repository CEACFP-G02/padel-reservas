package com.g02.padel.booking.usecase;


import com.g02.padel.booking.BookableSlots;
import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingAccess;
import com.g02.padel.booking.BookingMapper;
import com.g02.padel.booking.BookingSlot;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.booking.dto.RescheduleBookingRequest;
import com.g02.padel.court.Court;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC: move a booking to another date/slots (and optionally another court), with the same checks as creating
 * it — its own current slots count as free — and the current schedule price.
 */
@Service
public class RescheduleBookingUseCase {

    private final BookingAccess bookingAccess;
    private final BookableSlots bookableSlots;

    public RescheduleBookingUseCase(BookingAccess bookingAccess, BookableSlots bookableSlots) {
        this.bookingAccess = bookingAccess;
        this.bookableSlots = bookableSlots;
    }

    @Transactional
    public BookingResponse execute(Long id, String requesterEmail, RescheduleBookingRequest request) {
        BookingAccess.Access access = bookingAccess.changeable(id, requesterEmail);
        Booking booking = access.booking();
        Long courtId = request.courtId() != null ? request.courtId() : booking.getCourt().getId();
        Court court = bookableSlots.lockCourt(courtId, access.byOwner());
        List<BookingSlot> slots = bookableSlots.priced(court, request.date(), request.slots(), booking.getId());
        booking.setCourt(court);
        booking.reschedule(request.date(), slots);
        return BookingMapper.toResponse(booking);
    }
}
