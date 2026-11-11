package com.g02.padel.user;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.g02.padel.shared.exception.ConflictException;
import com.g02.padel.shared.exception.NotFoundException;
import com.g02.padel.user.dto.ClientResponse;
import com.g02.padel.user.dto.CreateClientRequest;
import com.g02.padel.user.dto.UpdateClientRequest;
import com.g02.padel.user.usecase.CreateClientUseCase;
import com.g02.padel.user.usecase.DeleteClientUseCase;
import com.g02.padel.user.usecase.GetClientUseCase;
import com.g02.padel.user.usecase.ListClientBookingsUseCase;
import com.g02.padel.user.usecase.ListClientsUseCase;
import com.g02.padel.user.usecase.UpdateClientUseCase;
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
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** HTTP contract of /api/v1/users (docs/api.md#users--clients--apiv1users) with the use cases mocked. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "owner@padel.test", roles = "OWNER")
class UserControllerTest {

    private static final ClientResponse ANA = new ClientResponse(42L, "Ana López", "ana@padel.test", "600000000", true);
    private static final String CREATE_BODY = """
            { "name": "Ana López", "email": "ana@padel.test", "password": "s3cret-pass", "phone": "600000000" }
            """;

    @Autowired
    private MockMvc mvc;

    @MockBean
    private ListClientsUseCase listClients;
    @MockBean
    private GetClientUseCase getClient;
    @MockBean
    private CreateClientUseCase createClient;
    @MockBean
    private UpdateClientUseCase updateClient;
    @MockBean
    private DeleteClientUseCase deleteClient;
    @MockBean
    private ListClientBookingsUseCase listClientBookings;

    @Test
    void listsClientsWithSearchAndPagination() throws Exception {
        var pageable = PageRequest.of(1, 5, Sort.by("email"));
        when(listClients.execute("ana", pageable)).thenReturn(new PageImpl<>(List.of(ANA), pageable, 6));

        mvc.perform(get("/api/v1/users").param("search", "ana").param("page", "1").param("size", "5").param("sort", "email"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(42))
                .andExpect(jsonPath("$.content[0].active").value(true))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    void listsByNameWhenNoSortIsGiven() throws Exception {
        var pageable = PageRequest.of(0, 20, Sort.by("name"));
        when(listClients.execute(null, pageable)).thenReturn(new PageImpl<>(List.of(ANA), pageable, 1));

        mvc.perform(get("/api/v1/users")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(42));
    }

    @Test
    void getsAClientWithTheDocumentedShape() throws Exception {
        when(getClient.execute(42L)).thenReturn(ANA);

        mvc.perform(get("/api/v1/users/42"))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        { "id": 42, "name": "Ana López", "email": "ana@padel.test", "phone": "600000000", "active": true }
                        """, true));
    }

    @Test
    void answers404WithTheUniformErrorForAMissingClient() throws Exception {
        when(getClient.execute(99L)).thenThrow(NotFoundException.of("Client", 99L));

        mvc.perform(get("/api/v1/users/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Client 99 not found"))
                .andExpect(jsonPath("$.path").value("/api/v1/users/99"));
    }

    @Test
    void ownerCreatesAClient() throws Exception {
        when(createClient.execute(new CreateClientRequest("Ana López", "ana@padel.test", "s3cret-pass", "600000000")))
                .thenReturn(ANA);

        mvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON).content(CREATE_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.role").doesNotExist());
    }

    @Test
    void createValidatesTheBody() throws Exception {
        mvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": " ", "email": "nope", "password": "short" }
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
        verify(createClient, never()).execute(any());
    }

    @Test
    void createAnswers409ForADuplicateEmail() throws Exception {
        when(createClient.execute(any())).thenThrow(new ConflictException("Email ana@padel.test is already registered"));

        mvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON).content(CREATE_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Email ana@padel.test is already registered"));
    }

    @Test
    void ownerUpdatesAClientPartially() throws Exception {
        when(updateClient.execute(42L, new UpdateClientRequest(null, null, "611111111", null))).thenReturn(ANA);

        mvc.perform(patch("/api/v1/users/42").contentType(MediaType.APPLICATION_JSON).content("{ \"phone\": \"611111111\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42));
    }

    @Test
    void updateValidatesTheBody() throws Exception {
        mvc.perform(patch("/api/v1/users/42").contentType(MediaType.APPLICATION_JSON).content("""
                        { "name": "  ", "email": "nope" }
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists());
        verify(updateClient, never()).execute(any(), any());
    }

    @Test
    void updateAnswers409ForAnEmailInUseAnd404ForAMissingClient() throws Exception {
        when(updateClient.execute(eq(42L), any())).thenThrow(new ConflictException("Email bruno@padel.test is already registered"));
        when(updateClient.execute(eq(99L), any())).thenThrow(NotFoundException.of("Client", 99L));

        mvc.perform(patch("/api/v1/users/42").contentType(MediaType.APPLICATION_JSON).content("{ \"email\": \"bruno@padel.test\" }"))
                .andExpect(status().isConflict());
        mvc.perform(patch("/api/v1/users/99").contentType(MediaType.APPLICATION_JSON).content("{ \"phone\": \"6\" }"))
                .andExpect(status().isNotFound());
    }

    @Test
    void ownerDeletesAClient() throws Exception {
        mvc.perform(delete("/api/v1/users/42")).andExpect(status().isNoContent());
        verify(deleteClient).execute(42L);
    }

    @Test
    void deleteAnswers404ForAMissingClient() throws Exception {
        org.mockito.Mockito.doThrow(NotFoundException.of("Client", 99L)).when(deleteClient).execute(99L);

        mvc.perform(delete("/api/v1/users/99")).andExpect(status().isNotFound());
    }

    @Test
    void listsAClientsBookingsPaged() throws Exception {
        var pageable = PageRequest.of(1, 5);
        when(listClientBookings.execute(42L, pageable)).thenReturn(new PageImpl<>(List.of(), pageable, 6));

        mvc.perform(get("/api/v1/users/42/bookings").param("page", "1").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalElements").value(6));
    }

    @Test
    void clientBookingsAnswer404ForAnUnknownClient() throws Exception {
        when(listClientBookings.execute(eq(99L), any())).thenThrow(NotFoundException.of("Client", 99L));

        mvc.perform(get("/api/v1/users/99/bookings"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Client 99 not found"));
    }

    @Test
    @WithMockUser(username = "ana@padel.test", roles = "CLIENT")
    void aClientGets403OnEveryEndpoint() throws Exception {
        mvc.perform(get("/api/v1/users/42/bookings")).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/users")).andExpect(status().isForbidden()).andExpect(jsonPath("$.status").value(403));
        mvc.perform(get("/api/v1/users/42")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON).content(CREATE_BODY))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/users/42").contentType(MediaType.APPLICATION_JSON).content("{ \"phone\": \"6\" }"))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/users/42")).andExpect(status().isForbidden());

        verifyNoInteractions(listClients, getClient, createClient, updateClient, deleteClient, listClientBookings);
    }

    @Test
    @WithAnonymousUser
    void anonymousGets401() throws Exception {
        mvc.perform(get("/api/v1/users")).andExpect(status().isUnauthorized());
        verifyNoInteractions(listClients);
    }
}
