package com.g02.padel.credit.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/** {@code { "default": true }}: make this method the client's default (the only supported change). */
public record UpdatePaymentMethodRequest(@JsonProperty("default") Boolean makeDefault) {
}
