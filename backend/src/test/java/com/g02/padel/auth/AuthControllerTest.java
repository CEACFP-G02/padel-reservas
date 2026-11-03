package com.g02.padel.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.auth.dto.LoginRequest;
import com.g02.padel.auth.dto.LoginResponse;
import com.g02.padel.auth.dto.RefreshTokenRequest;
import com.g02.padel.auth.dto.RefreshTokenResponse;
import com.g02.padel.auth.dto.RegisterRequest;
import com.g02.padel.auth.usecase.GetCurrentUserUseCase;
import com.g02.padel.auth.usecase.LoginUseCase;
import com.g02.padel.auth.usecase.RefreshTokenUseCase;
import com.g02.padel.auth.usecase.RegisterClientUseCase;
import com.g02.padel.shared.enums.Role;
import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.user.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** HTTP contract of /api/v1/auth (docs/api.md#auth--apiv1auth) with the use cases mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    private static final UserResponse ANA = new UserResponse(42L, "Ana López", "ana@padel.test", null, Role.CLIENT);

    @Autowired
    private MockMvc mvc;

    @MockBean
    private RegisterClientUseCase registerClient;
    @MockBean
    private LoginUseCase login;
    @MockBean
    private RefreshTokenUseCase refreshToken;
    @MockBean
    private GetCurrentUserUseCase getCurrentUser;

    @Test
    void registerIsPublicAndReturns201WithTheUser() throws Exception {
        when(registerClient.execute(new RegisterRequest("Ana López", "ana@padel.test", "s3cret-pass", null)))
                .thenReturn(ANA);

        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": "Ana López", "email": "ana@padel.test", "password": "s3cret-pass" }
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.email").value("ana@padel.test"))
                .andExpect(jsonPath("$.role").value("CLIENT"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void registerValidatesTheBody() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": "", "email": "not-an-email", "password": "short" }
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
        verify(registerClient, never()).execute(any());
    }

    @Test
    void registerAnswers409ForADuplicateEmail() throws Exception {
        when(registerClient.execute(any())).thenThrow(new ConflictException("Email already registered"));

        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": "Ana", "email": "ana@padel.test", "password": "s3cret-pass" }
                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    void loginIsPublicAndReturnsTokensAndUser() throws Exception {
        when(login.execute(new LoginRequest("ana@padel.test", "s3cret-pass")))
                .thenReturn(new LoginResponse("access", "refresh", ANA));

        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                        { "email": "ana@padel.test", "password": "s3cret-pass" }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access"))
                .andExpect(jsonPath("$.refreshToken").value("refresh"))
                .andExpect(jsonPath("$.user.email").value("ana@padel.test"));
    }

    @Test
    void loginAnswers401WithAUniformErrorOnBadCredentials() throws Exception {
        when(login.execute(any())).thenThrow(new BadCredentialsException("Invalid email or password"));

        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                        { "email": "ana@padel.test", "password": "wrong" }
                        """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password"))
                .andExpect(jsonPath("$.path").value("/api/v1/auth/login"));
    }

    @Test
    void refreshIsPublicAndReturnsANewAccessToken() throws Exception {
        when(refreshToken.execute(new RefreshTokenRequest("refresh")))
                .thenReturn(new RefreshTokenResponse("new-access"));

        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON).content("""
                        { "refreshToken": "refresh" }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new-access"))
                .andExpect(jsonPath("$.refreshToken").doesNotExist());
    }

    @Test
    void refreshAnswers401ForAnInvalidToken() throws Exception {
        when(refreshToken.execute(any())).thenThrow(new BadCredentialsException("Invalid refresh token"));

        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON).content("""
                        { "refreshToken": "bad" }
                        """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        verify(getCurrentUser, never()).execute(any());
    }

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void meReturnsTheAuthenticatedUser() throws Exception {
        when(getCurrentUser.execute("ana@padel.test")).thenReturn(ANA);

        mvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ana@padel.test"))
                .andExpect(jsonPath("$.role").value("CLIENT"));
    }
}
