package com.g02.padel.booking.usecase;


import com.g02.padel.booking.BookingAccess;
import com.g02.padel.booking.BookingMapper;
import com.g02.padel.booking.dto.BookingResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: get one booking (the client who made it, or the OWNER). */
@Service
public class GetBookingUseCase {

    private final BookingAccess bookingAccess;

    public GetBookingUseCase(BookingAccess bookingAccess) {
        this.bookingAccess = bookingAccess;
    }

    @Transactional(readOnly = true)
    public BookingResponse execute(Long id, String requesterEmail) {
        return BookingMapper.toResponse(bookingAccess.visible(id, requesterEmail));
    }
}
