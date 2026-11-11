package com.g02.padel.credit;

import com.g02.padel.credit.dto.CreditTransactionResponse;
import java.time.ZoneOffset;

public final class CreditTransactionMapper {

    private CreditTransactionMapper() {
    }

    public static CreditTransactionResponse toResponse(CreditTransaction transaction) {
        PaymentMethod paymentMethod = transaction.getPaymentMethod();
        return new CreditTransactionResponse(transaction.getId(), transaction.getType(), transaction.getCredits(),
                transaction.getAmount(), transaction.getPackSize(), paymentMethod == null ? null : paymentMethod.getId(),
                transaction.getCreatedAt().toInstant(ZoneOffset.UTC));
    }
}
