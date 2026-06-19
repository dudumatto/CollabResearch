package com.example.tcc_backend.dto.request;

import com.example.tcc_backend.model.TipoUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUsuarioRequest {

    @NotBlank(message = "Nome obrigatorio")
    @Size(max = 100)
    private String nome;

    @NotBlank(message = "Email obrigatorio")
    @Email(message = "Email invalido")
    @Size(max = 100)
    private String email;

    @Size(min = 8, max = 120, message = "Senha deve ter entre 8 e 120 caracteres")
    private String senha;

    @NotNull(message = "Tipo obrigatorio")
    private TipoUsuario tipo;

    private Boolean ativo;

    @Size(max = 150)
    private String instituicao;

    @Size(max = 2000)
    private String bio;

    @Size(max = 20)
    private String ra;

    private Integer semestre;
    private Integer cursoId;

    @Size(max = 2000)
    private String interesses;

    @Size(max = 100)
    private String departamento;

    @Size(max = 50)
    private String titulacao;
}
