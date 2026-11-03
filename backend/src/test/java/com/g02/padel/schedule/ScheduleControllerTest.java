package com.g02.padel.schedule;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.schedule.dto.ScheduleResponse;
import com.g02.padel.schedule.dto.UpdateScheduleRequest;
import com.g02.padel.schedule.dto.WeekdayHours;
import com.g02.padel.schedule.usecase.GetScheduleUseCase;
import com.g02.padel.schedule.usecase.UpdateScheduleUseCase;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** HTTP contract of /api/v1/courts/{id}/schedule (docs/api.md#schedule--apiv1courtsidschedule), use cases mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "owner@padel.test", roles = "OWNER")
class ScheduleControllerTest {

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
    private static final ScheduleResponse SCHEDULE = new ScheduleResponse(60, new BigDecimal("16.00"), List.of(
            new WeekdayHours(DayOfWeek.MONDAY, LocalTime.of(8, 0), LocalTime.of(22, 0)),
            new WeekdayHours(DayOfWeek.SUNDAY, LocalTime.of(9, 0), LocalTime.of(14, 0))));

    @Autowired
    private MockMvc mvc;

    @MockBean
    private GetScheduleUseCase getSchedule;
    @MockBean
    private UpdateScheduleUseCase updateSchedule;

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void clientReadsTheScheduleInTheDocsShape() throws Exception {
        when(getSchedule.execute(3L, Role.CLIENT)).thenReturn(SCHEDULE);

        mvc.perform(get("/api/v1/courts/3/schedule"))
                .andExpect(status().isOk())
                .andExpect(content().json(DOCS_EXAMPLE, true));
    }

    @Test
    void ownerReadsTheScheduleWithTheOwnerRole() throws Exception {
        when(getSchedule.execute(3L, Role.OWNER)).thenReturn(SCHEDULE);

        mvc.perform(get("/api/v1/courts/3/schedule")).andExpect(status().isOk());
    }

    @Test
    @WithAnonymousUser
    void anonymousCannotReadTheSchedule() throws Exception {
        mvc.perform(get("/api/v1/courts/3/schedule")).andExpect(status().isUnauthorized());
    }

    @Test
    void answers404WithTheUniformErrorBody() throws Exception {
        when(getSchedule.execute(3L, Role.OWNER)).thenThrow(new NotFoundException("Schedule of court 3 not found"));

        mvc.perform(get("/api/v1/courts/3/schedule"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Schedule of court 3 not found"))
                .andExpect(jsonPath("$.path").value("/api/v1/courts/3/schedule"));
    }

    @Test
    void ownerReplacesTheSchedule() throws Exception {
        when(updateSchedule.execute(eq(3L), any())).thenReturn(SCHEDULE);

        mvc.perform(put("/api/v1/courts/3/schedule").contentType(MediaType.APPLICATION_JSON).content(DOCS_EXAMPLE))
                .andExpect(status().isOk())
                .andExpect(content().json(DOCS_EXAMPLE, true));
        verify(updateSchedule).execute(3L, new UpdateScheduleRequest(60, new BigDecimal("16.00"), SCHEDULE.weekdays()));
    }

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void clientCannotReplaceTheSchedule() throws Exception {
        mvc.perform(put("/api/v1/courts/3/schedule").contentType(MediaType.APPLICATION_JSON).content(DOCS_EXAMPLE))
                .andExpect(status().isForbidden());
        verify(updateSchedule, never()).execute(any(), any());
    }

    @Test
    void rejectsANegativePrice() throws Exception {
        putInvalid("""
                { "slotMinutes": 60, "price": -1.00, "weekdays": [] }
                """, "price");
    }

    @Test
    void rejectsAPriceWithMoreThanTwoDecimals() throws Exception {
        putInvalid("""
                { "slotMinutes": 60, "price": 16.005, "weekdays": [] }
                """, "price");
    }

    @Test
    void rejectsAPriceThatDoesNotFitDecimal8Scale2() throws Exception {
        putInvalid("""
                { "slotMinutes": 60, "price": 1000000.00, "weekdays": [] }
                """, "price");
    }

    @Test
    void rejectsAMissingPrice() throws Exception {
        putInvalid("""
                { "slotMinutes": 60, "weekdays": [] }
                """, "price");
    }

    @Test
    void rejectsAnAbsurdSlotLength() throws Exception {
        putInvalid("""
                { "slotMinutes": 5, "price": 16.00, "weekdays": [] }
                """, "slotMinutes");
        putInvalid("""
                { "slotMinutes": 600, "price": 16.00, "weekdays": [] }
                """, "slotMinutes");
    }

    @Test
    void rejectsAMissingDayOrTime() throws Exception {
        putInvalid("""
                { "slotMinutes": 60, "price": 16.00, "weekdays": [ { "open": "08:00", "close": "22:00" } ] }
                """, "weekdays[0].day");
        putInvalid("""
                { "slotMinutes": 60, "price": 16.00, "weekdays": [ { "day": "MONDAY", "open": "08:00" } ] }
                """, "weekdays[0].close");
    }

    @Test
    void rejectsMissingWeekdays() throws Exception {
        putInvalid("""
                { "slotMinutes": 60, "price": 16.00 }
                """, "weekdays");
    }

    @Test
    void rejectsAnImpossibleTimeOrDayWith400() throws Exception {
        mvc.perform(put("/api/v1/courts/3/schedule").contentType(MediaType.APPLICATION_JSON).content("""
                        { "slotMinutes": 60, "price": 16.00, "weekdays": [ { "day": "MONDAY", "open": "08:00", "close": "25:00" } ] }
                        """))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/v1/courts/3/schedule").contentType(MediaType.APPLICATION_JSON).content("""
                        { "slotMinutes": 60, "price": 16.00, "weekdays": [ { "day": "FUNDAY", "open": "08:00", "close": "22:00" } ] }
                        """))
                .andExpect(status().isBadRequest());
        verify(updateSchedule, never()).execute(any(), any());
    }

    @Test
    void reportsRangeRuleViolationsFromTheUseCaseAs400() throws Exception {
        when(updateSchedule.execute(eq(3L), any()))
                .thenThrow(new IllegalArgumentException("MONDAY 22:00-08:00: close must be after open"));

        mvc.perform(put("/api/v1/courts/3/schedule").contentType(MediaType.APPLICATION_JSON).content(DOCS_EXAMPLE))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("MONDAY 22:00-08:00: close must be after open"));
    }

    private void putInvalid(String body, String field) throws Exception {
        mvc.perform(put("/api/v1/courts/3/schedule").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors['" + field + "']").exists());
        verify(updateSchedule, never()).execute(any(), any());
    }
}
