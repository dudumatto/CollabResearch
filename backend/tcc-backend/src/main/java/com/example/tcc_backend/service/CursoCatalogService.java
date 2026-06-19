package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.response.IdNomeResponse;
import com.example.tcc_backend.repository.CursoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CursoCatalogService {

    private final CursoRepository repository;

    public CursoCatalogService(CursoRepository repository) {
        this.repository = repository;
    }

    public List<IdNomeResponse> list() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome"))
                .stream()
                .map(curso -> new IdNomeResponse(curso.getId(), curso.getNome()))
                .toList();
    }
}

