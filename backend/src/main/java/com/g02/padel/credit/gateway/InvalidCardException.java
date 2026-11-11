package com.g02.padel.credit.gateway;

/** The gateway refused to tokenise a card (answered as 400). Messages never include the card number. */
public class InvalidCardException extends IllegalArgumentException {

    public InvalidCardException(String message) {
        super(message);
    }
}
