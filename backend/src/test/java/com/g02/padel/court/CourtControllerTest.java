package com.g02.padel.court;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.court.dto.CourtRequest;
import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.court.dto.UpdateCourtRequest;
import com.g02.padel.court.usecase.CreateCourtUseCase;
import com.g02.padel.court.usecase.DeactivateCourtUseCase;
import com.g02.padel.court.usecase.GetCourtUseCase;
import com.g02.padel.court.usecase.ListCourtsUseCase;
import com.g02.padel.court.usecase.UpdateCourtUseCase;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.shared.exception.NotFoundException;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** HTTP contract of /api/v1/courts (docs/api.md#courts--apiv1courts) with the use cases mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "owner@padel.test", roles = "OWNER")
class CourtControllerTest {

    private static final CourtResponse COURT_3 = new CourtResponse(3L, "Court 3", CourtType.GLASS, true, true);

    @Autowired
    private MockMvc mvc;

    @MockBean
    private ListCourtsUseCase listCourts;
    @MockBean
    private GetCourtUseCase getCourt;
    @MockBean
    private CreateCourtUseCase createCourt;
    @MockBean
    private UpdateCourtUseCase updateCourt;
    @MockBean
    private DeactivateCourtUseCase deactivateCourt;

    @Test
    void listsCourtsWithFiltersAndPagination() throws Exception {
        var pageable = PageRequest.of(1, 5, Sort.by("name"));
        when(listCourts.execute(CourtType.GLASS, true, pageable)).thenReturn(new PageImpl<>(List.of(COURT_3), pageable, 6));

        mvc.perform(get("/api/v1/courts").param("type", "GLASS").param("active", "true")
                        .param("page", "1").param("size", "5").param("sort", "name"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(3))
                .andExpect(jsonPath("$.content[0].type").value("GLASS"))
                .andExpect(jsonPath("$.content[0].indoor").value(true))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    void listsCourtsByIdWhenNoSortIsGiven() throws Exception {
        var pageable = PageRequest.of(0, 20, Sort.by("id"));
        when(listCourts.execute(null, null, pageable)).thenReturn(new PageImpl<>(List.of(COURT_3), pageable, 1));

        mvc.perform(get("/api/v1/courts")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(3));
    }

    @Test
    void rejectsAnUnknownTypeFilterWith400() throws Exception {
        mvc.perform(get("/api/v1/courts").param("type", "CLAY"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/api/v1/courts"));
    }

    @Test
    void getsACourt() throws Exception {
        when(getCourt.execute(3L)).thenReturn(COURT_3);

        mvc.perform(get("/api/v1/courts/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Court 3"));
    }

    @Test
    void answers404WithTheUniformErrorForAMissingCourt() throws Exception {
        when(getCourt.execute(99L)).thenThrow(NotFoundException.of("Court", 99L));

        mvc.perform(get("/api/v1/courts/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Court 99 not found"))
                .andExpect(jsonPath("$.path").value("/api/v1/courts/99"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void rejectsANonNumericIdWith400() throws Exception {
        mvc.perform(get("/api/v1/courts/abc")).andExpect(status().isBadRequest());
    }

    @Test
    void ownerCreatesACourt() throws Exception {
        when(createCourt.execute(new CourtRequest("Court 3", CourtType.GLASS, true, true))).thenReturn(COURT_3);

        mvc.perform(post("/api/v1/courts").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": "Court 3", "type": "GLASS", "indoor": true, "active": true }
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.name").value("Court 3"));
    }

    @Test
    void createValidatesTheBody() throws Exception {
        mvc.perform(post("/api/v1/courts").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": "  " }
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.type").exists())
                .andExpect(jsonPath("$.fieldErrors.indoor").exists());
        verify(createCourt, never()).execute(any());
    }

    @Test
    void createRejectsAnUnknownTypeWith400() throws Exception {
        mvc.perform(post("/api/v1/courts").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": "Court 9", "type": "CLAY", "indoor": false }
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        verify(createCourt, never()).execute(any());
    }

    @Test
    void createRejectsMalformedJsonWith400() throws Exception {
        mvc.perform(post("/api/v1/courts").contentType(MediaType.APPLICATION_JSON).content("{ not json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createAnswers409ForADuplicateName() throws Exception {
        when(createCourt.execute(any())).thenThrow(new ConflictException("Court name Court 3 is already in use"));

        mvc.perform(post("/api/v1/courts").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": "Court 3", "type": "GLASS", "indoor": true }
                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Court name Court 3 is already in use"));
    }

    @Test
    void ownerUpdatesACourtPartially() throws Exception {
        when(updateCourt.execute(3L, new UpdateCourtRequest(null, null, true, null))).thenReturn(COURT_3);

        mvc.perform(patch("/api/v1/courts/3").contentType(MediaType.APPLICATION_JSON).content("""
                        { "indoor": true }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.indoor").value(true));
    }

    @Test
    void updateRejectsABlankName() throws Exception {
        mvc.perform(patch("/api/v1/courts/3").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": "   " }
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists());
        verify(updateCourt, never()).execute(any(), any());
    }

    @Test
    void updateAnswers404ForAMissingCourt() throws Exception {
        when(updateCourt.execute(eq(99L), any())).thenThrow(NotFoundException.of("Court", 99L));

        mvc.perform(patch("/api/v1/courts/99").contentType(MediaType.APPLICATION_JSON).content("{ \"indoor\": true }"))
                .andExpect(status().isNotFound());
    }

    @Test
    void ownerDeletesACourt() throws Exception {
        mvc.perform(delete("/api/v1/courts/3")).andExpect(status().isNoContent());
        verify(deactivateCourt).execute(3L);
    }

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void clientCannotCreateUpdateOrDelete() throws Exception {
        mvc.perform(post("/api/v1/courts").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": "Court 9", "type": "GLASS", "indoor": true }
                        """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        mvc.perform(patch("/api/v1/courts/3").contentType(MediaType.APPLICATION_JSON).content("{ \"indoor\": true }"))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/courts/3")).andExpect(status().isForbidden());

        verify(createCourt, never()).execute(any());
        verify(updateCourt, never()).execute(any(), any());
        verify(deactivateCourt, never()).execute(any());
    }
}
