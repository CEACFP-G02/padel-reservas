package com.g02.padel.shared.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.List;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Runs the Flyway migrations against a real PostgreSQL and boots the context with
 * {@code ddl-auto=validate}: the context only starts if the JPA entities match the migrated schema.
 */
@SpringBootTest
@Testcontainers
class FlywayPostgresIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void appliesEveryMigrationSuccessfully() {
        MigrationInfo[] applied = flyway.info().applied();

        assertThat(applied).isNotEmpty();
        assertThat(applied).allSatisfy(m -> assertThat(m.getState()).isEqualTo(MigrationState.SUCCESS));
        assertThat(flyway.info().pending()).isEmpty();
        assertThat(Arrays.stream(applied).map(m -> m.getVersion().getVersion()))
                .containsExactly("1", "2");
    }

    @Test
    void createsTheDomainTables() {
        List<String> tables = jdbc.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", String.class);

        assertThat(tables).contains(
                "app_user", "court", "schedule", "opening_hours", "booking", "booking_slot", "court_block");
    }

    @Test
    void storesMoneyAsDecimal8Scale2() {
        var column = jdbc.queryForMap("""
                SELECT data_type, numeric_precision, numeric_scale FROM information_schema.columns
                WHERE table_name = 'booking' AND column_name = 'total_price'""");

        assertThat(column).containsEntry("data_type", "numeric")
                .containsEntry("numeric_precision", 8)
                .containsEntry("numeric_scale", 2);
    }
}
