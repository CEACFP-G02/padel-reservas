package com.g02.padel.user;

import com.g02.padel.user.dto.CreateClientRequest;
import com.g02.padel.user.dto.UpdateClientRequest;
import com.g02.padel.user.dto.UserResponse;
import com.g02.padel.user.usecase.CreateClientUseCase;
import com.g02.padel.user.usecase.DeleteClientUseCase;
import com.g02.padel.user.usecase.GetClientUseCase;
import com.g02.padel.user.usecase.ListClientsUseCase;
import com.g02.padel.user.usecase.UpdateClientUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('OWNER')")
public class UserController {

    private final ListClientsUseCase listClients;
    private final GetClientUseCase getClient;
    private final CreateClientUseCase createClient;
    private final UpdateClientUseCase updateClient;
    private final DeleteClientUseCase deleteClient;

    public UserController(ListClientsUseCase listClients, GetClientUseCase getClient, CreateClientUseCase createClient,
                          UpdateClientUseCase updateClient, DeleteClientUseCase deleteClient) {
        this.listClients = listClients;
        this.getClient = getClient;
        this.createClient = createClient;
        this.updateClient = updateClient;
        this.deleteClient = deleteClient;
    }

    @GetMapping
    public List<UserResponse> list() {
        return listClients.execute();
    }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable Long id) {
        return getClient.execute(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody CreateClientRequest request) {
        return createClient.execute(request);
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UpdateClientRequest request) {
        return updateClient.execute(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        deleteClient.execute(id);
    }
}
