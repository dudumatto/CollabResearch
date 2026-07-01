package com.example.tcc_backend.functional;

import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

public final class DatabaseCleanup {

    private static final List<String> TABLES_IN_FK_ORDER = List.of(
        "auditoria_evento",
        "mensagem",
        "conversa_participantes",
        "conversa",
        "progress_steps",
        "progresso",
        "notificacao",
        "documento",
        "feedback",
        "inscricao",
        "projeto",
        "aluno",
        "orientador",
        "configuracao_sistema",
        "area_pesquisa",
        "curso",
        "usuario"
    );

    private final JdbcTemplate jdbc;

    public DatabaseCleanup(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void truncateAll() {
        for (String table : TABLES_IN_FK_ORDER) {
            jdbc.execute("DELETE FROM " + table);
        }
    }
}