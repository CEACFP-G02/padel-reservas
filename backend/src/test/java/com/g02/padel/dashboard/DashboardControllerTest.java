package com.g02.padel.dashboard;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.dashboard.dto.DashboardSummaryResponse;
import com.g02.padel.dashboard.usecase.GetDashboardSummaryUseCase;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** HTTP contract of GET /api/v1/dashboard/summary (docs/api.md#dashboard--apiv1dashboard), use case mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "owner@padel.test", roles = "OWNER")
class DashboardControllerTest {

    private static final String DOCS_EXAMPLE = """
            {
              "date": "2026-06-08",
              "activeCourts": 4,
              "bookingsToday": 12,
              "upcomingBookings": 37,
              "occupancyRate": 41.7,
              "revenueToday": 192.00
            }
            """;

    @Autowired
    private MockMvc mvc;

    @MockBean
    private GetDashboardSummaryUseCase getDashboardSummary;

    @Test
    void ownerGetsTheSummaryInTheDocsShape() throws Exception {
        when(getDashboardSummary.execute()).thenReturn(new DashboardSummaryResponse(
                LocalDate.of(2026, 6, 8), 4, 12, 37, new BigDecimal("41.7"), new BigDecimal("192.00")));

        mvc.perform(get("/api/v1/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(content().json(DOCS_EXAMPLE, true));
    }

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void clientIsForbidden() throws Exception {
        mvc.perform(get("/api/v1/dashboard/summary"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.path").value("/api/v1/dashboard/summary"));
        verify(getDashboardSummary, never()).execute();
    }

    @Test
    @WithAnonymousUser
    void anonymousIsUnauthorized() throws Exception {
        mvc.perform(get("/api/v1/dashboard/summary")).andExpect(status().isUnauthorized());
        verify(getDashboardSummary, never()).execute();
    }
}
