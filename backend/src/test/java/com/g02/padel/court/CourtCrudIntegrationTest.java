package com.g02.padel.court;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Create → get → patch → delete (deactivate) through the real use cases and database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(username = "owner@padel.test", roles = "OWNER")
class CourtCrudIntegrationTest {

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper json;

    @Test
    void ownerManagesACourtThroughItsLifecycle() throws Exception {
        String name = "Court " + UUID.randomUUID();
        String created = mvc.perform(post("/api/v1/courts").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"name\": \"" + name + "\", \"type\": \"GLASS\", \"indoor\": false }"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.active").value(true))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(created).get("id").asLong();

        mvc.perform(get("/api/v1/courts/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(name))
                .andExpect(jsonPath("$.type").value("GLASS"))
                .andExpect(jsonPath("$.indoor").value(false));

        mvc.perform(patch("/api/v1/courts/" + id).contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"type\": \"WALL\", \"indoor\": true }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(name))
                .andExpect(jsonPath("$.type").value("WALL"))
                .andExpect(jsonPath("$.indoor").value(true));

        mvc.perform(delete("/api/v1/courts/" + id)).andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/courts/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void creatingTwoCourtsWithTheSameNameIsAConflict() throws Exception {
        String body = "{ \"name\": \"Court " + UUID.randomUUID() + "\", \"type\": \"WALL\", \"indoor\": true }";
        mvc.perform(post("/api/v1/courts").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());

        mvc.perform(post("/api/v1/courts").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void operationsOnAMissingCourtAre404() throws Exception {
        mvc.perform(get("/api/v1/courts/987654")).andExpect(status().isNotFound());
        mvc.perform(patch("/api/v1/courts/987654").contentType(MediaType.APPLICATION_JSON).content("{ \"indoor\": true }"))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/courts/987654")).andExpect(status().isNotFound());
    }
}
