package com.g02.padel.credit;

import com.g02.padel.credit.dto.CreditPackResponse;

public final class CreditPackMapper {

    private CreditPackMapper() {
    }

    public static CreditPackResponse toResponse(CreditPack pack) {
        return new CreditPackResponse(pack.getId(), pack.getSize(), pack.getPrice());
    }
}
