package com.example.tcc_backend.functional.flows;

import com.example.tcc_backend.functional.FunctionalTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AvaliacaoFlowTest extends FunctionalTestSupport {

    private Map<String, Object> avaliacaoBody() {
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("participacao", 5);
        body.put("qualidadeTecnica", 4);
        body.put("cumprimentoDePrazos", 3);
        body.put("comunicacao", 4);
        body.put("comentarioOrientador", "Bom desempenho na etapa");
        return body;
    }

    @Test
    void fluxoAvaliacaoComCienciaEPrivacidade() throws Exception {
        TestUser orientador = registerOrientador("aval-orient");
        TestUser aluno = registerAluno("aval-aluno");
        TestUser alunoOutro = registerAluno("aval-outro");

        Integer cursoId = createCurso("Ciencia da Computacao");
        Integer areaId = createArea("IA", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Avaliacao", areaId);

        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);
        Integer inscricaoOutroId = inscreverAluno(alunoOutro.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoOutroId);

        JsonNode etapas = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/" + projetoId + "/etapas")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        JsonNode etapaConcluida = etapas.get(0);
        Integer etapaId = etapaConcluida.get("id").asInt();

        mockMvc.perform(patch("/api/projetos/" + projetoId + "/etapas/" + etapaId)
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "done"))))
                .andExpect(status().isOk());

        Integer alunoId = jdbc.queryForObject(
                "SELECT id_aluno FROM aluno WHERE id_usuario = ?", Integer.class, aluno.userId());

        Map<String, Object> body = avaliacaoBody();
        body.put("alunoId", alunoId);
        body.put("etapaId", etapaId);

        JsonNode criada = objectMapper.readTree(
                mockMvc.perform(post("/api/projetos/" + projetoId + "/avaliacoes")
                                .header("Authorization", authHeader(orientador.token()))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(body)))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        Long avaliacaoId = criada.get("id").asLong();
        assertThat(criada.get("media").asDouble()).isEqualTo(4.0);
        assertThat(criada.get("cienciaRegistrada").asBoolean()).isFalse();

        mockMvc.perform(get("/api/projetos/" + projetoId + "/avaliacoes/" + avaliacaoId)
                        .header("Authorization", authHeader(alunoOutro.token())))
                .andExpect(status().isForbidden());

        JsonNode vista = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/" + projetoId + "/avaliacoes/" + avaliacaoId)
                                .header("Authorization", authHeader(aluno.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(vista.get("alunoId").asInt()).isEqualTo(alunoId);

        mockMvc.perform(post("/api/projetos/" + projetoId + "/avaliacoes/" + avaliacaoId + "/ciencia")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "comentarioAluno", "Obrigado pelo retorno"))))
                .andExpect(status().isForbidden());

        JsonNode comCiencia = objectMapper.readTree(
                mockMvc.perform(post("/api/projetos/" + projetoId + "/avaliacoes/" + avaliacaoId + "/ciencia")
                                .header("Authorization", authHeader(aluno.token()))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "comentarioAluno", "Obrigado pelo retorno"))))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(comCiencia.get("cienciaRegistrada").asBoolean()).isTrue();

        mockMvc.perform(post("/api/projetos/" + projetoId + "/avaliacoes/" + avaliacaoId + "/ciencia")
                        .header("Authorization", authHeader(aluno.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict());

        body.put("participacao", 2);
        mockMvc.perform(patch("/api/projetos/" + projetoId + "/avaliacoes/" + avaliacaoId)
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/projetos/" + projetoId + "/avaliacoes")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict());
    }

    @Test
    void avaliacaoSoPodeSerRegistradaPorOrientadorResponsavelEParaEtapaConcluida() throws Exception {
        TestUser orientador = registerOrientador("aval2-orient");
        TestUser aluno = registerAluno("aval2-aluno");

        Integer cursoId = createCurso("Sistemas de Informacao");
        Integer areaId = createArea("Banco de Dados", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Avaliacao 2", areaId);

        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        JsonNode etapas = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/" + projetoId + "/etapas")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        Integer etapaPendenteId = etapas.get(0).get("id").asInt();
        Integer alunoId = jdbc.queryForObject(
                "SELECT id_aluno FROM aluno WHERE id_usuario = ?", Integer.class, aluno.userId());

        Map<String, Object> body = avaliacaoBody();
        body.put("alunoId", alunoId);
        body.put("etapaId", etapaPendenteId);

        mockMvc.perform(post("/api/projetos/" + projetoId + "/avaliacoes")
                        .header("Authorization", authHeader(aluno.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/projetos/" + projetoId + "/avaliacoes")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }
}
