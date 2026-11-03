package com.g02.padel.shared.exception;

/** The request clashes with existing state (e.g. an email already registered). Mapped to 409 Conflict. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
