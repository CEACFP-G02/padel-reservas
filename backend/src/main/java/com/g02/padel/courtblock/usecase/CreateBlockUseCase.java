package com.g02.padel.courtblock.usecase;

import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.BookingSlot;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.courtblock.CourtBlock;
import com.g02.padel.courtblock.CourtBlockMapper;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.courtblock.dto.CourtBlockRequest;
import com.g02.padel.courtblock.dto.CourtBlockResponse;
import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.shared.exception.NotFoundException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC (owner): block a court for a time range on a date. It must end in the future and may not cover a
 * CONFIRMED booking (409); overlapping other blocks is fine.
 */
@Service
public class CreateBlockUseCase {

    private final CourtBlockRepository courtBlockRepository;
    private final CourtRepository courtRepository;
    private final BookingRepository bookingRepository;
    private final Clock clock;

    public CreateBlockUseCase(CourtBlockRepository courtBlockRepository, CourtRepository courtRepository,
                              BookingRepository bookingRepository, Clock clock) {
        this.courtBlockRepository = courtBlockRepository;
        this.courtRepository = courtRepository;
        this.bookingRepository = bookingRepository;
        this.clock = clock;
    }

    @Transactional
    public CourtBlockResponse execute(Long courtId, CourtBlockRequest request) {
        LocalTime start = request.start();
        LocalTime end = request.end();
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("Block end must be after its start");
        }
        String range = start + "-" + end;
        if (!request.date().atTime(end).isAfter(LocalDateTime.now(clock))) {
            throw new IllegalArgumentException("Block " + range + " on " + request.date() + " is in the past");
        }
        // Same lock as booking creation, so a booking and a block on this court cannot interleave.
        Court court = courtRepository.findByIdForUpdate(courtId).orElseThrow(() -> NotFoundException.of("Court", courtId));
        bookingRepository.findByCourtIdAndDate(courtId, request.date()).stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .filter(b -> b.getSlots().stream()
                        .anyMatch(s -> s.getStartTime().isBefore(end) && start.isBefore(s.getEndTime())))
                .findFirst()
                .ifPresent(b -> {
                    throw new ConflictException("Block " + range + " overlaps booking " + b.getId() + " ("
                            + rangeOf(b) + ") on court " + courtId);
                });

        var block = new CourtBlock();
        block.setCourt(court);
        block.setDate(request.date());
        block.setStartTime(start);
        block.setEndTime(end);
        block.setReason(request.reason() == null || request.reason().isBlank() ? null : request.reason().trim());
        return CourtBlockMapper.toResponse(courtBlockRepository.save(block));
    }

    private static String rangeOf(Booking booking) {
        LocalTime first = booking.getSlots().stream().map(BookingSlot::getStartTime).min(Comparator.naturalOrder()).orElseThrow();
        LocalTime last = booking.getSlots().stream().map(BookingSlot::getEndTime).max(Comparator.naturalOrder()).orElseThrow();
        return first + "-" + last;
    }
}
