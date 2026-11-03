package com.g02.padel.shared.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.User;
import io.jsonwebtoken.Jwts;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET = Base64.getEncoder()
            .encodeToString("test-only-secret-key-with-at-least-256-bits!!".getBytes());
    private static final String OTHER_SECRET = Base64.getEncoder()
            .encodeToString("another-secret-key-that-is-also-256-bits-long".getBytes());
    private static final Instant NOW = Instant.parse("2026-06-08T07:00:00Z");

    private final JwtService jwt = service(SECRET, NOW);

    @Test
    void issuesAnAccessTokenCarryingEmailUserIdAndRole() {
        String token = jwt.generateAccessToken(user());

        var claims = Jwts.parser().verifyWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(Base64.getDecoder().decode(SECRET)))
                .clock(() -> java.util.Date.from(NOW)).build().parseSignedClaims(token).getPayload();
        assertThat(claims.getSubject()).isEqualTo("ana@padel.test");
        assertThat(claims.get("uid", Long.class)).isEqualTo(42L);
        assertThat(claims.get("role", String.class)).isEqualTo("CLIENT");
        assertThat(claims.get("typ", String.class)).isEqualTo("access");
        assertThat(claims.getIssuedAt().toInstant()).isEqualTo(NOW);
        assertThat(claims.getExpiration().toInstant()).isEqualTo(NOW.plus(Duration.ofMinutes(15)));
    }

    @Test
    void validatesItsOwnAccessTokenAndReturnsTheSubject() {
        String token = jwt.generateAccessToken(user());

        assertThat(jwt.validateAccessToken(token)).contains("ana@padel.test");
    }

    @Test
    void validatesItsOwnRefreshTokenAndReturnsTheSubject() {
        String token = jwt.generateRefreshToken(user());

        assertThat(jwt.validateRefreshToken(token)).contains("ana@padel.test");
    }

    @Test
    void accessTokenExpiresAfterItsTtl() {
        String token = jwt.generateAccessToken(user());

        assertThat(service(SECRET, NOW.plus(Duration.ofMinutes(14))).validateAccessToken(token)).isPresent();
        assertThat(service(SECRET, NOW.plus(Duration.ofMinutes(16))).validateAccessToken(token)).isEmpty();
    }

    @Test
    void refreshTokenExpiresAfterItsTtl() {
        String token = jwt.generateRefreshToken(user());

        assertThat(service(SECRET, NOW.plus(Duration.ofDays(6))).validateRefreshToken(token)).isPresent();
        assertThat(service(SECRET, NOW.plus(Duration.ofDays(7).plusMinutes(1))).validateRefreshToken(token)).isEmpty();
    }

    @Test
    void rejectsMalformedTokens() {
        assertThat(jwt.validateAccessToken("not-a-jwt")).isEmpty();
        assertThat(jwt.validateAccessToken("a.b.c")).isEmpty();
        assertThat(jwt.validateAccessToken("")).isEmpty();
        assertThat(jwt.validateAccessToken(null)).isEmpty();
        assertThat(jwt.validateRefreshToken("not-a-jwt")).isEmpty();
    }

    @Test
    void rejectsTokensSignedWithAnotherKey() {
        String forged = service(OTHER_SECRET, NOW).generateAccessToken(user());

        assertThat(jwt.validateAccessToken(forged)).isEmpty();
    }

    @Test
    void rejectsTamperedTokens() {
        String token = jwt.generateAccessToken(user());
        String[] parts = token.split("\\.");
        String tamperedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                new String(Base64.getUrlDecoder().decode(parts[1])).replace("CLIENT", "OWNER").getBytes());

        assertThat(jwt.validateAccessToken(parts[0] + "." + tamperedPayload + "." + parts[2])).isEmpty();
    }

    @Test
    void doesNotAcceptARefreshTokenAsAnAccessTokenOrViceVersa() {
        assertThat(jwt.validateAccessToken(jwt.generateRefreshToken(user()))).isEmpty();
        assertThat(jwt.validateRefreshToken(jwt.generateAccessToken(user()))).isEmpty();
    }

    @Test
    void exposesAccessTokenTtlInSeconds() {
        assertThat(jwt.getAccessTokenTtlSeconds()).isEqualTo(900);
    }

    private static JwtService service(String secret, Instant now) {
        return new JwtService(secret, Duration.ofMinutes(15), Duration.ofDays(7), Clock.fixed(now, ZoneOffset.UTC));
    }

    private static User user() {
        var user = new User();
        user.setId(42L);
        user.setEmail("ana@padel.test");
        user.setName("Ana López");
        user.setRole(Role.CLIENT);
        return user;
    }
}
