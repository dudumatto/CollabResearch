package com.example.tcc_backend.functional;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MeuCalendarioFunctionalTest extends FunctionalTestSupport {

    @Test
    void listarPrazosDoUsuarioDeveRetornarArrayAutenticado() throws Exception {
        TestUser aluno = registerAluno("calendar-route");

        mockMvc.perform(get("/api/me/prazos-etapas")
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void alunoAprovadoVeEtapasDeProjetoSemAlunoCriador() throws Exception {
        TestUser aluno = registerAluno("calendar-membro");
        TestUser orientador = registerOrientador("calendar-membro");
        jdbc.update("INSERT INTO projeto (titulo, status, id_orientador, id_aluno_criador) VALUES ('Sem criador', 'EM_ANDAMENTO', ?, NULL)",
                jdbc.queryForObject("SELECT id_orientador FROM orientador WHERE id_usuario = ?", Integer.class, orientador.userId()));
        Integer projetoId = jdbc.queryForObject("SELECT MAX(id_projeto) FROM projeto", Integer.class);
        jdbc.update("INSERT INTO inscricao (id_aluno, id_projeto, status) VALUES (?, ?, 'APROVADO')", jdbc.queryForObject("SELECT id_aluno FROM aluno WHERE id_usuario = ?", Integer.class, aluno.userId()), projetoId);
        jdbc.update("INSERT INTO progress_steps (project_id, title, weight, step_order, status, created_at, responsible, required) VALUES (?, 'Marco A', 100, 1, 'PENDING', CURRENT_TIMESTAMP, 'AMBOS', TRUE)", projetoId);

        mockMvc.perform(get("/api/me/prazos-etapas")
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].titulo").value("Marco A"));
    }
}
