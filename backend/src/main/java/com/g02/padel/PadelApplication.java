package com.g02.padel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// Authentication is JWT-only, so Spring's default in-memory user is disabled.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class PadelApplication {

    public static void main(String[] args) {
        SpringApplication.run(PadelApplication.class, args);
    }
}
