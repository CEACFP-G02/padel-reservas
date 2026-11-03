package com.g02.padel.shared.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.g02.padel.shared.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;

class CurrentRoleTest {

    @Test
    void readsOwnerFromTheAuthorities() {
        assertThat(CurrentRole.of(new TestingAuthenticationToken("owner", null, "ROLE_OWNER"))).isEqualTo(Role.OWNER);
    }

    @Test
    void readsClientFromTheAuthorities() {
        assertThat(CurrentRole.of(new TestingAuthenticationToken("ana", null, "ROLE_CLIENT"))).isEqualTo(Role.CLIENT);
    }

    @Test
    void fallsBackToTheLeastPrivilegedRole() {
        assertThat(CurrentRole.of(new TestingAuthenticationToken("x", null, "ROLE_OTHER"))).isEqualTo(Role.CLIENT);
        assertThat(CurrentRole.of(null)).isEqualTo(Role.CLIENT);
    }
}
