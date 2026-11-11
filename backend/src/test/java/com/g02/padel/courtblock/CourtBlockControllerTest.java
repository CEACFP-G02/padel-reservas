package com.g02.padel.courtblock;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.courtblock.dto.CourtBlockRequest;
import com.g02.padel.courtblock.dto.CourtBlockResponse;
import com.g02.padel.courtblock.usecase.CreateBlockUseCase;
import com.g02.padel.courtblock.usecase.ListBlocksUseCase;
import com.g02.padel.courtblock.usecase.RemoveBlockUseCase;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.shared.exception.NotFoundException;
import java.time.LocalDate;
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

/** HTTP contract of court blocks (docs/api.md#court-blocks-maintenance--apiv1courtsidblocks), use cases mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "owner@padel.test", roles = "OWNER")
class CourtBlockControllerTest {

    private static final LocalDate DAY = LocalDate.of(2026, 6, 9);
    private static final CourtBlockResponse BLOCK =
            new CourtBlockResponse(9L, 3L, DAY, LocalTime.of(7, 0), LocalTime.of(9, 0), "Mantenimiento");
    private static final String BODY = """
            { "date": "2026-06-09", "start": "07:00", "end": "09:00", "reason": "Mantenimiento" }
            """;

    @Autowired
    private MockMvc mvc;

    @MockBean
    private ListBlocksUseCase listBlocks;
    @MockBean
    private CreateBlockUseCase createBlock;
    @MockBean
    private RemoveBlockUseCase removeBlock;

    @Test
    void listsTheBlocksOfACourtInADateRange() throws Exception {
        when(listBlocks.execute(3L, DAY, DAY.plusDays(6))).thenReturn(List.of(BLOCK));

        mvc.perform(get("/api/v1/courts/3/blocks").param("from", "2026-06-09").param("to", "2026-06-15"))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        [ { "id": 9, "courtId": 3, "date": "2026-06-09", "start": "07:00", "end": "09:00",
                            "reason": "Mantenimiento" } ]
                        """, true));
    }

    @Test
    void listsEveryBlockWithoutARange() throws Exception {
        when(listBlocks.execute(3L, null, null)).thenReturn(List.of());

        mvc.perform(get("/api/v1/courts/3/blocks")).andExpect(status().isOk()).andExpect(content().json("[]"));
    }

    @Test
    void listAnswers400ForAMalformedDateAndAnInvertedRange() throws Exception {
        when(listBlocks.execute(3L, DAY, DAY.minusDays(1))).thenThrow(new IllegalArgumentException("from must not be after to"));

        mvc.perform(get("/api/v1/courts/3/blocks").param("from", "nope")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/courts/3/blocks").param("from", "2026-06-09").param("to", "2026-06-08"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("from must not be after to"));
    }

    @Test
    void listAnswers404ForAMissingCourt() throws Exception {
        when(listBlocks.execute(99L, null, null)).thenThrow(NotFoundException.of("Court", 99L));

        mvc.perform(get("/api/v1/courts/99/blocks")).andExpect(status().isNotFound());
    }

    @Test
    void ownerCreatesABlock() throws Exception {
        when(createBlock.execute(3L, new CourtBlockRequest(DAY, LocalTime.of(7, 0), LocalTime.of(9, 0), "Mantenimiento")))
                .thenReturn(BLOCK);

        mvc.perform(post("/api/v1/courts/3/blocks").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(9))
                .andExpect(jsonPath("$.start").value("07:00"));
    }

    @Test
    void createValidatesTheBody() throws Exception {
        mvc.perform(post("/api/v1/courts/3/blocks").contentType(MediaType.APPLICATION_JSON).content("""
                        { "reason": "%s" }
                        """.formatted("x".repeat(256))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.date").exists())
                .andExpect(jsonPath("$.fieldErrors.start").exists())
                .andExpect(jsonPath("$.fieldErrors.end").exists())
                .andExpect(jsonPath("$.fieldErrors.reason").exists());
        mvc.perform(post("/api/v1/courts/3/blocks").contentType(MediaType.APPLICATION_JSON).content("""
                        { "date": "2026-06-09", "start": "7h", "end": "09:00" }
                        """))
                .andExpect(status().isBadRequest());
        verify(createBlock, never()).execute(any(), any());
    }

    @Test
    void createAnswers400ForAnInvalidOrPastRange() throws Exception {
        when(createBlock.execute(eq(3L), any())).thenThrow(new IllegalArgumentException("Block end must be after its start"));

        mvc.perform(post("/api/v1/courts/3/blocks").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Block end must be after its start"));
    }

    @Test
    void createAnswers409WhenTheBlockCoversAConfirmedBooking() throws Exception {
        when(createBlock.execute(eq(3L), any()))
                .thenThrow(new ConflictException("Block 07:00-09:00 overlaps booking 5001 (08:00-09:00) on court 3"));

        mvc.perform(post("/api/v1/courts/3/blocks").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Block 07:00-09:00 overlaps booking 5001 (08:00-09:00) on court 3"));
    }

    @Test
    void createAnswers404ForAMissingCourt() throws Exception {
        when(createBlock.execute(eq(99L), any())).thenThrow(NotFoundException.of("Court", 99L));

        mvc.perform(post("/api/v1/courts/99/blocks").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isNotFound());
    }

    @Test
    void ownerRemovesABlock() throws Exception {
        mvc.perform(delete("/api/v1/court-blocks/9")).andExpect(status().isNoContent());
        verify(removeBlock).execute(9L);
    }

    @Test
    void removeAnswers404ForAMissingBlock() throws Exception {
        doThrow(NotFoundException.of("Court block", 99L)).when(removeBlock).execute(99L);

        mvc.perform(delete("/api/v1/court-blocks/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Court block 99 not found"));
    }

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void aClientGets403OnEveryEndpoint() throws Exception {
        mvc.perform(get("/api/v1/courts/3/blocks")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/courts/3/blocks").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/court-blocks/9")).andExpect(status().isForbidden());

        verifyNoInteractions(listBlocks, createBlock, removeBlock);
    }

    @Test
    @WithAnonymousUser
    void anonymousGets401() throws Exception {
        mvc.perform(get("/api/v1/courts/3/blocks")).andExpect(status().isUnauthorized());
        verifyNoInteractions(listBlocks);
    }
}
