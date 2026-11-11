package com.g02.padel.credit.dto;

/** The client's balance after the purchase and the purchase itself. */
public record PurchaseResponse(long balance, CreditTransactionResponse transaction) {
}
