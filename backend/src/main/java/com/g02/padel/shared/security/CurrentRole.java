package com.g02.padel.shared.security;

import com.g02.padel.shared.enums.Role;
import org.springframework.security.core.Authentication;

/** The caller's {@link Role}, read from the authenticated principal's authorities (never from the request). */
public final class CurrentRole {

    private CurrentRole() {
    }

    /** OWNER only with authority ROLE_OWNER; anything else gets the least-privileged role, CLIENT. */
    public static Role of(Authentication authentication) {
        boolean owner = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> Role.OWNER.authority().equals(a.getAuthority()));
        return owner ? Role.OWNER : Role.CLIENT;
    }
}
