package com.g02.padel.courtblock.usecase;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.booking;
import static com.g02.padel.availability.AvailabilityFixtures.clockAt;
import static com.g02.padel.availability.AvailabilityFixtures.court;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.courtblock.CourtBlock;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.courtblock.dto.CourtBlockRequest;
import com.g02.padel.courtblock.dto.CourtBlockResponse;
import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.shared.exception.NotFoundException;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class CreateBlockUseCaseTest {

    private final CourtBlockRepository blocks = mock(CourtBlockRepository.class);
    private final CourtRepository courts = mock(CourtRepository.class);
    private final BookingRepository bookings = mock(BookingRepository.class);
    /** Monday 10:00. */
    private final CreateBlockUseCase useCase =
            new CreateBlockUseCase(blocks, courts, bookings, clockAt(MONDAY, "10:00"));

    private final Court court = court(3L, true);

    @BeforeEach
    void setUp() {
        when(courts.findByIdForUpdate(3L)).thenReturn(Optional.of(court));
        when(bookings.findByCourtIdAndDate(any(), any())).thenReturn(List.of());
        when(blocks.save(any(CourtBlock.class))).thenAnswer(inv -> {
            CourtBlock b = inv.getArgument(0);
            b.setId(9L);
            return b;
        });
    }

    private static CourtBlockRequest request(String start, String end, String reason) {
        return new CourtBlockRequest(MONDAY.plusDays(1), LocalTime.parse(start), LocalTime.parse(end), reason);
    }

    @Test
    void savesTheBlockOnTheLockedCourtAndReturnsIt() {
        var response = useCase.execute(3L, request("07:00", "09:00", " Mantenimiento "));

        var saved = ArgumentCaptor.forClass(CourtBlock.class);
        verify(blocks).save(saved.capture());
        assertThat(saved.getValue().getCourt()).isSameAs(court);
        assertThat(response).isEqualTo(new CourtBlockResponse(9L, 3L, MONDAY.plusDays(1), LocalTime.of(7, 0),
                LocalTime.of(9, 0), "Mantenimiento"));
    }

    @Test
    void aBlankReasonIsStoredAsNull() {
        assertThat(useCase.execute(3L, request("07:00", "09:00", "  ")).reason()).isNull();
    }

    @Test
    void rejectsAnEndNotAfterTheStart() {
        assertThatThrownBy(() -> useCase.execute(3L, request("09:00", "09:00", null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Block end must be after its start");
        assertThatThrownBy(() -> useCase.execute(3L, request("10:00", "09:00", null)))
                .isInstanceOf(IllegalArgumentException.class);
        verify(blocks, never()).save(any());
    }

    @Test
    void rejectsABlockThatHasAlreadyEnded() {
        var endedToday = new CourtBlockRequest(MONDAY, LocalTime.of(8, 0), LocalTime.of(10, 0), null);
        var yesterday = new CourtBlockRequest(MONDAY.minusDays(1), LocalTime.of(18, 0), LocalTime.of(20, 0), null);

        assertThatThrownBy(() -> useCase.execute(3L, endedToday))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Block 08:00-10:00 on 2026-06-08 is in the past");
        assertThatThrownBy(() -> useCase.execute(3L, yesterday)).isInstanceOf(IllegalArgumentException.class);
        verify(blocks, never()).save(any());
    }

    @Test
    void allowsABlockThatHasStartedButNotEnded() {
        var ongoing = new CourtBlockRequest(MONDAY, LocalTime.of(9, 0), LocalTime.of(12, 0), null);

        assertThat(useCase.execute(3L, ongoing).id()).isEqualTo(9L);
    }

    @Test
    void rejectsABlockOverAConfirmedBookingWith409() {
        Booking booked = booking(court, MONDAY.plusDays(1), BookingStatus.CONFIRMED, "08:00-09:00", "09:00-10:00");
        booked.setId(5001L);
        when(bookings.findByCourtIdAndDate(3L, MONDAY.plusDays(1))).thenReturn(List.of(booked));

        assertThatThrownBy(() -> useCase.execute(3L, request("07:00", "08:30", null)))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Block 07:00-08:30 overlaps booking 5001 (08:00-10:00) on court 3");
        verify(blocks, never()).save(any());
    }

    @Test
    void ignoresCancelledBookingsAndBookingsThatOnlyTouchTheBlock() {
        Booking cancelled = booking(court, MONDAY.plusDays(1), BookingStatus.CANCELLED, "07:00-08:00");
        Booking adjacent = booking(court, MONDAY.plusDays(1), BookingStatus.CONFIRMED, "09:00-10:00");
        when(bookings.findByCourtIdAndDate(3L, MONDAY.plusDays(1))).thenReturn(List.of(cancelled, adjacent));

        assertThat(useCase.execute(3L, request("07:00", "09:00", null)).id()).isEqualTo(9L);
    }

    @Test
    void throwsNotFoundForAMissingCourt() {
        when(courts.findByIdForUpdate(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(99L, request("07:00", "09:00", null)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Court 99 not found");
    }
}
