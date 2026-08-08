package com.example.tcc_backend.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import java.sql.DriverManager;

import static org.assertj.core.api.Assertions.assertThat;

class FlywayMigrationTest {

    @Test
    void deveMigrarBancoVazioAteVersaoDois() throws Exception {
        String url = "jdbc:h2:mem:flyway-empty;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE";
        Flyway flyway = Flyway.configure()
                .dataSource(url, "sa", "")
                .locations("classpath:db/migration")
                .load();

        var result = flyway.migrate();

        assertThat(result.migrationsExecuted).isEqualTo(2);
        assertThat(result.targetSchemaVersion).isEqualTo("2");
        try (var connection = DriverManager.getConnection(url, "sa", "");
             var resultSet = connection.getMetaData().getTables(null, null, "project_deliveries", null)) {
            assertThat(resultSet.next()).isTrue();
        }
    }

    @Test
    void deveBaselinearSchemaV1ExistenteEAplicarSomenteV2() throws Exception {
        String url = "jdbc:h2:mem:flyway-existing;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE";
        Flyway.configure().dataSource(url, "sa", "").locations("classpath:db/migration")
                .target("1").load().migrate();
        try (var connection = DriverManager.getConnection(url, "sa", "");
             var statement = connection.createStatement()) {
            statement.execute("DROP TABLE flyway_schema_history");
        }

        var result = Flyway.configure().dataSource(url, "sa", "")
                .locations("classpath:db/migration").baselineOnMigrate(true).baselineVersion("1")
                .load().migrate();

        assertThat(result.migrationsExecuted).isEqualTo(1);
        assertThat(result.targetSchemaVersion).isEqualTo("2");
    }
}
