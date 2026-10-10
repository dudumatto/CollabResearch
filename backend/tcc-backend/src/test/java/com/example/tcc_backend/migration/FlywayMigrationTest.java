package com.example.tcc_backend.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import java.sql.DriverManager;

import static org.assertj.core.api.Assertions.assertThat;

class FlywayMigrationTest {

    @Test
    void deveMigrarBancoVazioAteVersaoDois() throws Exception {
        String url = "jdbc:h2:mem:flyway-empty;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE";
        Flyway flyway = Flyway.configure()
                .dataSource(url, "sa", "")
                .locations("classpath:db/migration")
                .target("2")
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
                .locations("classpath:db/migration").target("2").baselineOnMigrate(true).baselineVersion("1")
                .load().migrate();

        assertThat(result.migrationsExecuted).isEqualTo(1);
        assertThat(result.targetSchemaVersion).isEqualTo("2");
    }

    /** V3+ usa SQL especifico de PostgreSQL; o V12 e portavel e roda sobre o schema ate V2 no H2. */
    @Test
    void v12PreservaMarcosExistentesComUmaTarefaCada() throws Exception {
        String url = "jdbc:h2:mem:flyway-v12;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE";
        Flyway.configure().dataSource(url, "sa", "").locations("classpath:db/migration").target("2").load().migrate();
        try (var connection = DriverManager.getConnection(url, "sa", "");
             var st = connection.createStatement()) {
            // H2 avalia mal o CHECK do V2 em linhas inseridas; o teste foca no V12
            st.execute("ALTER TABLE progress_steps DROP CONSTRAINT ck_progress_steps_responsible");
            st.execute("INSERT INTO usuario (nome, email, senha, tipo) VALUES ('Aluno', 'a@x.com', 'x', 'ALUNO')");
            st.execute("INSERT INTO projeto (titulo, status) VALUES ('P', 'EM_ANDAMENTO')");
            st.execute("INSERT INTO progress_steps (project_id, title, weight, step_order, status, completed_at, completed_by, created_at, responsible) "
                    + "VALUES (1, 'Concluido', 30, 1, 'DONE', CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 'AMBOS')");
            st.execute("INSERT INTO progress_steps (project_id, title, weight, step_order, status, created_at, responsible) "
                    + "VALUES (1, 'Ativo antigo', 30, 2, 'ACTIVE', CURRENT_TIMESTAMP, 'AMBOS')");
            st.execute("INSERT INTO progress_steps (project_id, title, weight, step_order, status, created_at, responsible) "
                    + "VALUES (1, 'Devolvido', 40, 3, 'REJECTED', CURRENT_TIMESTAMP, 'AMBOS')");

            ScriptUtils.executeSqlScript(connection, new ClassPathResource("db/migration/V12__marcos_checklist.sql"));

            try (var rs = st.executeQuery("SELECT s.title, s.status, t.title, t.completed, t.origin, t.required "
                    + "FROM progress_steps s JOIN progress_step_tasks t ON t.step_id = s.id ORDER BY s.step_order")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).isEqualTo("Concluido");
                assertThat(rs.getString(2)).isEqualTo("DONE");
                assertThat(rs.getString(3)).isEqualTo("Concluido");
                assertThat(rs.getBoolean(4)).isTrue();
                assertThat(rs.getString(5)).isEqualTo("ORIENTADOR");
                assertThat(rs.getBoolean(6)).isFalse();
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(2)).isEqualTo("PENDING");
                assertThat(rs.getString(3)).isEqualTo("Ativo antigo");
                assertThat(rs.getBoolean(4)).isFalse();
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(2)).isEqualTo("REJECTED");
                assertThat(rs.getBoolean(4)).isFalse();
                assertThat(rs.next()).isFalse();
            }
            try (var rs = st.executeQuery("SELECT COUNT(*), MIN(action) FROM progress_step_reviews")) {
                rs.next();
                assertThat(rs.getInt(1)).isEqualTo(1);
                assertThat(rs.getString(2)).isEqualTo("APROVADO");
            }
            // exclusao do marco leva tarefas e revisoes junto
            st.execute("DELETE FROM progress_steps WHERE title = 'Concluido'");
            try (var rs = st.executeQuery("SELECT COUNT(*) FROM progress_step_tasks")) {
                rs.next();
                assertThat(rs.getInt(1)).isEqualTo(2);
            }
            try (var rs = st.executeQuery("SELECT COUNT(*) FROM progress_step_reviews")) {
                rs.next();
                assertThat(rs.getInt(1)).isZero();
            }
        }
    }
}
