package com.g02.padel.auth.usecase;

import java.util.Locale;

/** Emails are stored and looked up trimmed and lower-cased, so "Ana@Padel.test" and "ana@padel.test" are one account. */
public final class Emails {

    private Emails() {
    }

    public static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
