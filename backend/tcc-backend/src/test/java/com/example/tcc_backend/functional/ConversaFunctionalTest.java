package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ConversaFunctionalTest extends FunctionalTestSupport {

    @Test
    void criarConversaDeveRetornar201() throws Exception {
        TestUser orientador = registerOrientador("conv-create");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Conversa", areaId);

        Integer conversaId = criarConversa(orientador.token(), projetoId);
        assertThat(conversaId).isNotNull();
    }

    @Test
    void listarConversasDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("conv-list");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Lista Conv", areaId);
        criarConversa(orientador.token(), projetoId);

        JsonNode conversas = objectMapper.readTree(
                mockMvc.perform(get("/api/conversas")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(conversas.isArray()).isTrue();
        assertThat(conversas.size()).isGreaterThanOrEqualTo(1);
    }

    @Test
    void enviarMensagemDeveRetornar201() throws Exception {
        TestUser orientador = registerOrientador("conv-send");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Mensagem", areaId);
        Integer conversaId = criarConversa(orientador.token(), projetoId);

        Integer mensagemId = enviarMensagem(orientador.token(), conversaId, "Ola equipe!");
        assertThat(mensagemId).isNotNull();
    }

    @Test
    void listarMensagensDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("conv-msgs");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Msgs", areaId);
        Integer conversaId = criarConversa(orientador.token(), projetoId);
        enviarMensagem(orientador.token(), conversaId, "Mensagem 1");

        JsonNode mensagens = objectMapper.readTree(
                mockMvc.perform(get("/api/conversas/" + conversaId + "/mensagens")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(mensagens.isArray()).isTrue();
        assertThat(mensagens.size()).isGreaterThanOrEqualTo(1);
    }

    @Test
    void editarMensagemDeveFuncionar() throws Exception {
        TestUser orientador = registerOrientador("conv-edit");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Editar", areaId);
        Integer conversaId = criarConversa(orientador.token(), projetoId);
        Integer mensagemId = enviarMensagem(orientador.token(), conversaId, "Original");

        mockMvc.perform(put("/api/conversas/mensagem/" + mensagemId)
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("conteudo", "Editado"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.editada").value(true));
    }

    @Test
    void excluirMensagemDeveRetornar204() throws Exception {
        TestUser orientador = registerOrientador("conv-delete");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Excluir", areaId);
        Integer conversaId = criarConversa(orientador.token(), projetoId);
        Integer mensagemId = enviarMensagem(orientador.token(), conversaId, "Para excluir");

        mockMvc.perform(delete("/api/conversas/mensagem/" + mensagemId)
                        .header("Authorization", authHeader(orientador.token())))
                .andExpect(status().isNoContent());
    }

    @Test
    void naoParticipanteNaoAcessaMensagens() throws Exception {
        TestUser orientador = registerOrientador("conv-np");
        TestUser invasor = registerAluno("conv-np-invasor");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto NP", areaId);
        Integer conversaId = criarConversa(orientador.token(), projetoId);

        mockMvc.perform(get("/api/conversas/" + conversaId + "/mensagens")
                        .header("Authorization", authHeader(invasor.token())))
                .andExpect(status().isForbidden());
    }

    @Test
    void criarConversaComBodyInvalidoDeveRetornar400() throws Exception {
        TestUser orientador = registerOrientador("conv-invalid");

        mockMvc.perform(post("/api/conversas")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
