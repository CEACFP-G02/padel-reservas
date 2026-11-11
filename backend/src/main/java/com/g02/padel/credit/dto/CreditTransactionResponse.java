package com.g02.padel.credit.dto;

import com.g02.padel.shared.enums.CreditTransactionType;

import java.math.BigDecimal;
import java.time.Instant;

/** {@code amount}, {@code packSize} and {@code paymentMethodId} are null for a consumption. */
public record CreditTransactionResponse(
        Long id,
        CreditTransactionType type,
        int credits,
        BigDecimal amount,
        Integer packSize,
        Long paymentMethodId,
        Instant createdAt
) {
}
