package com.g02.padel.shared.enums;

/** Kind of movement in a client's credit ledger. */
public enum CreditTransactionType {
    /** Credits bought with a pack: {@code +packSize}. */
    PURCHASE,
    /** Credits spent on reservations: negative. */
    CONSUMPTION
}
