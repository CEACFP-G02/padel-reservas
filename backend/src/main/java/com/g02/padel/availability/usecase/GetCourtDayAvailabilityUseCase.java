package com.g02.padel.availability.usecase;

import com.g02.padel.availability.dto.CourtDayAvailabilityResponse;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.schedule.ScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/** UC: slot grid of a single court on a date, each slot flagged available or not. */
@Service
public class GetCourtDayAvailabilityUseCase {

    private final CourtRepository courtRepository;
    private final ScheduleRepository scheduleRepository;
    private final BookingRepository bookingRepository;
    private final CourtBlockRepository courtBlockRepository;

    public GetCourtDayAvailabilityUseCase(CourtRepository courtRepository,
                                          ScheduleRepository scheduleRepository,
                                          BookingRepository bookingRepository,
                                          CourtBlockRepository courtBlockRepository) {
        this.courtRepository = courtRepository;
        this.scheduleRepository = scheduleRepository;
        this.bookingRepository = bookingRepository;
        this.courtBlockRepository = courtBlockRepository;
    }

    @Transactional(readOnly = true)
    public CourtDayAvailabilityResponse execute(Long courtId, LocalDate date) {
        // TODO: court must exist & be active (NotFoundException); split that weekday's opening hours into
        //  slotMinutes slots; mark unavailable those overlapping a non-CANCELLED booking slot
        //  (findByCourtIdAndDate) or a court block (findByCourtIdAndDate); for today, past slots are unavailable
        //  — see docs/api.md#get-apiv1courtscourtidavailability
        throw new UnsupportedOperationException(
                "TODO: GetCourtDayAvailability — see docs/api.md#get-apiv1courtscourtidavailability");
    }
}
