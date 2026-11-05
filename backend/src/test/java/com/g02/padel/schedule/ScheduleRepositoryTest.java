package com.g02.padel.schedule;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.g02.padel.court.Court;
import com.g02.padel.court.CourtRepository;
import com.g02.padel.shared.enums.CourtType;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

/** Persistence slice: Schedule 1:1 Court, OpeningHours cascade/orphan removal and the money column. */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class ScheduleRepositoryTest {

    @Autowired
    private ScheduleRepository scheduleRepository;
    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private EntityManager em;
    @Autowired
    private JdbcTemplate jdbc;

    private Court court;

    @BeforeEach
    void setUp() {
        court = new Court();
        court.setName("Court " + UUID.randomUUID());
        court.setType(CourtType.GLASS);
        court = courtRepository.save(court);
    }

    @Test
    void savesTheScheduleWithItsOpeningHoursAndFindsItByCourt() {
        scheduleRepository.saveAndFlush(schedule(court, "16.00", hours(DayOfWeek.MONDAY, 8, 22), hours(DayOfWeek.SUNDAY, 9, 14)));
        em.clear();

        var found = scheduleRepository.findByCourtId(court.getId());

        assertThat(found).hasValueSatisfying(s -> {
            assertThat(s.getCourt().getId()).isEqualTo(court.getId());
            assertThat(s.getSlotMinutes()).isEqualTo(60);
            assertThat(s.getPrice()).isEqualByComparingTo("16.00");
            assertThat(s.getOpeningHours()).extracting(OpeningHours::getDayOfWeek)
                    .containsExactlyInAnyOrder(DayOfWeek.MONDAY, DayOfWeek.SUNDAY);
        });
    }

    @Test
    void storesThePriceAsDecimalWithTwoPlaces() {
        var saved = scheduleRepository.saveAndFlush(schedule(court, "16.5"));

        BigDecimal stored = jdbc.queryForObject("SELECT price FROM schedule WHERE id = ?", BigDecimal.class, saved.getId());

        assertThat(stored).isEqualTo(new BigDecimal("16.50"));
    }

    @Test
    void aCourtHasAtMostOneSchedule() {
        scheduleRepository.saveAndFlush(schedule(court, "16.00"));

        assertThatThrownBy(() -> scheduleRepository.saveAndFlush(schedule(court, "20.00")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void replacingTheOpeningHoursDeletesTheOldRows() {
        var saved = scheduleRepository.saveAndFlush(
                schedule(court, "16.00", hours(DayOfWeek.MONDAY, 8, 22), hours(DayOfWeek.SUNDAY, 9, 14)));

        saved.getOpeningHours().clear();
        saved.addOpeningHours(hours(DayOfWeek.TUESDAY, 10, 20));
        scheduleRepository.saveAndFlush(saved);

        assertThat(jdbc.queryForList("SELECT day_of_week FROM opening_hours WHERE schedule_id = ?", String.class,
                saved.getId())).containsExactly("TUESDAY");
    }

    private static Schedule schedule(Court court, String price, OpeningHours... hours) {
        var schedule = new Schedule();
        schedule.setCourt(court);
        schedule.setSlotMinutes(60);
        schedule.setPrice(new BigDecimal(price));
        for (OpeningHours h : hours) {
            schedule.addOpeningHours(h);
        }
        return schedule;
    }

    private static OpeningHours hours(DayOfWeek day, int open, int close) {
        var hours = new OpeningHours();
        hours.setDayOfWeek(day);
        hours.setOpenTime(LocalTime.of(open, 0));
        hours.setCloseTime(LocalTime.of(close, 0));
        return hours;
    }
}
