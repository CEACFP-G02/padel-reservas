package com.g02.padel.booking.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonUnwrapped;

/** {@code POST /bookings}: the booking response plus, for a CLIENT, how it was paid (absent for the OWNER). */
public record BookingCreatedResponse(
        @JsonUnwrapped BookingResponse booking,
        @JsonInclude(JsonInclude.Include.NON_NULL) BookingPaymentResponse payment
) {
}
