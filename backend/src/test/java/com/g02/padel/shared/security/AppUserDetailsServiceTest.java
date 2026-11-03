package com.g02.padel.shared.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.User;
import com.g02.padel.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class AppUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AppUserDetailsService service;

    @Test
    void loadsUserByEmailWithRoleAuthority() {
        when(userRepository.findByEmail("owner@padel.test")).thenReturn(Optional.of(user(Role.OWNER, true)));

        var details = service.loadUserByUsername("owner@padel.test");

        assertThat(details.getUsername()).isEqualTo("owner@padel.test");
        assertThat(details.getPassword()).isEqualTo("$2a$hash");
        assertThat(details.getAuthorities()).extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_OWNER");
        assertThat(details.isEnabled()).isTrue();
    }

    @Test
    void mapsClientRoleToRoleClient() {
        when(userRepository.findByEmail("owner@padel.test")).thenReturn(Optional.of(user(Role.CLIENT, true)));

        assertThat(service.loadUserByUsername("owner@padel.test").getAuthorities())
                .extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_CLIENT");
    }

    @Test
    void inactiveUserIsDisabled() {
        when(userRepository.findByEmail("owner@padel.test")).thenReturn(Optional.of(user(Role.CLIENT, false)));

        assertThat(service.loadUserByUsername("owner@padel.test").isEnabled()).isFalse();
    }

    @Test
    void unknownEmailThrowsUsernameNotFound() {
        when(userRepository.findByEmail("nobody@padel.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("nobody@padel.test"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    private static User user(Role role, boolean active) {
        var user = new User();
        user.setId(1L);
        user.setEmail("owner@padel.test");
        user.setPasswordHash("$2a$hash");
        user.setName("Owner");
        user.setRole(role);
        user.setActive(active);
        return user;
    }
}
