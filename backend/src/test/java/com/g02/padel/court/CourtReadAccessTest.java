package com.g02.padel.court;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.court.usecase.GetCourtUseCase;
import com.g02.padel.court.usecase.ListCourtsUseCase;
import com.g02.padel.shared.enums.CourtType;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** GET /courts and /courts/{id} are for authenticated OWNER and CLIENT users only (docs/api.md#courts--apiv1courts). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CourtReadAccessTest {

    private static final CourtResponse COURT_3 = new CourtResponse(3L, "Court 3", CourtType.GLASS, true, true);

    @Autowired
    private MockMvc mvc;

    @MockBean
    private ListCourtsUseCase listCourts;
    @MockBean
    private GetCourtUseCase getCourt;

    @BeforeEach
    void setUp() {
        when(listCourts.execute(any(), any(), any(), any())).thenReturn(new PageImpl<>(List.of(COURT_3)));
        when(getCourt.execute(eq(3L), any())).thenReturn(COURT_3);
    }

    @Test
    @WithAnonymousUser
    void anonymousCannotListCourts() throws Exception {
        mvc.perform(get("/api/v1/courts")).andExpect(status().isUnauthorized());
        verify(listCourts, never()).execute(any(), any(), any(), any());
    }

    @Test
    @WithAnonymousUser
    void anonymousCannotReadACourt() throws Exception {
        mvc.perform(get("/api/v1/courts/3")).andExpect(status().isUnauthorized());
        verify(getCourt, never()).execute(any(), any());
    }

    @Test
    void anInvalidBearerTokenCannotReadCourts() throws Exception {
        mvc.perform(get("/api/v1/courts").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void clientCanListAndReadCourts() throws Exception {
        mvc.perform(get("/api/v1/courts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Court 3"));
        mvc.perform(get("/api/v1/courts/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3));
    }

    @Test
    @WithMockUser(username = "owner@padel.test", roles = "OWNER")
    void ownerCanListAndReadCourts() throws Exception {
        mvc.perform(get("/api/v1/courts")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/courts/3")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "someone@padel.test", roles = "GUEST")
    void anAuthenticatedUserWithoutOwnerOrClientRoleIsForbidden() throws Exception {
        mvc.perform(get("/api/v1/courts")).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/courts/3")).andExpect(status().isForbidden());
    }
}
