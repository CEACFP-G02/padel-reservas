package com.g02.padel.availability.dto;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Serialized shape must match docs/api.md#availability--apiv1availability-. */
@JsonTest
class AvailabilityResponseJsonTest {

    @Autowired
    private JacksonTester<AvailabilityResponse> json;

    @Test
    void serializesFreeSlotsWithTheirCourtIds() throws Exception {
        var response = new AvailabilityResponse(
                LocalDate.of(2026, 6, 8), 2, true,
                List.of(
                        new SlotResponse(LocalTime.of(7, 0), LocalTime.of(8, 0), 3, List.of(1L, 2L, 3L),
                                new BigDecimal("16.00")),
                        new SlotResponse(LocalTime.of(8, 0), LocalTime.of(9, 0), 2, List.of(1L, 3L),
                                new BigDecimal("16.00"))),
                List.of());

        assertThat(json.write(response)).isStrictlyEqualToJson("""
                {
                  "requestedDate": "2026-06-08",
                  "courtsRequested": 2,
                  "available": true,
                  "slots": [
                    { "start": "07:00", "end": "08:00", "courtsFree": 3, "courtIds": [1, 2, 3], "price": 16.00 },
                    { "start": "08:00", "end": "09:00", "courtsFree": 2, "courtIds": [1, 3], "price": 16.00 }
                  ],
                  "alternativeDays": []
                }
                """);
    }

    @Test
    void serializesAlternativeDaysWhenTheDayIsFull() throws Exception {
        var response = new AvailabilityResponse(
                LocalDate.of(2026, 6, 8), 2, false, List.of(),
                List.of(new AlternativeDay(LocalDate.of(2026, 6, 9), 5),
                        new AlternativeDay(LocalDate.of(2026, 6, 10), 8)));

        assertThat(json.write(response)).isStrictlyEqualToJson("""
                {
                  "requestedDate": "2026-06-08",
                  "courtsRequested": 2,
                  "available": false,
                  "slots": [],
                  "alternativeDays": [
                    { "date": "2026-06-09", "freeSlotCount": 5 },
                    { "date": "2026-06-10", "freeSlotCount": 8 }
                  ]
                }
                """);
    }
}
