package com.example.tcc_backend.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/test")
@Profile("test")
public class TestCleanupController {

    private static final String E2E_EMAIL_PATTERN = "%@e2e.local";

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    public TestCleanupController(JdbcTemplate jdbc, PasswordEncoder passwordEncoder) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/admin")
    public ResponseEntity<Map<String, String>> createAdmin() {
        String email = "admin-" + UUID.randomUUID().toString().substring(0, 8) + "@e2e.local";
        String senha = "Admin123!";
        String senhaHash = passwordEncoder.encode(senha);

        jdbc.update(
            "INSERT INTO usuario (nome, email, senha, tipo, ativo, tema, notificacoes_ativas) VALUES (?, ?, ?, 'ADMIN', true, 'sistema', true)",
            "Admin E2E", email, senhaHash
        );

        return ResponseEntity.ok(Map.of("email", email, "senha", senha));
    }

    @PostMapping("/cleanup")
    public ResponseEntity<Void> cleanup() {
        String emailPattern = "%@e2e.local";
        String userFilter = "id_usuario IN (SELECT id_usuario FROM usuario WHERE email LIKE '" + emailPattern + "')";
        String orientadorFilter = "id_orientador IN (SELECT id_orientador FROM orientador WHERE " + userFilter + ")";
        String projetoFilter = "id_projeto IN (SELECT id_projeto FROM projeto WHERE " + orientadorFilter + ")";
        String alunoFilter = "id_aluno IN (SELECT id_aluno FROM aluno WHERE " + userFilter + ")";

        String[] deletes = {
            "DELETE FROM feedback WHERE " + userFilter,
            "DELETE FROM documento WHERE " + userFilter,
            "DELETE FROM notificacao WHERE " + userFilter,
            "DELETE FROM inscricao WHERE " + alunoFilter,
            "DELETE FROM inscricao WHERE " + projetoFilter,
            "DELETE FROM progresso WHERE " + projetoFilter,
            "DELETE FROM progress_steps WHERE project_id IN (SELECT id_projeto FROM projeto WHERE " + orientadorFilter + ")",
            "DELETE FROM mensagem WHERE id_conversa IN (SELECT id_conversa FROM conversa WHERE " + projetoFilter + ")",
            "DELETE FROM conversa_participantes WHERE " + userFilter,
            "DELETE FROM conversa WHERE " + projetoFilter,
            "DELETE FROM auditoria_evento WHERE " + userFilter,
            "DELETE FROM projeto WHERE " + orientadorFilter,
            "DELETE FROM aluno WHERE " + userFilter,
            "DELETE FROM orientador WHERE " + userFilter,
            "DELETE FROM usuario WHERE email LIKE '" + emailPattern + "'"
        };

        for (String sql : deletes) {
            try {
                jdbc.execute(sql);
            } catch (Exception ignored) {
            }
        }
        return ResponseEntity.noContent().build();
    }
}