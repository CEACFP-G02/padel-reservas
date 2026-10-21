package com.g02.padel.booking.dto;

import com.g02.padel.shared.enums.BookingStatus;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Request/response shapes must match docs/api.md#bookings--apiv1bookings. */
@JsonTest
class BookingJsonTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Autowired
    private JacksonTester<BookingResponse> responseJson;

    @Autowired
    private JacksonTester<CreateBookingRequest> requestJson;

    @Test
    void serializesBookingResponse() throws Exception {
        var response = new BookingResponse(
                5001L, 3L, "Court 3", 42L, LocalDate.of(2026, 6, 8), BookingStatus.CONFIRMED,
                new BigDecimal("16.00"), Instant.parse("2026-05-30T10:15:00Z"),
                List.of(new BookingSlotResponse(LocalTime.of(7, 0), LocalTime.of(8, 0), new BigDecimal("16.00"))));

        assertThat(responseJson.write(response)).isStrictlyEqualToJson("""
                {
                  "id": 5001,
                  "courtId": 3,
                  "courtName": "Court 3",
                  "userId": 42,
                  "date": "2026-06-08",
                  "status": "CONFIRMED",
                  "totalPrice": 16.00,
                  "createdAt": "2026-05-30T10:15:00Z",
                  "slots": [ { "start": "07:00", "end": "08:00", "price": 16.00 } ]
                }
                """);
    }

    @Test
    void deserializesCreateBodyWithOptionalClientId() throws Exception {
        var request = requestJson.parseObject("""
                {
                  "courtId": 3,
                  "date": "2026-06-08",
                  "slots": [ { "start": "07:00", "end": "08:00" } ],
                  "clientId": 42
                }
                """);

        assertThat(request).isEqualTo(new CreateBookingRequest(
                3L, LocalDate.of(2026, 6, 8), List.of(new TimeSlotRequest(LocalTime.of(7, 0), LocalTime.of(8, 0))), 42L));
    }

    @Test
    void clientIdIsOptionalButCourtIdIsRequired() throws Exception {
        var withoutClientId = requestJson.parseObject("""
                { "courtId": 3, "date": "2999-06-08", "slots": [ { "start": "07:00", "end": "08:00" } ] }
                """);
        var withoutCourtId = requestJson.parseObject("""
                { "date": "2999-06-08", "slots": [ { "start": "07:00", "end": "08:00" } ] }
                """);

        assertThat(validator.validate(withoutClientId)).isEmpty();
        assertThat(validator.validate(withoutCourtId))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("courtId");
    }
}
