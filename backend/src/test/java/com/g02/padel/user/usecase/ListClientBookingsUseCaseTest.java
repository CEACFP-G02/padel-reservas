package com.g02.padel.user.usecase;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.booking;
import static com.g02.padel.availability.AvailabilityFixtures.court;
import static com.g02.padel.user.usecase.UserFixtures.client;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.booking.Booking;
import com.g02.padel.booking.BookingRepository;
import com.g02.padel.booking.dto.BookingResponse;
import com.g02.padel.shared.enums.BookingStatus;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

class ListClientBookingsUseCaseTest {

    private final UserRepository users = mock(UserRepository.class);
    private final BookingRepository bookings = mock(BookingRepository.class);
    private final ListClientBookingsUseCase useCase = new ListClientBookingsUseCase(users, bookings);

    private final User ana = client(42L, "Ana López", "ana@padel.test", null, false);

    @Test
    @SuppressWarnings("unchecked")
    void pagesTheClientBookingsMostRecentFirstByDefault() {
        when(users.findByIdAndRole(42L, Role.CLIENT)).thenReturn(Optional.of(ana));
        Booking booking = booking(court(3L, true), MONDAY, BookingStatus.CONFIRMED, "07:00-08:00");
        booking.setId(5001L);
        booking.setUser(ana);
        booking.setCreatedAt(LocalDateTime.of(2026, 6, 1, 10, 0));
        var sorted = PageRequest.of(1, 5, Sort.by(Sort.Order.desc("date"), Sort.Order.desc("id")));
        when(bookings.findAll(any(Specification.class), eq(sorted))).thenReturn(new PageImpl<>(List.of(booking), sorted, 6));

        var page = useCase.execute(42L, PageRequest.of(1, 5));

        assertThat(page.getTotalElements()).isEqualTo(6);
        assertThat(page.getContent()).extracting(BookingResponse::id, BookingResponse::userId).containsExactly(
                org.assertj.core.groups.Tuple.tuple(5001L, 42L));
    }

    @Test
    @SuppressWarnings("unchecked")
    void keepsAnExplicitSort() {
        when(users.findByIdAndRole(42L, Role.CLIENT)).thenReturn(Optional.of(ana));
        Pageable byDateAsc = PageRequest.of(0, 20, Sort.by("date"));
        when(bookings.findAll(any(Specification.class), eq(byDateAsc))).thenReturn(new PageImpl<>(List.of(), byDateAsc, 0));

        assertThat(useCase.execute(42L, byDateAsc).getTotalElements()).isZero();
    }

    @Test
    @SuppressWarnings("unchecked")
    void throwsNotFoundForAnUnknownIdOrAnOwner() {
        when(users.findByIdAndRole(1L, Role.CLIENT)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(1L, PageRequest.of(0, 20)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Client 1 not found");
        verify(bookings, never()).findAll(any(Specification.class), any(Pageable.class));
    }
}
