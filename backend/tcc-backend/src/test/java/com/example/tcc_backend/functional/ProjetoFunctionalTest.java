package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProjetoFunctionalTest extends FunctionalTestSupport {

    @Test
    void criarProjetoComoOrientador() throws Exception {
        TestUser orientador = registerOrientador("proj-create");
        Integer areaId = createArea("IA", createCurso("CC"));

        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Teste", areaId);
        assertThat(projetoId).isNotNull();

        JsonNode projeto = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/" + projetoId)
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(projeto.get("titulo").asText()).isEqualTo("Projeto Teste");
        assertThat(projeto.get("status").asText()).isEqualTo("ABERTO");
    }

    @Test
    void listarProjetosDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("proj-list");
        Integer areaId = createArea("Redes", createCurso("CC"));
        createProjetoAsOrientador(orientador.token(), "Projeto 1", areaId);
        createProjetoAsOrientador(orientador.token(), "Projeto 2", areaId);

        JsonNode projetos = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(projetos.isArray()).isTrue();
        assertThat(projetos.size()).isGreaterThanOrEqualTo(2);
    }

    @Test
    void filtrarPorStatusDeveRetornarFiltrados() throws Exception {
        TestUser orientador = registerOrientador("proj-filter");
        Integer areaId = createArea("DevOps", createCurso("ES"));
        createProjetoAsOrientador(orientador.token(), "Projeto Aberto", areaId);

        JsonNode projetos = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos").param("status", "ABERTO")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(projetos.isArray()).isTrue();
        for (JsonNode p : projetos) {
            assertThat(p.get("status").asText()).isEqualTo("ABERTO");
        }
    }

    @Test
    void meusProjetosDoAlunoDeveManterProjetoFinalizado() throws Exception {
        TestUser orientador = registerOrientador("proj-mine-final-advisor");
        TestUser aluno = registerAluno("proj-mine-final-student");
        Integer areaId = createArea("Historia", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Historico Finalizado", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);
        jdbc.update("UPDATE projeto SET status = 'FINALIZADO' WHERE id_projeto = ?", projetoId);

        JsonNode pagina = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/pagina")
                                .param("meusProjetos", "true")
                                .param("status", "FINALIZADO")
                                .header("Authorization", authHeader(aluno.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        JsonNode content = pagina.get("content");
        assertThat(content.isArray()).isTrue();
        assertThat(content).anySatisfy(p -> {
            assertThat(p.get("id").asInt()).isEqualTo(projetoId);
            assertThat(p.get("status").asText()).isEqualTo("FINALIZADO");
        });
    }

    @Test
    void atualizarProjetoDeveFuncionar() throws Exception {
        TestUser orientador = registerOrientador("proj-update");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Original", areaId);

        mockMvc.perform(put("/api/projetos/" + projetoId)
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "titulo", "Atualizado",
                                "descricao", "Nova descricao",
                                "requisitos", "Python",
                                "vagas", 3,
                                "areaId", areaId
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Atualizado"));
    }

    @Test
    void deletarProjetoDeveRetornarNoContent() throws Exception {
        TestUser orientador = registerOrientador("proj-delete");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Para Deletar", areaId);

        mockMvc.perform(delete("/api/projetos/" + projetoId)
                        .header("Authorization", authHeader(orientador.token())))
                .andExpect(status().isNoContent());
    }

    @Test
    void criarProjetoSemTokenDeveRetornar401() throws Exception {
        Integer areaId = createArea("IA", createCurso("CC"));

        mockMvc.perform(post("/api/projetos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "titulo", "Sem Auth",
                                "descricao", "Teste",
                                "requisitos", "Java",
                                "vagas", 1,
                                "areaId", areaId
                        ))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void criarProjetoComBodyInvalidoDeveRetornar400() throws Exception {
        TestUser orientador = registerOrientador("proj-invalid");

        mockMvc.perform(post("/api/projetos")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void recrutarColaboradorDeveFuncionar() throws Exception {
        TestUser orientador = registerOrientador("proj-recruit");
        TestUser aluno = registerAluno("proj-recruit-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Recrutamento", areaId);

        mockMvc.perform(post("/api/projetos/" + projetoId + "/recrutar")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("usuarioId", aluno.userId()))))
                .andExpect(status().isOk());
    }

    @Test
    void listarColaboradoresDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("proj-collab");
        TestUser aluno = registerAluno("proj-collab-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Colaboradores", areaId);

        mockMvc.perform(post("/api/projetos/" + projetoId + "/recrutar")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("usuarioId", aluno.userId()))))
                .andExpect(status().isOk());

        JsonNode colaboradores = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/" + projetoId + "/colaboradores")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(colaboradores.isArray()).isTrue();
        assertThat(colaboradores.size()).isGreaterThanOrEqualTo(1);
    }
    @Test
    void orientadorSolicitadoNaoPodeEditarOuExcluirProjetoAntesDeAceitar() throws Exception {
        TestUser aluno = registerAluno("proj-pending-owner");
        TestUser orientador = registerOrientador("proj-pending-advisor");
        Integer areaId = createArea("Seguranca", createCurso("CC"));

        Integer projetoId = createProjetoAsAluno(aluno.token(), orientador.userId(), "Projeto Pendente", areaId);

        mockMvc.perform(put("/api/projetos/" + projetoId)
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(projectUpdateBody("Tentativa indevida", areaId)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/projetos/" + projetoId)
                        .header("Authorization", authHeader(orientador.token())))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/projetos/" + projetoId + "/aceitar-orientacao")
                        .header("Authorization", authHeader(orientador.token())))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/projetos/" + projetoId)
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(projectUpdateBody("Agora pode editar", areaId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Agora pode editar"));
    }

    @Test
    void alunoAprovadoNaoPodeEditarProjetoQueNaoCriou() throws Exception {
        TestUser orientador = registerOrientador("proj-approved-member-advisor");
        TestUser aluno = registerAluno("proj-approved-member-student");
        Integer areaId = createArea("Banco de Dados", createCurso("ES"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto do Orientador", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        mockMvc.perform(put("/api/projetos/" + projetoId)
                        .header("Authorization", authHeader(aluno.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(projectUpdateBody("Aluno nao deve editar", areaId)))
                .andExpect(status().isForbidden());
    }

    private Integer createProjetoAsAluno(String token, Integer orientadorId, String titulo, Integer areaId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/projetos")
                        .header("Authorization", authHeader(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "titulo", titulo,
                                "descricao", "Descricao do projeto",
                                "requisitos", "Java",
                                "vagas", 2,
                                "areaId", areaId,
                                "orientadorId", orientadorId
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asInt();
    }

    private String projectUpdateBody(String titulo, Integer areaId) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "titulo", titulo,
                "descricao", "Nova descricao",
                "requisitos", "Python",
                "vagas", 3,
                "areaId", areaId
        ));
    }
}
