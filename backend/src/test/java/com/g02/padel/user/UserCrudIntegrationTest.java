package com.g02.padel.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.g02.padel.shared.enums.Role;
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

/** Create → get → patch → delete through the real use cases and database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(username = "owner@padel.test", roles = "OWNER")
class UserCrudIntegrationTest {

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper json;
    @Autowired
    private UserRepository userRepository;

    @Test
    void ownerManagesAClientThroughItsLifecycle() throws Exception {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        String created = mvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": "Ana %s", "email": "Ana.%s@Padel.test", "password": "s3cret-pass", "role": "OWNER" }
                        """.formatted(tag, tag)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("ana." + tag + "@padel.test"))
                .andExpect(jsonPath("$.phone").isEmpty())
                .andExpect(jsonPath("$.active").value(true))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(created).get("id").asLong();
        org.assertj.core.api.Assertions.assertThat(userRepository.findById(id).orElseThrow().getRole()).isEqualTo(Role.CLIENT);

        mvc.perform(get("/api/v1/users").param("search", tag))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(id));

        mvc.perform(patch("/api/v1/users/" + id).contentType(MediaType.APPLICATION_JSON).content("{ \"phone\": \"600000000\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ana " + tag))
                .andExpect(jsonPath("$.phone").value("600000000"));

        mvc.perform(delete("/api/v1/users/" + id)).andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/users/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void creatingTwoClientsWithTheSameEmailIsAConflict() throws Exception {
        String body = """
                { "name": "Ana", "email": "dup.%s@padel.test", "password": "s3cret-pass" }
                """.formatted(UUID.randomUUID());
        mvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated());

        mvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON).content(body.replace("dup.", "DUP.")))
                .andExpect(status().isConflict());
    }

    @Test
    void ownerAccountsAreNotClients() throws Exception {
        var owner = new User();
        owner.setName("Olga");
        owner.setEmail("olga." + UUID.randomUUID() + "@padel.test");
        owner.setPasswordHash("$2a$hash");
        owner.setRole(Role.OWNER);
        long id = userRepository.save(owner).getId();

        mvc.perform(get("/api/v1/users/" + id)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/users/" + id)).andExpect(status().isNotFound());
    }
}
