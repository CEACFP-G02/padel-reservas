package com.g02.padel.shared.exception;

/** Thrown when a requested slot is already booked or blocked. Mapped to 409 Conflict. */
public class SlotNotAvailableException extends RuntimeException {

    public SlotNotAvailableException(String message) {
        super(message);
    }
}
