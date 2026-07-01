package com.example.tcc_backend.functional.flows;

import com.example.tcc_backend.functional.FunctionalTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ConversationFlowTest extends FunctionalTestSupport {

    @Test
    void fluxoConversaProjetoComControleDeAcesso() throws Exception {
        TestUser orientador = registerOrientador("conv-orient");
        TestUser participante = registerAluno("conv-part");
        TestUser invasor = registerAluno("conv-inv");

        Integer cursoId = createCurso("Computacao");
        Integer areaId = createArea("Redes", cursoId);

        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Redes", areaId);

        Integer inscricaoId = inscreverAluno(participante.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        JsonNode conversaJson = objectMapper.readTree(
                mockMvc.perform(post("/api/conversas")
                                .header("Authorization", authHeader(participante.token()))
                                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of("projetoId", projetoId))))
                        .andExpect(status().isCreated())
                        .andReturn().getResponse().getContentAsString()
        );
        Integer conversaId = conversaJson.get("id").asInt();

        JsonNode msgEnvio = objectMapper.readTree(
                mockMvc.perform(post("/api/conversas/" + conversaId + "/mensagem")
                                .header("Authorization", authHeader(participante.token()))
                                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of("conteudo", "Ola equipe"))))
                        .andExpect(status().isCreated())
                        .andReturn().getResponse().getContentAsString()
        );
        Integer mensagemId = msgEnvio.get("id").asInt();

        JsonNode mensagens = objectMapper.readTree(
                mockMvc.perform(get("/api/conversas/" + conversaId + "/mensagens")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(mensagens.size()).isEqualTo(1);
        assertThat(mensagens.get(0).get("conteudo").asText()).isEqualTo("Ola equipe");

        mockMvc.perform(put("/api/conversas/mensagem/" + mensagemId)
                        .header("Authorization", authHeader(participante.token()))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("conteudo", "Ola equipe editado"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.editada").value(true));

        mockMvc.perform(delete("/api/conversas/mensagem/" + mensagemId)
                        .header("Authorization", authHeader(participante.token())))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/conversas/" + conversaId + "/mensagens")
                        .header("Authorization", authHeader(invasor.token())))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/conversas/" + conversaId + "/mensagem")
                        .header("Authorization", authHeader(invasor.token()))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("conteudo", "Invasao"))))
                .andExpect(status().isForbidden());
    }
}