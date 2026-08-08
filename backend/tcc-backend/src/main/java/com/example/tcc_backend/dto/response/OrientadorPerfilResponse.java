package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Orientador;
import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrientadorPerfilResponse {

    private Integer id;
    private String nome;
    private String email;
    private TipoUsuario tipo;
    private LocalDateTime dataCadastro;
    private String instituicao;
    private String bio;
    private String fotoPerfilUrl;
    private String departamento;
    private String titulacao;
    private long projetos;
    private long orientandos;
    private long avaliacoes;

    public static OrientadorPerfilResponse from(Usuario usuario, Orientador orientador,
                                                long projetos, long orientandos, long avaliacoes) {
        return OrientadorPerfilResponse.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .tipo(usuario.getTipo())
                .dataCadastro(usuario.getDataCadastro())
                .instituicao(usuario.getInstituicao())
                .bio(usuario.getBio())
                .fotoPerfilUrl(usuario.getFotoPerfilUrl())
                .departamento(orientador != null ? orientador.getDepartamento() : null)
                .titulacao(orientador != null ? orientador.getTitulacao() : null)
                .projetos(projetos)
                .orientandos(orientandos)
                .avaliacoes(avaliacoes)
                .build();
    }
}
