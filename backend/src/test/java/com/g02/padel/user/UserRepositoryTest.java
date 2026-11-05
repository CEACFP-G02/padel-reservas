package com.g02.padel.user;

import static org.assertj.core.api.Assertions.assertThat;

import com.g02.padel.shared.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

/** The app_user mapping against the Flyway schema (H2 in PostgreSQL mode). */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void savesAndFindsUserByEmail() {
        userRepository.saveAndFlush(user("ana@padel.test", Role.CLIENT));

        var found = userRepository.findByEmail("ana@padel.test");

        assertThat(found).hasValueSatisfying(u -> {
            assertThat(u.getId()).isNotNull();
            assertThat(u.getName()).isEqualTo("Ana López");
            assertThat(u.getRole()).isEqualTo(Role.CLIENT);
            assertThat(u.isActive()).isTrue();
            assertThat(u.getCreatedAt()).isNotNull();
        });
        assertThat(userRepository.existsByEmail("ana@padel.test")).isTrue();
        assertThat(userRepository.existsByEmail("other@padel.test")).isFalse();
    }

    @Test
    void storesRoleAsVarchar() {
        userRepository.saveAndFlush(user("owner@padel.test", Role.OWNER));

        String role = jdbc.queryForObject("SELECT role FROM app_user WHERE email = ?", String.class, "owner@padel.test");

        assertThat(role).isEqualTo("OWNER");
    }

    private static User user(String email, Role role) {
        var user = new User();
        user.setEmail(email);
        user.setPasswordHash("$2a$hash");
        user.setName("Ana López");
        user.setRole(role);
        return user;
    }
}
