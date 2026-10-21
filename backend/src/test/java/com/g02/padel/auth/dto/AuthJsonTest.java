package com.g02.padel.auth.dto;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.dto.UserResponse;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;

import static org.assertj.core.api.Assertions.assertThat;

/** Shapes from docs/api.md#auth--apiv1auth. */
@JsonTest
class AuthJsonTest {

    private static final UserResponse USER = new UserResponse(42L, "Ana López", "ana@padel.test", null, Role.CLIENT);

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Autowired
    private JacksonTester<RegisterRequest> registerJson;
    @Autowired
    private JacksonTester<LoginResponse> loginJson;
    @Autowired
    private JacksonTester<RefreshTokenResponse> refreshJson;
    @Autowired
    private JacksonTester<UpdateProfileRequest> profileJson;

    @Test
    void registerBodyIsNameEmailPasswordAndOptionalPhone() throws Exception {
        var request = registerJson.parseObject("""
                { "name": "Ana López", "email": "ana@padel.test", "password": "s3cret-pass" }
                """);

        assertThat(request).isEqualTo(new RegisterRequest("Ana López", "ana@padel.test", "s3cret-pass", null));
        assertThat(validator.validate(request)).isEmpty();
        assertThat(validator.validate(new RegisterRequest(null, "ana@padel.test", "s3cret-pass", null)))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("name");
    }

    @Test
    void loginReturnsBothTokensAndTheUser() throws Exception {
        assertThat(loginJson.write(new LoginResponse("access", "refresh", USER))).isStrictlyEqualToJson("""
                {
                  "accessToken": "access",
                  "refreshToken": "refresh",
                  "user": { "id": 42, "name": "Ana López", "email": "ana@padel.test", "phone": null, "role": "CLIENT" }
                }
                """);
    }

    @Test
    void refreshReturnsOnlyANewAccessToken() throws Exception {
        assertThat(refreshJson.write(new RefreshTokenResponse("access"))).isStrictlyEqualToJson("""
                { "accessToken": "access" }
                """);
    }

    @Test
    void profileUpdateIsPartial() throws Exception {
        var request = profileJson.parseObject("""
                { "phone": "600000000" }
                """);

        assertThat(request).isEqualTo(new UpdateProfileRequest(null, "600000000"));
        assertThat(validator.validate(request)).isEmpty();
    }
}
