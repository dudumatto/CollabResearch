package com.example.tcc_backend.controller;

import com.example.tcc_backend.model.Documento;
import com.example.tcc_backend.model.TipoDocumento;
import com.example.tcc_backend.service.DocumentoService;
import com.example.tcc_backend.support.ControllerTestSupport;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DocumentoControllerIntegrationTest {

    @Mock
    private DocumentoService documentoService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new DocumentoController(documentoService));
    }

    @Test
    void uploadDeveRetornarDocumentoResponse() throws Exception {
        String url = "https://qqusyyzkroensiazmslf.supabase.co/storage/v1/object/public/documents/usuarios/1/arquivo.pdf";
        Documento documento = TestDataFactory.documento(1, TestDataFactory.usuarioAluno(1), url);
        documento.setNomeArquivo("arquivo.pdf");

        when(documentoService.upload(
                eq(1),
                eq(TipoDocumento.CURRICULO),
                eq("arquivo.pdf"),
                eq(url)
        )).thenReturn(documento);

        mockMvc.perform(post("/api/documentos/upload")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "usuarioId": 1,
                                  "tipo": "CURRICULO",
                                  "nomeArquivo": "arquivo.pdf",
                                  "url": "%s"
                                }
                                """.formatted(url)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.tipo").value("CURRICULO"))
                .andExpect(jsonPath("$.nomeArquivo").value("arquivo.pdf"))
                .andExpect(jsonPath("$.url").value(url));
    }

    @Test
    void deleteDeveRetornarNoContent() throws Exception {
        doNothing().when(documentoService).remover(5);

        mockMvc.perform(delete("/api/documentos/5"))
                .andExpect(status().isNoContent());
    }

    @Test
    void previewDeveRedirecionarParaUrlDoDocumento() throws Exception {
        String url = "https://qqusyyzkroensiazmslf.supabase.co/storage/v1/object/public/documents/usuarios/1/arquivo.png";
        when(documentoService.obterUrlDocumento(1)).thenReturn(url);

        mockMvc.perform(get("/api/documentos/1/preview"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", is(url)));
    }
}
