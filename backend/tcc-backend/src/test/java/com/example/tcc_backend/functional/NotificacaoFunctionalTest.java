package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class NotificacaoFunctionalTest extends FunctionalTestSupport {

    @Test
    void listarMinhasNotificacoesDeveRetornarLista() throws Exception {
        TestUser orientador = registerOrientador("notif-list");
        TestUser aluno = registerAluno("notif-list-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Notificacao", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        JsonNode notificacoes = objectMapper.readTree(
                mockMvc.perform(get("/api/notificacoes")
                                .header("Authorization", authHeader(aluno.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(notificacoes.isArray()).isTrue();
        assertThat(notificacoes.size()).isGreaterThanOrEqualTo(1);
    }

    @Test
    void marcarComoLidaDeveFuncionar() throws Exception {
        TestUser orientador = registerOrientador("notif-read");
        TestUser aluno = registerAluno("notif-read-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Marcar Lida", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        JsonNode notificacoes = objectMapper.readTree(
                mockMvc.perform(get("/api/notificacoes")
                                .header("Authorization", authHeader(aluno.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        if (notificacoes.size() > 0) {
            Integer notifId = notificacoes.get(0).get("id").asInt();

            mockMvc.perform(put("/api/notificacoes/" + notifId + "/ler")
                            .header("Authorization", authHeader(aluno.token())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.lida").value(true));
        }
    }

    @Test
    void marcarTodasComoLidasDeveRetornar204() throws Exception {
        TestUser orientador = registerOrientador("notif-readall");
        TestUser aluno = registerAluno("notif-readall-aluno");
        Integer areaId = createArea("IA", createCurso("CC"));
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Todas Lidas", areaId);
        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        mockMvc.perform(put("/api/notificacoes/ler-todas")
                        .header("Authorization", authHeader(aluno.token())))
                .andExpect(status().isNoContent());
    }
}
