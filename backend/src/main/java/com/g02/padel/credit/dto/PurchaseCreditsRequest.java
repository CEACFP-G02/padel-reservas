package com.g02.padel.credit.dto;

import jakarta.validation.constraints.NotNull;

public record PurchaseCreditsRequest(@NotNull Long packId, @NotNull Long paymentMethodId) {
}
