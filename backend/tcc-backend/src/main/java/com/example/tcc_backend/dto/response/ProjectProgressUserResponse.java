package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectProgressUserResponse {
    private Integer id;
    private String nome;
    private TipoUsuario tipo;

    public static ProjectProgressUserResponse fromEntity(Usuario usuario) {
        if (usuario == null) {
            return null;
        }

        return ProjectProgressUserResponse.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .tipo(usuario.getTipo())
                .build();
    }
}
