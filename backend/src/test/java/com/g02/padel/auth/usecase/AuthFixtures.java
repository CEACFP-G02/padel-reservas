package com.g02.padel.auth.usecase;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.User;

final class AuthFixtures {

    private AuthFixtures() {
    }

    static User user(Role role, boolean active) {
        var user = new User();
        user.setId(42L);
        user.setEmail("ana@padel.test");
        user.setPasswordHash("$2a$hash");
        user.setName("Ana López");
        user.setPhone("600000000");
        user.setRole(role);
        user.setActive(active);
        return user;
    }
}
