package com.g02.padel.user.usecase;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.User;

final class UserFixtures {

    private UserFixtures() {
    }

    static User client(Long id, String name, String email, String phone, boolean active) {
        return user(id, name, email, phone, Role.CLIENT, active);
    }

    static User user(Long id, String name, String email, String phone, Role role, boolean active) {
        var user = new User();
        user.setId(id);
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPasswordHash("$2a$hash");
        user.setRole(role);
        user.setActive(active);
        return user;
    }
}
