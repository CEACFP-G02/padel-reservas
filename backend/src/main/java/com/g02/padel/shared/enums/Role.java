package com.g02.padel.shared.enums;

/** User roles; the JWT "role" claim carries {@link #name()} (e.g. "OWNER"). */
public enum Role {
    OWNER,
    CLIENT;

    /** Spring Security authority, so that {@code hasRole('OWNER')} matches "ROLE_OWNER". */
    public String authority() {
        return "ROLE_" + name();
    }
}
