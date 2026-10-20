package com.g02.padel.availability.usecase;

import com.g02.padel.availability.dto.AvailabilityResponse;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.schedule.ScheduleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * UC: free slots of every active court on a date (computed, not stored).
 * slots = schedule/opening hours of that weekday − non-cancelled booking slots − court blocks.
 */
@Service
public class GetAvailabilityUseCase {

    private final CourtRepository courtRepository;
    private final ScheduleRepository scheduleRepository;
    private final BookingRepository bookingRepository;
    private final CourtBlockRepository courtBlockRepository;
    private final int nearbyDaysWindow;

    public GetAvailabilityUseCase(CourtRepository courtRepository,
                                  ScheduleRepository scheduleRepository,
                                  BookingRepository bookingRepository,
                                  CourtBlockRepository courtBlockRepository,
                                  @Value("${app.availability.nearby-days-window}") int nearbyDaysWindow) {
        this.courtRepository = courtRepository;
        this.scheduleRepository = scheduleRepository;
        this.bookingRepository = bookingRepository;
        this.courtBlockRepository = courtBlockRepository;
        this.nearbyDaysWindow = nearbyDaysWindow;
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse execute(LocalDate date) {
        // TODO: reject dates in the past (IllegalArgumentException -> 400).
        //  For each active court compute its day slots (same algorithm as GetCourtDayAvailabilityUseCase).
        //  If NO slot is free on `date`, fill nearbyAvailableDays with the days that do have a free slot in
        //  [max(today, date - nearbyDaysWindow), date + nearbyDaysWindow], excluding `date`, never in the past,
        //  ordered by distance to `date` — see docs/api.md#get-apiv1availability
        throw new UnsupportedOperationException("TODO: GetAvailability — see docs/api.md#get-apiv1availability");
    }
}
