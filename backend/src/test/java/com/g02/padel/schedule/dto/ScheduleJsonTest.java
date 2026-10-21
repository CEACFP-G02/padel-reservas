package com.g02.padel.schedule.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Schedule body from docs/api.md#schedule--apiv1courtsidschedule (same shape for GET and PUT). */
@JsonTest
class ScheduleJsonTest {

    private static final String DOCS_EXAMPLE = """
            {
              "slotMinutes": 60,
              "price": 16.00,
              "weekdays": [
                { "day": "MONDAY", "open": "08:00", "close": "22:00" },
                { "day": "SUNDAY", "open": "09:00", "close": "14:00" }
              ]
            }
            """;

    private static final List<WeekdayHours> WEEKDAYS = List.of(
            new WeekdayHours(DayOfWeek.MONDAY, LocalTime.of(8, 0), LocalTime.of(22, 0)),
            new WeekdayHours(DayOfWeek.SUNDAY, LocalTime.of(9, 0), LocalTime.of(14, 0)));

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Autowired
    private JacksonTester<UpdateScheduleRequest> requestJson;
    @Autowired
    private JacksonTester<ScheduleResponse> responseJson;

    @Test
    void parsesTheDocsExampleAsAReplaceBody() throws Exception {
        var request = requestJson.parseObject(DOCS_EXAMPLE);

        assertThat(request).isEqualTo(new UpdateScheduleRequest(60, new BigDecimal("16.00"), WEEKDAYS));
        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void serializesTheScheduleInTheSameShape() throws Exception {
        assertThat(responseJson.write(new ScheduleResponse(60, new BigDecimal("16.00"), WEEKDAYS)))
                .isStrictlyEqualToJson(DOCS_EXAMPLE);
    }
}
