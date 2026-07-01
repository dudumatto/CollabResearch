package com.example.tcc_backend.functional.flows;

import com.example.tcc_backend.functional.FunctionalTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class DocumentFlowTest extends FunctionalTestSupport {

    @Test
    void fluxoDocumentoComControleDeAcesso() throws Exception {
        TestUser dono = registerAluno("doc-dono");
        TestUser orientador = registerOrientador("doc-orient");
        TestUser outroAluno = registerAluno("doc-outro");

        String supabaseUrl = "https://test.supabase.co/storage/v1/object/public/documents/test.pdf";

        JsonNode curriculoJson = objectMapper.readTree(
                mockMvc.perform(post("/api/documentos/upload")
                                .header("Authorization", authHeader(dono.token()))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "usuarioId", dono.userId(),
                                        "tipo", "CURRICULO",
                                        "nomeArquivo", "curriculo.pdf",
                                        "url", supabaseUrl
                                ))))
                        .andExpect(status().isCreated())
                        .andReturn().getResponse().getContentAsString()
        );
        Integer curriculoId = curriculoJson.get("id").asInt();

        mockMvc.perform(get("/api/documentos/" + curriculoId)
                        .header("Authorization", authHeader(orientador.token())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/documentos/" + curriculoId)
                        .header("Authorization", authHeader(outroAluno.token())))
                .andExpect(status().isOk());

        JsonNode historicoJson = objectMapper.readTree(
                mockMvc.perform(post("/api/documentos/upload")
                                .header("Authorization", authHeader(dono.token()))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "usuarioId", dono.userId(),
                                        "tipo", "HISTORICO",
                                        "nomeArquivo", "historico.pdf",
                                        "url", supabaseUrl
                                ))))
                        .andExpect(status().isCreated())
                        .andReturn().getResponse().getContentAsString()
        );
        Integer historicoId = historicoJson.get("id").asInt();

        mockMvc.perform(get("/api/documentos/" + historicoId)
                        .header("Authorization", authHeader(dono.token())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/documentos/" + historicoId)
                        .header("Authorization", authHeader(outroAluno.token())))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/documentos/" + historicoId)
                        .header("Authorization", authHeader(dono.token())))
                .andExpect(status().isNoContent());

        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM documento WHERE id_documento = ?", Integer.class, historicoId);
        assertThat(count).isEqualTo(0);
    }
}