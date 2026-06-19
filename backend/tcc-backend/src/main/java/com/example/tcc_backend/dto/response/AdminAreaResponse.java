package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.AreaPesquisa;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminAreaResponse {
    private Integer id;
    private String nome;
    private Integer cursoId;
    private String cursoNome;

    public static AdminAreaResponse fromEntity(AreaPesquisa area) {
        return AdminAreaResponse.builder()
                .id(area.getId())
                .nome(area.getNome())
                .cursoId(area.getCurso() == null ? null : area.getCurso().getId())
                .cursoNome(area.getCurso() == null ? null : area.getCurso().getNome())
                .build();
    }
}
