package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class DocumentoFunctionalTest extends FunctionalTestSupport {

    private static final String SUPABASE_URL = "https://test.supabase.co/storage/v1/object/public/documents/test.pdf";

    @Test
    void uploadDocumentoDeveRetornar201() throws Exception {
        TestUser aluno = registerAluno("doc-upload");

        Integer docId = uploadDocumento(aluno.token(), aluno.userId(), "CURRICULO", SUPABASE_URL);
        assertThat(docId).isNotNull();
    }

    @Test
    void buscarDocumentoPorIdDeveRetornar200() throws Exception {
        TestUser aluno = registerAluno("doc-find");
        Integer docId = uploadDocumento(aluno.token(), aluno.userId(), "CURRICULO", SUPABASE_URL);

        mockMvc.perform(get("/api/documentos/" + docId)
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(docId));
    }

    @Test
    void deletarDocumentoDeveRetornar204() throws Exception {
        TestUser aluno = registerAluno("doc-delete");
        Integer docId = uploadDocumento(aluno.token(), aluno.userId(), "CURRICULO", SUPABASE_URL);

        mockMvc.perform(delete("/api/documentos/" + docId)
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isNoContent());
    }

    @Test
    void uploadParaOutroUsuarioDeveSer403() throws Exception {
        TestUser dono = registerAluno("doc-owner");
        TestUser outro = registerAluno("doc-other");

        mockMvc.perform(post("/api/documentos/upload")
                        .header("Authorization", authHeader(outro.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "usuarioId", dono.userId(),
                                "tipo", "CURRICULO",
                                "nomeArquivo", "teste.pdf",
                                "url", SUPABASE_URL
                        ))))
                .andExpect(status().isForbidden());
    }

    @Test
    void historicoNaoAcessivelPorOutroUsuario() throws Exception {
        TestUser dono = registerAluno("doc-hist-owner");
        TestUser outro = registerAluno("doc-hist-other");
        Integer docId = uploadDocumento(dono.token(), dono.userId(), "HISTORICO", SUPABASE_URL);

        mockMvc.perform(get("/api/documentos/" + docId)
                        .header("Authorization", authHeader(outro.token())))
                .andExpect(status().isForbidden());
    }

    @Test
    void curriculoAcessivelPorOutroUsuario() throws Exception {
        TestUser dono = registerAluno("doc-curric-owner");
        TestUser outro = registerAluno("doc-curric-other");
        Integer docId = uploadDocumento(dono.token(), dono.userId(), "CURRICULO", SUPABASE_URL);

        mockMvc.perform(get("/api/documentos/" + docId)
                        .header("Authorization", authHeader(outro.token())))
                .andExpect(status().isOk());
    }
}
