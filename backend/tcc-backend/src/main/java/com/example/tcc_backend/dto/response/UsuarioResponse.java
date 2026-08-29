package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.function.Function;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResponse {

    private Integer id;
    private String nome;
    private String email;
    private TipoUsuario tipo;
    private LocalDateTime dataCadastro;
    private Boolean ativo;
    private String fotoPerfilUrl;
    private String avatarUrl;

    public static UsuarioResponse fromEntity(Usuario usuario) {
        return fromEntity(usuario, Function.identity());
    }

    public static UsuarioResponse fromEntity(Usuario usuario, Function<String, String> fotoPerfilResolver) {
        Function<String, String> resolver = fotoPerfilResolver != null ? fotoPerfilResolver : Function.identity();
        String fotoPerfilUrl = resolver.apply(usuario.getFotoPerfilUrl());

        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .tipo(usuario.getTipo())
                .dataCadastro(usuario.getDataCadastro())
                .ativo(usuario.getAtivo())
                .fotoPerfilUrl(fotoPerfilUrl)
                .avatarUrl(fotoPerfilUrl)
                .build();
    }
}
