package com.g02.padel.courtblock.dto;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

/** Create body from docs/api.md#court-blocks-maintenance--apiv1courtsidblocks. */
@JsonTest
class CourtBlockJsonTest {

    @Autowired
    private JacksonTester<CourtBlockRequest> requestJson;
    @Autowired
    private JacksonTester<CourtBlockResponse> responseJson;

    @Test
    void createBodyIsDateStartEndReason() throws Exception {
        var request = requestJson.parseObject("""
                { "date": "2999-06-08", "start": "07:00", "end": "09:00", "reason": "Mantenimiento" }
                """);

        assertThat(request).isEqualTo(
                new CourtBlockRequest(LocalDate.of(2999, 6, 8), LocalTime.of(7, 0), LocalTime.of(9, 0), "Mantenimiento"));
    }

    @Test
    void serializesBlockWithTheSameFieldNames() throws Exception {
        var block = new CourtBlockResponse(9L, 3L, LocalDate.of(2999, 6, 8), LocalTime.of(7, 0), LocalTime.of(9, 0),
                "Mantenimiento");

        assertThat(responseJson.write(block)).isStrictlyEqualToJson("""
                { "id": 9, "courtId": 3, "date": "2999-06-08", "start": "07:00", "end": "09:00", "reason": "Mantenimiento" }
                """);
    }
}
