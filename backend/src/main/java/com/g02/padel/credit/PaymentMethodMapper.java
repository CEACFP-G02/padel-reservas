package com.g02.padel.credit;

import com.g02.padel.credit.dto.PaymentMethodResponse;
import java.time.YearMonth;

public final class PaymentMethodMapper {

    private PaymentMethodMapper() {
    }

    public static PaymentMethodResponse toResponse(PaymentMethod method) {
        return new PaymentMethodResponse(method.getId(), method.getBrand(), method.getLast4(),
                YearMonth.of(method.getExpYear(), method.getExpMonth()), method.isDefaultMethod());
    }
}
