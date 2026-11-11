package com.g02.padel.credit.usecase;

import com.g02.padel.credit.PaymentMethod;
import com.g02.padel.shared.enums.CardBrand;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.User;

public final class PaymentMethodFixtures {

    public static final String CLIENT_EMAIL = "ana@padel.test";

    private PaymentMethodFixtures() {
    }

    public static User client(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setName("Ana López");
        user.setPasswordHash("$2a$hash");
        user.setRole(Role.CLIENT);
        return user;
    }

    public static PaymentMethod method(Long id, User user, String last4, boolean isDefault) {
        PaymentMethod method = new PaymentMethod();
        method.setId(id);
        method.setUser(user);
        method.setBrand(CardBrand.VISA);
        method.setLast4(last4);
        method.setExpMonth(12);
        method.setExpYear(2028);
        method.setGatewayToken("tok_mock_" + id);
        method.setDefaultMethod(isDefault);
        method.setActive(true);
        return method;
    }
}
