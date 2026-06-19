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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DocumentoControllerSecurityTest {

    @Mock
    private DocumentoService documentoService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new DocumentoController(documentoService));
    }

    @Test
    void uploadDeveRetornarNomeOriginalNoResponseNaoONomeFisicoUUID() throws Exception {
        String url = "https://qqusyyzkroensiazmslf.supabase.co/storage/v1/object/public/documents/usuarios/1/8b12c5bf.pdf";
        Documento documento = Documento.builder()
                .id(1)
                .usuario(TestDataFactory.usuarioAluno(1))
                .tipo(TipoDocumento.CURRICULO)
                .caminho(url)
                .nomeArquivo("curriculo_do_joao.pdf")
                .build();

        when(documentoService.upload(
                eq(1),
                eq(TipoDocumento.CURRICULO),
                eq("curriculo_do_joao.pdf"),
                eq(url)
        )).thenReturn(documento);

        mockMvc.perform(post("/api/documentos/upload")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "usuarioId": 1,
                                  "tipo": "CURRICULO",
                                  "nomeArquivo": "curriculo_do_joao.pdf",
                                  "url": "%s"
                                }
                                """.formatted(url)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.tipo").value("CURRICULO"))
                .andExpect(jsonPath("$.nomeArquivo").value("curriculo_do_joao.pdf"));
    }

    @Test
    void downloadDeveRedirecionarParaUrlDoSupabase() throws Exception {
        String url = "https://qqusyyzkroensiazmslf.supabase.co/storage/v1/object/public/documents/usuarios/1/arquivo.pdf";
        when(documentoService.obterUrlDocumento(1)).thenReturn(url);

        mockMvc.perform(get("/api/documentos/1/download"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", is(url)));
    }

    @Test
    void previewDeveRedirecionarParaUrlDoSupabase() throws Exception {
        String url = "https://qqusyyzkroensiazmslf.supabase.co/storage/v1/object/public/documents/usuarios/1/arquivo.pdf";
        when(documentoService.obterUrlDocumento(3)).thenReturn(url);

        mockMvc.perform(get("/api/documentos/3/preview"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", is(url)));
    }
}
