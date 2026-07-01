package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class DocumentoDownloadFunctionalTest extends FunctionalTestSupport {

    @Test
    void downloadDocumentoExistenteDeveRetornarRedirect() throws Exception {
        TestUser dono = registerAluno("doc-dl");
        String supabaseUrl = "https://test.supabase.co/storage/v1/object/public/documents/test.pdf";

        JsonNode uploadJson = objectMapper.readTree(
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
        Integer documentoId = uploadJson.get("id").asInt();

        mockMvc.perform(get("/api/documentos/" + documentoId + "/download")
                        .header("Authorization", authHeader(dono.token())))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", supabaseUrl));
    }

    @Test
    void downloadDocumentoInexistenteDeveRetornar404() throws Exception {
        TestUser user = registerAluno("doc-dl-404");

        mockMvc.perform(get("/api/documentos/99999/download")
                        .header("Authorization", authHeader(user.token())))
                .andExpect(status().isNotFound());
    }

    @Test
    void downloadDocumentoDeOutroUsuarioCurriculoDevePermitir() throws Exception {
        TestUser dono = registerAluno("doc-dl-owner");
        TestUser outro = registerAluno("doc-dl-other");
        String supabaseUrl = "https://test.supabase.co/storage/v1/object/public/documents/test2.pdf";

        JsonNode uploadJson = objectMapper.readTree(
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
        Integer documentoId = uploadJson.get("id").asInt();

        mockMvc.perform(get("/api/documentos/" + documentoId + "/download")
                        .header("Authorization", authHeader(outro.token())))
                .andExpect(status().isFound());
    }

    @Test
    void downloadDocumentoDeOutroUsuarioHistoricoDeveNegar() throws Exception {
        TestUser dono = registerAluno("doc-dl-hist");
        TestUser outro = registerAluno("doc-dl-hist-other");
        String supabaseUrl = "https://test.supabase.co/storage/v1/object/public/documents/test3.pdf";

        JsonNode uploadJson = objectMapper.readTree(
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
        Integer documentoId = uploadJson.get("id").asInt();

        mockMvc.perform(get("/api/documentos/" + documentoId + "/download")
                        .header("Authorization", authHeader(outro.token())))
                .andExpect(status().isForbidden());
    }

    @Test
    void downloadSemTokenDeveRetornar401() throws Exception {
        mockMvc.perform(get("/api/documentos/1/download"))
                .andExpect(status().isUnauthorized());
    }
}