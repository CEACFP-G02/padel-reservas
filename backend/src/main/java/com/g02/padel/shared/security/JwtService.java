package com.g02.padel.shared.security;

import com.g02.padel.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;

/** Issues and validates JWT access/refresh tokens (jjwt 0.12.x). */
@Service
public class JwtService {

    private final String secret;
    private final Duration accessTokenTtl;
    private final Duration refreshTokenTtl;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.access-token-ttl-minutes}") long accessTokenTtlMinutes,
                      @Value("${app.jwt.refresh-token-ttl-days}") long refreshTokenTtlDays) {
        this.secret = secret;
        this.accessTokenTtl = Duration.ofMinutes(accessTokenTtlMinutes);
        this.refreshTokenTtl = Duration.ofDays(refreshTokenTtlDays);
    }

    public String generateAccessToken(User user) {
        // TODO: sign HS256 with subject=email, claims {uid, role=user.getRole().name() ("OWNER"/"CLIENT")},
        //  exp=now+accessTokenTtl — see docs/api.md#authentication
        throw new UnsupportedOperationException("TODO: JwtService.generateAccessToken — see docs/api.md#authentication");
    }

    public String generateRefreshToken(User user) {
        // TODO: sign with claim typ=refresh, exp=now+refreshTokenTtl — see docs/api.md#authentication
        throw new UnsupportedOperationException("TODO: JwtService.generateRefreshToken — see docs/api.md#authentication");
    }

    public String extractSubject(String token) {
        // TODO: parse & verify signature, return subject (email) — see docs/api.md#authentication
        throw new UnsupportedOperationException("TODO: JwtService.extractSubject — see docs/api.md#authentication");
    }

    public boolean isValid(String token) {
        // TODO: verify signature + expiry — see docs/api.md#authentication
        throw new UnsupportedOperationException("TODO: JwtService.isValid — see docs/api.md#authentication");
    }

    public long getAccessTokenTtlSeconds() {
        return accessTokenTtl.toSeconds();
    }
}
