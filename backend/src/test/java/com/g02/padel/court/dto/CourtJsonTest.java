package com.g02.padel.court.dto;

import com.g02.padel.shared.enums.CourtType;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;

import static org.assertj.core.api.Assertions.assertThat;

/** Shapes from docs/api.md#courts--apiv1courts. */
@JsonTest
class CourtJsonTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Autowired
    private JacksonTester<CourtRequest> createJson;
    @Autowired
    private JacksonTester<UpdateCourtRequest> updateJson;
    @Autowired
    private JacksonTester<CourtResponse> responseJson;

    @Test
    void createBodyIsNameTypeIndoorActive() throws Exception {
        var request = createJson.parseObject("""
                { "name": "Court 3", "type": "GLASS", "indoor": true, "active": true }
                """);

        assertThat(request).isEqualTo(new CourtRequest("Court 3", CourtType.GLASS, true, true));
        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void updateBodyIsPartial() throws Exception {
        var request = updateJson.parseObject("""
                { "indoor": false }
                """);

        assertThat(request).isEqualTo(new UpdateCourtRequest(null, null, false, null));
        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void serializesCourt() throws Exception {
        assertThat(responseJson.write(new CourtResponse(3L, "Court 3", CourtType.WALL, false, true)))
                .isStrictlyEqualToJson("""
                        { "id": 3, "name": "Court 3", "type": "WALL", "indoor": false, "active": true }
                        """);
    }
}
