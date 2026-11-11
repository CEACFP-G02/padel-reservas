package com.g02.padel.credit.dto;

import java.math.BigDecimal;

public record CreditPackResponse(
        Long id,
        int size,
        BigDecimal price
) {
}
