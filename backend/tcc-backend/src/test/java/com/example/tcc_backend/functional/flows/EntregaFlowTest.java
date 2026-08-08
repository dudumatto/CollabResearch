package com.example.tcc_backend.functional.flows;

import com.example.tcc_backend.functional.FunctionalTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class EntregaFlowTest extends FunctionalTestSupport {

    private MockMultipartFile pdf(String nome) {
        return new MockMultipartFile(
                "arquivo", nome, "application/pdf",
                new byte[]{'%', 'P', 'D', 'F', '-', '1', '2', '3', '4', '5'});
    }

    @Test
    void fluxoEntregaComAjustesENovaVersao() throws Exception {
        TestUser orientador = registerOrientador("entrega-orient");
        TestUser aluno = registerAluno("entrega-aluno");

        Integer cursoId = createCurso("Engenharia de Software");
        Integer areaId = createArea("Sistemas", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Entregas", areaId);

        Integer inscricaoId = inscreverAluno(aluno.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        JsonNode entrega = objectMapper.readTree(
                mockMvc.perform(multipart("/api/projetos/" + projetoId + "/entregas")
                                .file(pdf("relatorio.pdf"))
                                .param("titulo", "Relatorio parcial")
                                .param("categoria", "relatorio")
                                .header("Authorization", authHeader(aluno.token())))
                        .andExpect(status().isCreated())
                        .andReturn().getResponse().getContentAsString()
        );
        Long entregaId = entrega.get("id").asLong();
        assertThat(entrega.get("status").asText()).isEqualTo("PENDING_REVIEW");
        assertThat(entrega.get("totalVersoes").asInt()).isEqualTo(1);

        JsonNode versoes = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/" + projetoId + "/entregas/" + entregaId + "/versoes")
                                .header("Authorization", authHeader(aluno.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        Long versaoId = versoes.get(0).get("id").asLong();

        mockMvc.perform(post("/api/projetos/" + projetoId + "/entregas/" + entregaId + "/versoes/" + versaoId + "/revisao")
                        .header("Authorization", authHeader(aluno.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("decisao", "APPROVED"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/projetos/" + projetoId + "/entregas/" + entregaId + "/versoes/" + versaoId + "/revisao")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("decisao", "CHANGES_REQUESTED", "comentario", "Ajuste o capitulo 2"))))
                .andExpect(status().isOk());

        String statusAposAjuste = jdbc.queryForObject(
                "SELECT status FROM project_deliveries WHERE id = ?", String.class, entregaId);
        assertThat(statusAposAjuste).isEqualTo("CHANGES_REQUESTED");

        mockMvc.perform(multipart("/api/projetos/" + projetoId + "/entregas/" + entregaId + "/versoes")
                        .file(pdf("relatorio2.pdf"))
                        .header("Authorization", authHeader(orientador.token())))
                .andExpect(status().isForbidden());

        JsonNode reenvio = objectMapper.readTree(
                mockMvc.perform(multipart("/api/projetos/" + projetoId + "/entregas/" + entregaId + "/versoes")
                                .file(pdf("relatorio2.pdf"))
                                .header("Authorization", authHeader(aluno.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(reenvio.get("status").asText()).isEqualTo("PENDING_REVIEW");
        assertThat(reenvio.get("totalVersoes").asInt()).isEqualTo(2);

        JsonNode versoes2 = objectMapper.readTree(
                mockMvc.perform(get("/api/projetos/" + projetoId + "/entregas/" + entregaId + "/versoes")
                                .header("Authorization", authHeader(orientador.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );
        assertThat(versoes2).hasSize(2);
        Long versao2Id = versoes2.get(1).get("id").asLong();

        mockMvc.perform(post("/api/projetos/" + projetoId + "/entregas/" + entregaId + "/versoes/" + versao2Id + "/revisao")
                        .header("Authorization", authHeader(orientador.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("decisao", "APPROVED"))))
                .andExpect(status().isOk());

        String statusFinal = jdbc.queryForObject(
                "SELECT status FROM project_deliveries WHERE id = ?", String.class, entregaId);
        assertThat(statusFinal).isEqualTo("APPROVED");

        mockMvc.perform(get("/api/projetos/" + projetoId + "/entregas/" + entregaId + "/versoes/" + versao2Id + "/download")
                        .header("Authorization", authHeader(orientador.token())))
                .andExpect(status().isOk());
    }

    @Test
    void alunoExternoNaoAcessaEntregasDeOutroProjeto() throws Exception {
        TestUser orientador = registerOrientador("entrega-externo-orient");
        TestUser alunoAprovado = registerAluno("entrega-aprovado");
        TestUser alunoExterno = registerAluno("entrega-externo");

        Integer cursoId = createCurso("Ciencia da Computacao");
        Integer areaId = createArea("Seguranca", cursoId);
        Integer projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Fechado", areaId);

        Integer inscricaoId = inscreverAluno(alunoAprovado.token(), projetoId);
        aprovarInscricao(orientador.token(), inscricaoId);

        mockMvc.perform(multipart("/api/projetos/" + projetoId + "/entregas")
                        .file(pdf("relatorio.pdf"))
                        .param("titulo", "Relatorio")
                        .param("categoria", "relatorio")
                        .header("Authorization", authHeader(alunoAprovado.token())))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/projetos/" + projetoId + "/entregas")
                        .header("Authorization", authHeader(alunoExterno.token())))
                .andExpect(status().isForbidden());
    }
}
