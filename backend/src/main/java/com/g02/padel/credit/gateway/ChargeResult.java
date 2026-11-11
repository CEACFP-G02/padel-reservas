package com.g02.padel.credit.gateway;

/** Outcome of a charge; {@code reference} identifies it at the gateway. */
public record ChargeResult(ChargeStatus status, String reference) {
}
