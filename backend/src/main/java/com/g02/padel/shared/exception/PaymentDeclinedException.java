package com.g02.padel.shared.exception;

/** The payment gateway declined a charge (answered as 402 Payment Required). */
public class PaymentDeclinedException extends RuntimeException {

    public PaymentDeclinedException() {
        super("Payment declined: no credits were added");
    }
}
