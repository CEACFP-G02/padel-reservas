package com.g02.padel.booking.usecase;

import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.booking.dto.CreateBookingRequest;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: book one or more consecutive slots of a court. */
@Service
public class CreateBookingUseCase {

    private final BookingRepository bookingRepository;
    private final CourtRepository courtRepository;
    private final UserRepository userRepository;
    private final ScheduleRepository scheduleRepository;
    private final CourtBlockRepository courtBlockRepository;

    public CreateBookingUseCase(BookingRepository bookingRepository,
                                CourtRepository courtRepository,
                                UserRepository userRepository,
                                ScheduleRepository scheduleRepository,
                                CourtBlockRepository courtBlockRepository) {
        this.bookingRepository = bookingRepository;
        this.courtRepository = courtRepository;
        this.userRepository = userRepository;
        this.scheduleRepository = scheduleRepository;
        this.courtBlockRepository = courtBlockRepository;
    }

    @Transactional
    public BookingResponse execute(String requesterEmail, CreateBookingRequest request) {
        // TODO: resolve the booking's client (requester, or request.userId if requester is OWNER); court must be active;
        //  slots must be contiguous and inside the court's opening hours; if any slot overlaps a non-CANCELLED
        //  booking or a court block -> throw SlotNotAvailableException (409); totalPrice = pricePerHour * hours;
        //  save as CONFIRMED — see docs/api.md#post-apiv1bookings
        throw new UnsupportedOperationException("TODO: CreateBooking — see docs/api.md#post-apiv1bookings");
    }
}
