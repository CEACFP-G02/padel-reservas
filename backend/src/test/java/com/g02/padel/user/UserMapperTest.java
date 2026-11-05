package com.g02.padel.user;

import static org.assertj.core.api.Assertions.assertThat;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.dto.UserResponse;
import org.junit.jupiter.api.Test;

class UserMapperTest {

    @Test
    void mapsUserWithoutExposingThePasswordHash() {
        var user = new User();
        user.setId(42L);
        user.setEmail("ana@padel.test");
        user.setPasswordHash("$2a$hash");
        user.setName("Ana López");
        user.setPhone("600000000");
        user.setRole(Role.CLIENT);

        assertThat(UserMapper.toResponse(user))
                .isEqualTo(new UserResponse(42L, "Ana López", "ana@padel.test", "600000000", Role.CLIENT));
    }
}
