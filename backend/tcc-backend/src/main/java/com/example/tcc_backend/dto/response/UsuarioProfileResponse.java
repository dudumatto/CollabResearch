package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Aluno;
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
public class UsuarioProfileResponse {

    private Integer id;
    private String nome;
    private String email;
    private TipoUsuario tipo;
    private LocalDateTime dataCadastro;
    private Boolean ativo;
    private String instituicao;
    private String bio;
    private String fotoPerfilUrl;
    private String tema;
    private Boolean notificacoesAtivas;
    private String ra;
    private Integer semestre;
    private String interesses;
    private Integer cursoId;
    private String cursoNome;
    private String departamento;
    private String titulacao;

    public static UsuarioProfileResponse from(Usuario usuario, Aluno aluno, Orientador orientador) {
        return UsuarioProfileResponse.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .tipo(usuario.getTipo())
                .dataCadastro(usuario.getDataCadastro())
                .ativo(usuario.getAtivo())
                .instituicao(usuario.getInstituicao())
                .bio(usuario.getBio())
                .fotoPerfilUrl(usuario.getFotoPerfilUrl())
                .tema(usuario.getTema())
                .notificacoesAtivas(usuario.getNotificacoesAtivas())
                .ra(aluno != null ? aluno.getRa() : null)
                .semestre(aluno != null ? aluno.getSemestre() : null)
                .interesses(aluno != null ? aluno.getInteresses() : null)
                .cursoId(aluno != null && aluno.getCurso() != null ? aluno.getCurso().getId() : null)
                .cursoNome(aluno != null && aluno.getCurso() != null ? aluno.getCurso().getNome() : null)
                .departamento(orientador != null ? orientador.getDepartamento() : null)
                .titulacao(orientador != null ? orientador.getTitulacao() : null)
                .build();
    }
}
