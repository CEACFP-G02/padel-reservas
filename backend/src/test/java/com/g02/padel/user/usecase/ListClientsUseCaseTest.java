package com.g02.padel.user.usecase;

import static com.g02.padel.user.usecase.UserFixtures.client;
import static com.g02.padel.user.usecase.UserFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;

import com.g02.padel.shared.enums.Role;
import com.g02.padel.user.UserRepository;
import com.g02.padel.user.dto.ClientResponse;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

/**
 * Persistence slice: the client filter and the search run as real queries. Every row carries a random tag in
 * its email so the assertions only see this test's users, whatever else the shared database holds.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import(ListClientsUseCase.class)
class ListClientsUseCaseTest {

    private static final PageRequest BY_NAME = PageRequest.of(0, 20, Sort.by("name"));

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListClientsUseCase listClients;

    private String tag;

    @BeforeEach
    void setUp() {
        tag = UUID.randomUUID().toString().substring(0, 8);
        userRepository.save(client(null, "Carla Ruiz", "carla." + tag + "@padel.test", "611222333", true));
        userRepository.save(client(null, "Ana López", "ana." + tag + "@padel.test", "600000000", true));
        userRepository.save(client(null, "Bruno Gil", "bruno." + tag + "@padel.test", null, false));
        userRepository.save(user(null, "Olga Owner", "owner." + tag + "@padel.test", null, Role.OWNER, true));
    }

    @Test
    void listsActiveAndInactiveClientsButNeverOwners() {
        assertThat(listClients.execute(tag, BY_NAME).map(ClientResponse::name))
                .containsExactly("Ana López", "Bruno Gil", "Carla Ruiz");
    }

    @Test
    void mapsTheClientFields() {
        var bruno = listClients.execute("bruno." + tag, BY_NAME).getContent();

        assertThat(bruno).singleElement().satisfies(client -> {
            assertThat(client.id()).isNotNull();
            assertThat(client.email()).isEqualTo("bruno." + tag + "@padel.test");
            assertThat(client.phone()).isNull();
            assertThat(client.active()).isFalse();
        });
    }

    @Test
    void searchesByNameIgnoringCase() {
        assertThat(listClients.execute("LÓPEZ", BY_NAME).map(ClientResponse::email))
                .contains("ana." + tag + "@padel.test")
                .noneMatch(email -> email.startsWith("carla." + tag));
    }

    @Test
    void searchesByEmail() {
        assertThat(listClients.execute("carla." + tag.toUpperCase(), BY_NAME).map(ClientResponse::name))
                .containsExactly("Carla Ruiz");
    }

    @Test
    void searchesByPhone() {
        assertThat(listClients.execute("1222", BY_NAME).map(ClientResponse::email))
                .contains("carla." + tag + "@padel.test");
    }

    @Test
    void aBlankSearchListsEveryClient() {
        var all = listClients.execute("  ", PageRequest.of(0, 1000, Sort.by("name"))).map(ClientResponse::email);

        assertThat(all).contains("ana." + tag + "@padel.test", "bruno." + tag + "@padel.test")
                .doesNotContain("owner." + tag + "@padel.test");
    }

    @Test
    void pagesTheResult() {
        var page = listClients.execute(tag, PageRequest.of(1, 2, Sort.by("name")));

        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getTotalPages()).isEqualTo(2);
        assertThat(page.map(ClientResponse::name)).containsExactly("Carla Ruiz");
    }
}
