package com.g02.padel.court.usecase;

import static com.g02.padel.court.usecase.CourtFixtures.court;
import static org.assertj.core.api.Assertions.assertThat;

import com.g02.padel.court.CourtRepository;
import com.g02.padel.court.dto.CourtResponse;
import com.g02.padel.shared.enums.CourtType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

/** Persistence slice: the filters and paging run as real queries against the Flyway schema. */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import(ListCourtsUseCase.class)
class ListCourtsUseCaseTest {

    private static final PageRequest BY_NAME = PageRequest.of(0, 20, Sort.by("name"));

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private ListCourtsUseCase listCourts;

    @BeforeEach
    void setUp() {
        courtRepository.deleteAllInBatch();
        courtRepository.save(court(null, "A glass indoor", CourtType.GLASS, true, true));
        courtRepository.save(court(null, "B glass outdoor", CourtType.GLASS, false, true));
        courtRepository.save(court(null, "C wall", CourtType.WALL, false, true));
        courtRepository.save(court(null, "D glass inactive", CourtType.GLASS, false, false));
    }

    @Test
    void listsEveryCourtWithoutFilters() {
        assertThat(listCourts.execute(null, null, BY_NAME).map(CourtResponse::name))
                .containsExactly("A glass indoor", "B glass outdoor", "C wall", "D glass inactive");
    }

    @Test
    void filtersByType() {
        assertThat(listCourts.execute(CourtType.WALL, null, BY_NAME).map(CourtResponse::name))
                .containsExactly("C wall");
    }

    @Test
    void filtersByActive() {
        assertThat(listCourts.execute(null, false, BY_NAME).map(CourtResponse::name))
                .containsExactly("D glass inactive");
    }

    @Test
    void combinesFilters() {
        assertThat(listCourts.execute(CourtType.GLASS, true, BY_NAME).map(CourtResponse::name))
                .containsExactly("A glass indoor", "B glass outdoor");
    }

    @Test
    void pagesTheResult() {
        var page = listCourts.execute(null, null, PageRequest.of(1, 3, Sort.by("name")));

        assertThat(page.getTotalElements()).isEqualTo(4);
        assertThat(page.getTotalPages()).isEqualTo(2);
        assertThat(page.map(CourtResponse::name)).containsExactly("D glass inactive");
    }
}
