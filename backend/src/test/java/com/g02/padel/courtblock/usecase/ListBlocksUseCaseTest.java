package com.g02.padel.courtblock.usecase;

import static com.g02.padel.availability.AvailabilityFixtures.MONDAY;
import static com.g02.padel.availability.AvailabilityFixtures.block;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.courtblock.CourtBlockRepository;
import com.g02.padel.courtblock.dto.CourtBlockResponse;
import com.g02.padel.shared.enums.CourtType;
import com.g02.padel.shared.exception.NotFoundException;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/** Persistence slice: the court and date-range filters run as real queries. */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import(ListBlocksUseCase.class)
class ListBlocksUseCaseTest {

    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private CourtBlockRepository blockRepository;
    @Autowired
    private ListBlocksUseCase listBlocks;

    private Court court;

    @BeforeEach
    void setUp() {
        court = courtRepository.save(court());
        Court other = courtRepository.save(court());
        blockRepository.save(block(court, MONDAY.plusDays(2), "18:00", "19:00"));
        blockRepository.save(block(court, MONDAY, "10:00", "11:00"));
        blockRepository.save(block(court, MONDAY, "08:00", "09:00"));
        blockRepository.save(block(court, MONDAY.minusDays(30), "08:00", "09:00"));
        blockRepository.save(block(other, MONDAY, "08:00", "09:00"));
    }

    private static Court court() {
        var court = new Court();
        court.setName("Court " + UUID.randomUUID());
        court.setType(CourtType.GLASS);
        return court;
    }

    private String day(CourtBlockResponse block) {
        return block.date() + " " + block.start();
    }

    @Test
    void listsEveryBlockOfTheCourtByDateAndStart() {
        assertThat(listBlocks.execute(court.getId(), null, null)).map(this::day).containsExactly(
                MONDAY.minusDays(30) + " 08:00", MONDAY + " 08:00", MONDAY + " 10:00", MONDAY.plusDays(2) + " 18:00");
        assertThat(listBlocks.execute(court.getId(), null, null)).allMatch(b -> b.courtId().equals(court.getId()));
    }

    @Test
    void filtersByAnInclusiveDateRange() {
        assertThat(listBlocks.execute(court.getId(), MONDAY, MONDAY.plusDays(2))).map(this::day)
                .containsExactly(MONDAY + " 08:00", MONDAY + " 10:00", MONDAY.plusDays(2) + " 18:00");
        assertThat(listBlocks.execute(court.getId(), MONDAY, MONDAY)).hasSize(2);
    }

    @Test
    void eitherEndOfTheRangeIsOptional() {
        assertThat(listBlocks.execute(court.getId(), MONDAY.plusDays(1), null)).hasSize(1);
        assertThat(listBlocks.execute(court.getId(), null, MONDAY.minusDays(1))).hasSize(1);
    }

    @Test
    void rejectsFromAfterTo() {
        assertThatThrownBy(() -> listBlocks.execute(court.getId(), MONDAY, MONDAY.minusDays(1)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("from must not be after to");
    }

    @Test
    void throwsNotFoundForAMissingCourt() {
        assertThatThrownBy(() -> listBlocks.execute(987654L, null, null))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Court 987654 not found");
    }
}
