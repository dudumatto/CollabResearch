package com.example.tcc_backend.controller;

import com.example.tcc_backend.model.AreaPesquisa;
import com.example.tcc_backend.model.Curso;
import com.example.tcc_backend.model.Projeto;
import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.repository.AreaPesquisaRepository;
import com.example.tcc_backend.repository.CursoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:projeto-criacao-e2e;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.hikari.data-source-properties.sslmode=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "jwt.secret=test-secret-value-with-at-least-32-bytes!!"
})
@AutoConfigureMockMvc
class ProjetoCriacaoPersistenceE2ETest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CursoRepository cursoRepository;

    @Autowired
    private AreaPesquisaRepository areaPesquisaRepository;

    @Autowired
    private ProjetoRepository projetoRepository;

    @Test
    void createDevePersistirTodosOsCamposDoProjetoNoBancoERetornarNaApi() throws Exception {
        Curso curso = cursoRepository.save(Curso.builder().nome("Ciencia da Computacao").build());
        AreaPesquisa area = areaPesquisaRepository.save(AreaPesquisa.builder().nome("Inteligencia Artificial").curso(curso).build());

        String orientadorToken = registrarOrientadorERetornarToken();
        String alunoToken = registrarAlunoERetornarToken(curso.getId());
        String titulo = "Projeto completo com competencias";
        String descricao = "Sobre o projeto criado em teste E2E real.";
        String requisitos = "Java, SQL";
        String tecnologias = "React, Spring Boot, PostgreSQL";

        String createdBody = mockMvc.perform(post("/api/projetos")
                        .header("Authorization", "Bearer " + orientadorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "titulo", titulo,
                                "descricao", descricao,
                                "requisitos", List.of("Java", "SQL"),
                                "competencias", List.of("React", "Spring Boot", "PostgreSQL"),
                                "areaId", area.getId(),
                                "vagas", 4,
                                "dataInicio", "2026-06-01",
                                "dataFim", "2026-12-15",
                                "dataLimiteInscricao", "2026-06-10"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.titulo").value(titulo))
                .andExpect(jsonPath("$.descricao").value(descricao))
                .andExpect(jsonPath("$.requisitos").value(requisitos))
                .andExpect(jsonPath("$.tecnologias").value(tecnologias))
                .andExpect(jsonPath("$.vagas").value(4))
                .andExpect(jsonPath("$.areaId").value(area.getId()))
                .andExpect(jsonPath("$.areaNome").value("Inteligencia Artificial"))
                .andExpect(jsonPath("$.cursoNome").value("Ciencia da Computacao"))
                .andExpect(jsonPath("$.status").value("ABERTO"))
                .andExpect(jsonPath("$.dataInicio").value("2026-06-01"))
                .andExpect(jsonPath("$.dataFim").value("2026-12-15"))
                .andExpect(jsonPath("$.dataLimiteInscricao").value("2026-06-10"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        int projetoId = objectMapper.readTree(createdBody).get("id").asInt();

        Projeto persisted = projetoRepository.findById(projetoId).orElseThrow();
        assertThat(persisted.getTitulo()).isEqualTo(titulo);
        assertThat(persisted.getDescricao()).isEqualTo(descricao);
        assertThat(persisted.getRequisitos()).isEqualTo(requisitos);
        assertThat(persisted.getTecnologias()).isEqualTo(tecnologias);
        assertThat(persisted.getVagas()).isEqualTo(4);
        assertThat(persisted.getArea().getCurso().getNome()).isEqualTo("Ciencia da Computacao");

        mockMvc.perform(get("/api/projetos/{id}", projetoId)
                        .header("Authorization", "Bearer " + orientadorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value(titulo))
                .andExpect(jsonPath("$.descricao").value(descricao))
                .andExpect(jsonPath("$.requisitos").value(requisitos))
                .andExpect(jsonPath("$.vagas").value(4))
                .andExpect(jsonPath("$.cursoNome").value("Ciencia da Computacao"))
                .andExpect(jsonPath("$.tecnologias").value(tecnologias));

        String inscricaoBody = mockMvc.perform(post("/api/inscricoes")
                        .header("Authorization", "Bearer " + alunoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "projetoId", projetoId,
                                "motivacao", "Quero participar da pesquisa."
                        ))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        int inscricaoId = objectMapper.readTree(inscricaoBody).get("id").asInt();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/inscricoes/{id}/aprovar", inscricaoId)
                        .header("Authorization", "Bearer " + orientadorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("parecerOrientador", "Aprovado para avaliacao."))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/feedback")
                        .header("Authorization", "Bearer " + alunoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "projetoId", projetoId,
                                "nota", 5,
                                "comentario", "Avaliacao real do projeto."
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nota").value(5))
                .andExpect(jsonPath("$.comentario").value("Avaliacao real do projeto."));

        mockMvc.perform(get("/api/feedback/projeto/{id}", projetoId)
                        .header("Authorization", "Bearer " + orientadorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nota").value(5))
                .andExpect(jsonPath("$[0].comentario").value("Avaliacao real do projeto."));
    }

    private String registrarOrientadorERetornarToken() throws Exception {
        String responseBody = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nome", "Orientador E2E",
                                "email", "orientador.e2e@example.com",
                                "senha", "SenhaE2E123!",
                                "tipo", TipoUsuario.ORIENTADOR,
                                "departamento", "Computacao",
                                "titulacao", "Doutor"
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(responseBody);
        return json.get("token").asText();
    }

    private String registrarAlunoERetornarToken(Integer cursoId) throws Exception {
        String responseBody = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nome", "Aluno Avaliador E2E",
                                "email", "aluno.avaliador.e2e@example.com",
                                "senha", "SenhaE2E123!",
                                "tipo", TipoUsuario.ALUNO,
                                "ra", "123456",
                                "cursoId", cursoId,
                                "semestre", 4
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(responseBody);
        return json.get("token").asText();
    }
}
