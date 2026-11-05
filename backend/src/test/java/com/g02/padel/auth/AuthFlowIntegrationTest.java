package com.g02.padel.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.UserRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** Register → login → me → refresh → me, end to end on the real use cases, JWT and database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper json;
    @Autowired
    private UserRepository userRepository;

    @Test
    void aVisitorRegistersLogsInAndUsesTheTokens() throws Exception {
        String email = uniqueEmail();
        register(email, "{}").andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("CLIENT"));

        JsonNode tokens = login(email, "s3cret-pass");
        String accessToken = tokens.get("accessToken").asText();
        assertThat(tokens.get("user").get("email").asText()).isEqualTo(email);

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("CLIENT"));

        String refreshed = body(mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(java.util.Map.of(
                                "refreshToken", tokens.get("refreshToken").asText()))))
                .andExpect(status().isOk())).get("accessToken").asText();

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + refreshed))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void selfRegistrationCannotCreateAnOwner() throws Exception {
        String email = uniqueEmail();

        register(email, "{ \"role\": \"OWNER\" }")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("CLIENT"));

        assertThat(userRepository.findByEmail(email)).hasValueSatisfying(u -> {
            assertThat(u.getRole()).isEqualTo(Role.CLIENT);
            assertThat(u.getPasswordHash()).startsWith("$2").isNotEqualTo("s3cret-pass");
        });
    }

    @Test
    void registeringTheSameEmailTwiceIsAConflict() throws Exception {
        String email = uniqueEmail();
        register(email, "{}").andExpect(status().isCreated());

        register(email.toUpperCase(), "{}").andExpect(status().isConflict());
    }

    @Test
    void loginWithAWrongPasswordIs401() throws Exception {
        String email = uniqueEmail();
        register(email, "{}").andExpect(status().isCreated());

        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"email\": \"" + email + "\", \"password\": \"wrong-pass\" }"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void aRefreshTokenIsNotAcceptedAsBearer() throws Exception {
        String email = uniqueEmail();
        register(email, "{}").andExpect(status().isCreated());
        String refreshToken = login(email, "s3cret-pass").get("refreshToken").asText();

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + refreshToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void aMalformedBearerTokenIs401() throws Exception {
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    private org.springframework.test.web.servlet.ResultActions register(String email, String extra) throws Exception {
        var body = (com.fasterxml.jackson.databind.node.ObjectNode) json.readTree(extra);
        body.put("name", "Ana López").put("email", email).put("password", "s3cret-pass");
        return mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(body.toString()));
    }

    private JsonNode login(String email, String password) throws Exception {
        return body(mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"email\": \"" + email + "\", \"password\": \"" + password + "\" }"))
                .andExpect(status().isOk()));
    }

    private JsonNode body(org.springframework.test.web.servlet.ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString());
    }

    private static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@padel.test";
    }
}
