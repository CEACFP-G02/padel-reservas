package com.g02.padel.credit.gateway;

import com.g02.padel.shared.enums.CardBrand;

/** What the gateway returns for a card: a token to charge it and the details that are safe to keep. */
public record TokenizedCard(String token, CardBrand brand, String last4) {
}
