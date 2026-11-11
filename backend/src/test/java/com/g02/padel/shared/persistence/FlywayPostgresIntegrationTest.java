package com.g02.padel.shared.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
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
                .containsExactly("1", "2", "3", "4", "5", "6", "7");
    }

    @Test
    void createsTheDomainTables() {
        List<String> tables = jdbc.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", String.class);

        assertThat(tables).contains(
                "app_user", "court", "schedule", "opening_hours", "booking", "booking_slot", "court_block",
                "credit_pack", "payment_method", "credit_transaction");
    }

    @Test
    void storesMoneyAsDecimal8Scale2() {
        assertMoneyColumn("booking", "total_price");
        assertMoneyColumn("booking_slot", "price");
        assertMoneyColumn("credit_pack", "price");
    }

    @Test
    void seedsTheFourCreditPacks() {
        List<Map<String, Object>> packs =
                jdbc.queryForList("SELECT pack_size, price FROM credit_pack ORDER BY pack_size");

        assertThat(packs).extracting(row -> row.get("pack_size")).containsExactly(5, 10, 15, 20);
        assertThat(packs).extracting(row -> ((BigDecimal) row.get("price")).toPlainString())
                .containsExactly("75.00", "140.00", "195.00", "240.00");
    }

    @Test
    void onlyAllowsTheFourPackSizesOnceEachAndNonNegativePrices() {
        assertThatThrownBy(() -> jdbc.update("INSERT INTO credit_pack (pack_size, price) VALUES (7, 10.00)"))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("INSERT INTO credit_pack (pack_size, price) VALUES (5, 10.00)"))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("UPDATE credit_pack SET price = -1 WHERE pack_size = 5"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void storesOnlyTheSafeCardFieldsOfAPaymentMethod() {
        List<String> columns = jdbc.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'payment_method'", String.class);

        assertThat(columns).containsExactlyInAnyOrder("id", "user_id", "brand", "last4", "exp_month", "exp_year",
                "gateway_token", "is_default", "active", "created_at");
    }

    @Test
    void storesAnAuditableCreditLedger() {
        List<String> columns = jdbc.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'credit_transaction'",
                String.class);
        assertThat(columns).containsExactlyInAnyOrder("id", "user_id", "type", "credits", "amount", "pack_size",
                "payment_method_id", "charge_reference", "created_at", "booking_id");

        var amount = jdbc.queryForMap("""
                SELECT data_type, numeric_precision, numeric_scale, is_nullable FROM information_schema.columns
                WHERE table_name = 'credit_transaction' AND column_name = 'amount'""");
        // Money of a purchase; empty for a consumption.
        assertThat(amount).containsEntry("data_type", "numeric").containsEntry("numeric_precision", 8)
                .containsEntry("numeric_scale", 2).containsEntry("is_nullable", "YES");
    }

    @Test
    void recordsHowABookingWasPaid() {
        List<String> columns = jdbc.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'booking'", String.class);
        assertThat(columns).contains("credits_used", "amount_charged", "payment_method_id", "charge_reference");
        var amount = jdbc.queryForMap("""
                SELECT data_type, numeric_precision, numeric_scale, is_nullable FROM information_schema.columns
                WHERE table_name = 'booking' AND column_name = 'amount_charged'""");
        // Null: an owner manual booking, or one made before payments existed.
        assertThat(amount).containsEntry("data_type", "numeric").containsEntry("numeric_precision", 8)
                .containsEntry("numeric_scale", 2).containsEntry("is_nullable", "YES");
    }

    private void assertMoneyColumn(String table, String name) {
        var column = jdbc.queryForMap("""
                SELECT data_type, numeric_precision, numeric_scale, is_nullable FROM information_schema.columns
                WHERE table_name = ? AND column_name = ?""", table, name);

        assertThat(column).containsEntry("is_nullable", "NO").containsEntry("data_type", "numeric")
                .containsEntry("numeric_precision", 8)
                .containsEntry("numeric_scale", 2);
    }
}
