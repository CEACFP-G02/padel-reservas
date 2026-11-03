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
 * UC: slots of a date with at least {@code courts} free courts (computed, not stored).
 * Free courts per slot = schedule/opening hours of that weekday − non-cancelled booking slots − court blocks.
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
    public AvailabilityResponse execute(LocalDate date, int courts) {
        // TODO: reject dates in the past (IllegalArgumentException -> 400).
        //  For each active court compute its day slots (same algorithm as GetCourtDayAvailabilityUseCase);
        //  keep the slots with >= `courts` free courts as SlotResponse(start, end, courtsFree, courtIds, price).
        //  If none, available=false, slots=[] and alternativeDays = days with such a slot (freeSlotCount) in
        //  [max(today, date - nearbyDaysWindow), date + nearbyDaysWindow], excluding `date`, ordered by date
        //  — see docs/api.md#availability--apiv1availability-
        throw new UnsupportedOperationException("TODO: GetAvailability — see docs/api.md#get-apiv1availability");
    }
}
