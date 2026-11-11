package com.g02.padel.credit.dto;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.math.BigDecimal;
import java.util.Set;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;

/** Price rules of docs/api.md#credit-packs: required, {@code >= 0}, at most 2 decimals, fits DECIMAL(8,2). */
class UpdateCreditPackPriceRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private Set<ConstraintViolation<UpdateCreditPackPriceRequest>> validate(String price) {
        return validator.validate(new UpdateCreditPackPriceRequest(price == null ? null : new BigDecimal(price)));
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "0.00", "75", "130.5", "130.50", "999999.99"})
    void acceptsAValidPrice(String price) {
        assertThat(validate(price)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"-0.01", "-10", "12.345", "1000000.00"})
    void rejectsAnInvalidPrice(String price) {
        assertThat(validate(price)).extracting(v -> v.getPropertyPath().toString()).containsOnly("price");
    }

    @Test
    void requiresAPrice() {
        assertThat(validate(null)).extracting(v -> v.getPropertyPath().toString()).containsExactly("price");
    }
}
