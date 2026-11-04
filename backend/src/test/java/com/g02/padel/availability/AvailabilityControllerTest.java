package com.g02.padel.availability;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.availability.dto.AlternativeDay;
import com.g02.padel.availability.dto.AvailabilityResponse;
import com.g02.padel.availability.dto.CourtDayAvailabilityResponse;
import com.g02.padel.availability.dto.CourtSlotResponse;
import com.g02.padel.availability.dto.SlotResponse;
import com.g02.padel.availability.usecase.GetAvailabilityUseCase;
import com.g02.padel.availability.usecase.GetCourtDayAvailabilityUseCase;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** HTTP contract of the availability endpoints (docs/api.md#availability--apiv1availability-), use cases mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "ana@padel.test", roles = "CLIENT")
class AvailabilityControllerTest {

    private static final LocalDate DATE = LocalDate.of(2026, 6, 8);

    @Autowired
    private MockMvc mvc;

    @MockBean
    private GetAvailabilityUseCase getAvailability;
    @MockBean
    private GetCourtDayAvailabilityUseCase getCourtDayAvailability;

    @Test
    void searchReturnsTheDocsShapeWithCourtIds() throws Exception {
        when(getAvailability.execute(DATE, 2)).thenReturn(new AvailabilityResponse(DATE, 2, true, List.of(
                new SlotResponse(LocalTime.of(7, 0), LocalTime.of(8, 0), 3, List.of(1L, 2L, 3L),
                        new BigDecimal("16.00")),
                new SlotResponse(LocalTime.of(8, 0), LocalTime.of(9, 0), 2, List.of(1L, 3L),
                        new BigDecimal("16.00"))), List.of()));

        mvc.perform(get("/api/v1/availability").param("date", "2026-06-08").param("courts", "2"))
                .andExpect(status().isOk())
                .andExpect(content().json("""
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
                        """, true));
    }

    @Test
    void searchReturnsNearbyDaysWhenTheDateIsFull() throws Exception {
        when(getAvailability.execute(DATE, 2)).thenReturn(new AvailabilityResponse(DATE, 2, false, List.of(),
                List.of(new AlternativeDay(DATE.plusDays(1), 5), new AlternativeDay(DATE.plusDays(2), 8))));

        mvc.perform(get("/api/v1/availability").param("date", "2026-06-08").param("courts", "2"))
                .andExpect(status().isOk())
                .andExpect(content().json("""
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
                        """, true));
    }

    @Test
    @WithMockUser(username = "owner@padel.test", roles = "OWNER")
    void courtsDefaultsToOneAndOwnersMaySearchToo() throws Exception {
        when(getAvailability.execute(DATE, 1)).thenReturn(new AvailabilityResponse(DATE, 1, false, List.of(), List.of()));

        mvc.perform(get("/api/v1/availability").param("date", "2026-06-08"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courtsRequested").value(1));
    }

    @Test
    void searchRuleViolationsAreBadRequest() throws Exception {
        when(getAvailability.execute(DATE, 0)).thenThrow(new IllegalArgumentException("courts must be at least 1"));

        mvc.perform(get("/api/v1/availability").param("date", "2026-06-08").param("courts", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("courts must be at least 1"))
                .andExpect(jsonPath("$.path").value("/api/v1/availability"));
    }

    @Test
    void searchWithoutDateIsBadRequest() throws Exception {
        mvc.perform(get("/api/v1/availability").param("courts", "2"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Missing required parameter 'date'"));
        verify(getAvailability, never()).execute(any(), anyInt());
    }

    @Test
    void searchWithMalformedParametersIsBadRequest() throws Exception {
        mvc.perform(get("/api/v1/availability").param("date", "08/06/2026"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        mvc.perform(get("/api/v1/availability").param("date", "2026-06-08").param("courts", "two"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithAnonymousUser
    void anonymousCallersAreUnauthorized() throws Exception {
        mvc.perform(get("/api/v1/availability").param("date", "2026-06-08")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/courts/3/availability").param("date", "2026-06-08"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "nobody@padel.test", roles = "GUEST")
    void callersWithoutAnAppRoleAreForbidden() throws Exception {
        mvc.perform(get("/api/v1/availability").param("date", "2026-06-08")).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/courts/3/availability").param("date", "2026-06-08"))
                .andExpect(status().isForbidden());
    }

    @Test
    void courtDayReturnsTheGridForTheCallersRole() throws Exception {
        when(getCourtDayAvailability.execute(3L, DATE, Role.CLIENT)).thenReturn(new CourtDayAvailabilityResponse(
                3L, "Court 3", DATE, List.of(
                        new CourtSlotResponse(LocalTime.of(7, 0), LocalTime.of(8, 0), false),
                        new CourtSlotResponse(LocalTime.of(8, 0), LocalTime.of(9, 0), true))));

        mvc.perform(get("/api/v1/courts/3/availability").param("date", "2026-06-08"))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        {
                          "courtId": 3,
                          "courtName": "Court 3",
                          "date": "2026-06-08",
                          "slots": [
                            { "start": "07:00", "end": "08:00", "available": false },
                            { "start": "08:00", "end": "09:00", "available": true }
                          ]
                        }
                        """, true));
    }

    @Test
    @WithMockUser(username = "owner@padel.test", roles = "OWNER")
    void courtDayPassesTheOwnerRole() throws Exception {
        when(getCourtDayAvailability.execute(3L, DATE, Role.OWNER))
                .thenReturn(new CourtDayAvailabilityResponse(3L, "Court 3", DATE, List.of()));

        mvc.perform(get("/api/v1/courts/3/availability").param("date", "2026-06-08"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slots").isEmpty());
    }

    @Test
    void courtDayOfAMissingOrHiddenCourtIsNotFound() throws Exception {
        when(getCourtDayAvailability.execute(9L, DATE, Role.CLIENT)).thenThrow(NotFoundException.of("Court", 9L));

        mvc.perform(get("/api/v1/courts/9/availability").param("date", "2026-06-08"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Court 9 not found"));
    }

    @Test
    void courtDayWithoutOrWithBadParametersIsBadRequest() throws Exception {
        mvc.perform(get("/api/v1/courts/3/availability")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Missing required parameter 'date'"));
        mvc.perform(get("/api/v1/courts/3/availability").param("date", "tomorrow"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/courts/abc/availability").param("date", "2026-06-08"))
                .andExpect(status().isBadRequest());
    }
}
