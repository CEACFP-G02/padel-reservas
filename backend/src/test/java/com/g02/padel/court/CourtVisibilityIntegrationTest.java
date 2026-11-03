package com.g02.padel.court;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.shared.enums.CourtType;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** docs/api.md#courts--apiv1courts: CLIENT sees active courts only; OWNER sees all. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CourtVisibilityIntegrationTest {

    @Autowired
    private MockMvc mvc;
    @Autowired
    private CourtRepository courtRepository;

    private Long activeId;
    private Long inactiveId;

    @BeforeEach
    void setUp() {
        courtRepository.deleteAllInBatch();
        activeId = courtRepository.save(court("Visible court", true)).getId();
        inactiveId = courtRepository.save(court("Hidden court", false)).getId();
    }

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void clientListsOnlyActiveCourts() throws Exception {
        mvc.perform(get("/api/v1/courts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[*].name", Matchers.contains("Visible court")));
    }

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void clientCannotRevealInactiveCourtsWithTheActiveFilter() throws Exception {
        mvc.perform(get("/api/v1/courts").param("active", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void clientGets404ForAnInactiveCourt() throws Exception {
        mvc.perform(get("/api/v1/courts/" + activeId)).andExpect(status().isOk());
        mvc.perform(get("/api/v1/courts/" + inactiveId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Court " + inactiveId + " not found"));
    }

    @Test
    @WithMockUser(username = "owner@padel.test", roles = "OWNER")
    void ownerListsAndGetsActiveAndInactiveCourts() throws Exception {
        mvc.perform(get("/api/v1/courts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/v1/courts").param("active", "false"))
                .andExpect(jsonPath("$.content[*].name", Matchers.contains("Hidden court")));
        mvc.perform(get("/api/v1/courts/" + inactiveId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    private static Court court(String name, boolean active) {
        var court = new Court();
        court.setName(name);
        court.setType(CourtType.GLASS);
        court.setIndoor(false);
        court.setActive(active);
        return court;
    }
}
