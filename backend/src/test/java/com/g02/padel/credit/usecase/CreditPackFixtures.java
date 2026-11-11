package com.g02.padel.credit.usecase;

import com.g02.padel.credit.CreditPack;
import java.math.BigDecimal;

public final class CreditPackFixtures {

    private CreditPackFixtures() {
    }

    public static CreditPack pack(Long id, int size, String price) {
        CreditPack pack = new CreditPack();
        pack.setId(id);
        pack.setSize(size);
        pack.setPrice(new BigDecimal(price));
        return pack;
    }
}
