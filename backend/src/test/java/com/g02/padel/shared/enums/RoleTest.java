package com.g02.padel.shared.enums;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RoleTest {

    @Test
    void rolesAreOwnerAndClient() {
        assertThat(Role.values()).containsExactly(Role.OWNER, Role.CLIENT);
    }

    @Test
    void authorityHasRolePrefixForHasRoleChecks() {
        assertThat(Role.OWNER.authority()).isEqualTo("ROLE_OWNER");
        assertThat(Role.CLIENT.authority()).isEqualTo("ROLE_CLIENT");
    }
}
