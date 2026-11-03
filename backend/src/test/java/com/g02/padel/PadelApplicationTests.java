package com.g02.padel;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Boots the full context on H2: runs the Flyway migrations and validates the JPA mappings against them. */
@SpringBootTest
@ActiveProfiles("test")
class PadelApplicationTests {

    @Test
    void contextLoads() {
    }
}
