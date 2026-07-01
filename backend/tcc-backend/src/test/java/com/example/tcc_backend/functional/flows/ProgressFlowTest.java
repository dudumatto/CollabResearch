package com.example.tcc_backend.functional.flows;

import com.example.tcc_backend.functional.FunctionalTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProgressFlowTest extends FunctionalTestSupport {

    @Test
    void fluxoProgressoComControleDePermissao() throws Exception {
        TestUser orientador = registerOrientador("prog-orient");
        TestUser participante = registerAluno("prog-part");
        TestUser invasor = registerAluno("prog-inv");

        Integer cursoId = createCurso("Ciencia da Computacao");
        Integer areaId = createArea("Inteligencia Artificial", cursoId);

        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto IA", areaId);

        Integer inscricaoId = inscreverAluno(participante.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        JsonNode progressoJson = objectMapper.readTree(
                mockMvc.perform(post("/api/projetos/" + projetoId + "/progresso")
                                .header("Authorization", authHeader(participante.token()))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "titulo", "Etapa 1",
                                        "descricao", "Primeira etapa concluida",
                                        "tipo", "ATUALIZACAO"
                                ))))
                        .andExpect(status().isCreated())
                        .andReturn().getResponse().getContentAsString()
        );
        Integer progressoId = progressoJson.get("id").asInt();

        JsonNode listarJson = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/" + projetoId + "/progresso")
                                .header("Authorization", authHeader(participante.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(listarJson.size()).isEqualTo(1);

        mockMvc.perform(put("/api/progresso/" + progressoId)
                        .header("Authorization", authHeader(participante.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "titulo", "Etapa 1 Atualizada",
                                "descricao", "Descricao atualizada",
                                "tipo", "ATUALIZACAO"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Etapa 1 Atualizada"));

        mockMvc.perform(put("/api/progresso/" + progressoId)
                        .header("Authorization", authHeader(invasor.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "descricao", "Tentativa de invasao",
                                "tipo", "ATUALIZACAO"
                        ))))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/progresso/" + progressoId)
                        .header("Authorization", authHeader(invasor.token())))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/progresso/" + progressoId)
                        .header("Authorization", authHeader(orientador.token())))
                .andExpect(status().isNoContent());

        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM progresso WHERE id_progresso = ?", Integer.class, progressoId);
        assertThat(count).isEqualTo(0);
    }
}