package com.example.tcc_backend.functional;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CatalogFunctionalTest extends FunctionalTestSupport {

    @Test
    void listarCursosDeveRetornarListaNaoVazia() throws Exception {
        createCurso("Ciencia da Computacao");
        createCurso("Engenharia de Software");

        JsonNode cursos = objectMapper.readTree(
                mockMvc.perform(get("/api/cursos"))
                        .andExpect(status().isOk())
                        .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(cursos.isArray()).isTrue();
        assertThat(cursos.size()).isGreaterThanOrEqualTo(2);

        boolean hasCiencia = false;
        boolean hasEngenharia = false;
        for (JsonNode curso : cursos) {
            String nome = curso.get("nome").asText();
            if (nome.contains("Ciencia")) hasCiencia = true;
            if (nome.contains("Engenharia")) hasEngenharia = true;
        }
        assertThat(hasCiencia).isTrue();
        assertThat(hasEngenharia).isTrue();
    }

    @Test
    void listarCursosDeveSerPublico() throws Exception {
        mockMvc.perform(get("/api/cursos"))
                .andExpect(status().isOk());
    }

    @Test
    void listarAreasDeveRetornarListaNaoVazia() throws Exception {
        TestUser user = registerAluno("area-list");
        Integer cursoId = createCurso("Computacao");
        createArea("Inteligencia Artificial", cursoId);
        createArea("Redes", cursoId);

        JsonNode areas = objectMapper.readTree(
                mockMvc.perform(get("/api/areas")
                                .header("Authorization", authHeader(user.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(areas.isArray()).isTrue();
        assertThat(areas.size()).isGreaterThanOrEqualTo(2);

        boolean hasIA = false;
        boolean hasRedes = false;
        for (JsonNode area : areas) {
            String nome = area.get("nome").asText();
            if (nome.contains("Inteligencia")) hasIA = true;
            if (nome.contains("Redes")) hasRedes = true;
        }
        assertThat(hasIA).isTrue();
        assertThat(hasRedes).isTrue();
    }

    @Test
    void listarAreasDeveRetornarCampoId() throws Exception {
        TestUser user = registerAluno("area-id");
        Integer cursoId = createCurso("Matematica");
        Integer areaId = createArea("Algebra", cursoId);

        JsonNode areas = objectMapper.readTree(
                mockMvc.perform(get("/api/areas")
                                .header("Authorization", authHeader(user.token())))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString()
        );

        assertThat(areas.isArray()).isTrue();
        assertThat(areas.size()).isGreaterThanOrEqualTo(1);

        boolean found = false;
        for (JsonNode area : areas) {
            if (area.get("id").asInt() == areaId) {
                found = true;
                assertThat(area.get("nome").asText()).isEqualTo("Algebra");
            }
        }
        assertThat(found).isTrue();
    }
}