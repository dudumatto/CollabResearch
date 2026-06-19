package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.response.IdNomeResponse;
import com.example.tcc_backend.repository.AreaPesquisaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AreaPesquisaCatalogService {

    private final AreaPesquisaRepository repository;

    public AreaPesquisaCatalogService(AreaPesquisaRepository repository) {
        this.repository = repository;
    }

    public List<IdNomeResponse> list() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome"))
                .stream()
                .map(area -> new IdNomeResponse(area.getId(), area.getNome()))
                .toList();
    }
}

