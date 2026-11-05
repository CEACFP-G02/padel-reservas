package com.g02.padel.shared.security;

import com.g02.padel.user.User;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Issues and validates HS256-signed JWTs (jjwt 0.12.x). Access tokens carry {@code sub}=email, {@code uid} and
 * {@code role}; refresh tokens only {@code sub}. The {@code typ} claim keeps one kind from being used as the other.
 */
@Service
public class JwtService {

    private static final String TYPE_CLAIM = "typ";
    private static final String ACCESS = "access";
    private static final String REFRESH = "refresh";

    private final SecretKey key;
    private final Duration accessTokenTtl;
    private final Duration refreshTokenTtl;
    private final Clock clock;

    @Autowired
    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.access-token-ttl-minutes}") long accessTokenTtlMinutes,
                      @Value("${app.jwt.refresh-token-ttl-days}") long refreshTokenTtlDays) {
        this(secret, Duration.ofMinutes(accessTokenTtlMinutes), Duration.ofDays(refreshTokenTtlDays), Clock.systemUTC());
    }

    public JwtService(String base64Secret, Duration accessTokenTtl, Duration refreshTokenTtl, Clock clock) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
        this.accessTokenTtl = accessTokenTtl;
        this.refreshTokenTtl = refreshTokenTtl;
        this.clock = clock;
    }

    public String generateAccessToken(User user) {
        Instant now = clock.instant();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("role", user.getRole().name())
                .claim(TYPE_CLAIM, ACCESS)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenTtl)))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(User user) {
        Instant now = clock.instant();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim(TYPE_CLAIM, REFRESH)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(refreshTokenTtl)))
                .signWith(key)
                .compact();
    }

    /** The subject (email) of a well-formed, correctly signed, unexpired access token; empty otherwise. */
    public Optional<String> validateAccessToken(String token) {
        return validate(token, ACCESS);
    }

    /** The subject (email) of a well-formed, correctly signed, unexpired refresh token; empty otherwise. */
    public Optional<String> validateRefreshToken(String token) {
        return validate(token, REFRESH);
    }

    public long getAccessTokenTtlSeconds() {
        return accessTokenTtl.toSeconds();
    }

    private Optional<String> validate(String token, String expectedType) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            var claims = Jwts.parser()
                    .verifyWith(key)
                    .clock(() -> Date.from(clock.instant()))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return expectedType.equals(claims.get(TYPE_CLAIM, String.class))
                    ? Optional.ofNullable(claims.getSubject())
                    : Optional.empty();
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
