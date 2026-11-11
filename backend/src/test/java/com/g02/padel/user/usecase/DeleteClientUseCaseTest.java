package com.g02.padel.user.usecase;

import static com.g02.padel.user.usecase.UserFixtures.client;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.g02.padel.booking.BookingRepository;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DeleteClientUseCaseTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private DeleteClientUseCase deleteClient;

    @Test
    void deactivatesAClientWithBookingsAndKeepsIt() {
        var ana = client(42L, "Ana López", "ana@padel.test", null, true);
        when(userRepository.findByIdAndRole(42L, Role.CLIENT)).thenReturn(Optional.of(ana));
        when(bookingRepository.existsByUserId(42L)).thenReturn(true);

        deleteClient.execute(42L);

        assertThat(ana.isActive()).isFalse();
        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    void deletesAClientWithoutBookingsForGood() {
        var ana = client(42L, "Ana López", "ana@padel.test", null, true);
        when(userRepository.findByIdAndRole(42L, Role.CLIENT)).thenReturn(Optional.of(ana));
        when(bookingRepository.existsByUserId(42L)).thenReturn(false);

        deleteClient.execute(42L);

        verify(userRepository).delete(ana);
    }

    @Test
    void throwsNotFoundForAMissingIdOrAnOwner() {
        when(userRepository.findByIdAndRole(1L, Role.CLIENT)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deleteClient.execute(1L))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Client 1 not found");
        verify(userRepository, never()).delete(any(User.class));
    }
}
