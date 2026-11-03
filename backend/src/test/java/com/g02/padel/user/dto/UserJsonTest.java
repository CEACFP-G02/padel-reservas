package com.g02.padel.user.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;

import static org.assertj.core.api.Assertions.assertThat;

/** Owner-side client bodies (docs/api.md#users--clients--apiv1users); users carry a single {@code name}. */
@JsonTest
class UserJsonTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Autowired
    private JacksonTester<CreateClientRequest> createJson;
    @Autowired
    private JacksonTester<UpdateClientRequest> updateJson;

    @Test
    void createBodyMirrorsRegistration() throws Exception {
        var request = createJson.parseObject("""
                { "name": "Ana López", "email": "ana@padel.test", "password": "s3cret-pass", "phone": "600000000" }
                """);

        assertThat(request).isEqualTo(new CreateClientRequest("Ana López", "ana@padel.test", "s3cret-pass", "600000000"));
        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void updateBodyIsPartial() throws Exception {
        var request = updateJson.parseObject("""
                { "phone": "600000000" }
                """);

        assertThat(request).isEqualTo(new UpdateClientRequest(null, null, "600000000"));
        assertThat(validator.validate(request)).isEmpty();
    }
}
