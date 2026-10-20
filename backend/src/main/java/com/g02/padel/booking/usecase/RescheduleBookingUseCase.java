package com.g02.padel.booking.usecase;

import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.booking.dto.RescheduleBookingRequest;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.schedule.ScheduleRepository;
import com.g02.padel.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC: move a booking to another date/slot (and optionally another court). */
@Service
public class RescheduleBookingUseCase {

    private final BookingRepository bookingRepository;
    private final CourtRepository courtRepository;
    private final UserRepository userRepository;
    private final ScheduleRepository scheduleRepository;
    private final CourtBlockRepository courtBlockRepository;

    public RescheduleBookingUseCase(BookingRepository bookingRepository,
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
    public BookingResponse execute(Long id, String requesterEmail, RescheduleBookingRequest request) {
        // TODO: same ownership + notice rules as CancelBooking; same slot checks as CreateBooking (ignoring this
        //  booking's own slots) -> SlotNotAvailableException; replace slots, recompute price
        //  — see docs/api.md#patch-apiv1bookingsidreschedule
        throw new UnsupportedOperationException(
                "TODO: RescheduleBooking — see docs/api.md#patch-apiv1bookingsidreschedule");
    }
}
