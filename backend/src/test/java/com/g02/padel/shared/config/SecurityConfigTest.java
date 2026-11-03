package com.g02.padel.shared.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void hashesPasswordsWithBCrypt() {
        assertThat(passwordEncoder).isInstanceOf(BCryptPasswordEncoder.class);

        String hash = passwordEncoder.encode("s3cret-pass");

        assertThat(hash).startsWith("$2").isNotEqualTo("s3cret-pass");
        assertThat(passwordEncoder.matches("s3cret-pass", hash)).isTrue();
        assertThat(passwordEncoder.matches("wrong-pass", hash)).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"http://localhost:4200", "http://localhost:5173", "http://localhost:3000"})
    void allowsCorsPreflightFromTheDevServers(String origin) throws Exception {
        mvc.perform(options("/api/v1/courts")
                        .header("Origin", origin)
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", origin));
    }

    @Test
    void rejectsCorsPreflightFromUnknownOrigins() throws Exception {
        mvc.perform(options("/api/v1/courts")
                        .header("Origin", "http://evil.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
