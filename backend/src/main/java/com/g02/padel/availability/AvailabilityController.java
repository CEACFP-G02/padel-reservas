package com.g02.padel.availability;

import com.g02.padel.availability.dto.AvailabilityResponse;
import com.g02.padel.availability.dto.CourtDayAvailabilityResponse;
import com.g02.padel.availability.usecase.GetAvailabilityUseCase;
import com.g02.padel.availability.usecase.GetCourtDayAvailabilityUseCase;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1")
public class AvailabilityController {

    private final GetAvailabilityUseCase getAvailability;
    private final GetCourtDayAvailabilityUseCase getCourtDayAvailability;

    public AvailabilityController(GetAvailabilityUseCase getAvailability,
                                  GetCourtDayAvailabilityUseCase getCourtDayAvailability) {
        this.getAvailability = getAvailability;
        this.getCourtDayAvailability = getCourtDayAvailability;
    }

    @GetMapping("/availability")
    public AvailabilityResponse availability(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return getAvailability.execute(date);
    }

    @GetMapping("/courts/{courtId}/availability")
    public CourtDayAvailabilityResponse courtDayAvailability(
            @PathVariable Long courtId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return getCourtDayAvailability.execute(courtId, date);
    }
}
