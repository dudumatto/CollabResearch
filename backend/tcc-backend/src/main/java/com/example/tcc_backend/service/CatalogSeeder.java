package com.example.tcc_backend.service;

import com.example.tcc_backend.model.AreaPesquisa;
import com.example.tcc_backend.model.Curso;
import com.example.tcc_backend.repository.AreaPesquisaRepository;
import com.example.tcc_backend.repository.CursoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@Profile({"dev", "test"})
@RequiredArgsConstructor
public class CatalogSeeder implements ApplicationRunner {

    private final AreaPesquisaRepository areaRepository;
    private final CursoRepository cursoRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedCursos();
        seedAreas();
    }

    private void seedCursos() {
        if (cursoRepository.count() > 0) {
            return;
        }
        List<String> nomes = List.of(
                "Ciencia da Computacao",
                "Engenharia de Software",
                "Sistemas de Informacao",
                "Engenharia da Computacao"
        );
        for (String nome : nomes) {
            cursoRepository.save(Curso.builder().nome(nome).build());
        }
        log.info("CatalogSeeder: {} cursos criados", nomes.size());
    }

    private void seedAreas() {
        if (areaRepository.count() > 0) {
            return;
        }
        List<String> nomes = List.of(
                "Inteligencia Artificial",
                "Engenharia de Software",
                "Banco de Dados",
                "Redes de Computadores",
                "Ciencia de Dados",
                "Seguranca da Informacao"
        );
        for (String nome : nomes) {
            if (!areaRepository.existsByNomeIgnoreCase(nome)) {
                areaRepository.save(AreaPesquisa.builder().nome(nome).build());
            }
        }
        log.info("CatalogSeeder: areas de pesquisa criadas");
    }
}
