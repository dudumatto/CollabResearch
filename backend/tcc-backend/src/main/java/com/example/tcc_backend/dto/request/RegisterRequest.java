package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import com.example.tcc_backend.model.TipoUsuario;

@Data
public class RegisterRequest {

    @NotBlank(message = "Nome obrigatorio")
    @Size(max = 120, message = "Nome deve ter no maximo 120 caracteres")
    private String nome;

    @NotBlank(message = "Email obrigatorio")
    @Email(message = "Email invalido")
    @Size(max = 120, message = "Email deve ter no maximo 120 caracteres")
    private String email;

    @NotBlank(message = "Senha obrigatoria")
    @Size(min = 8, max = 72, message = "Senha deve ter entre 8 e 72 caracteres")
    private String senha;

    @Size(max = 20, message = "RA deve ter no maximo 20 caracteres")
    private String ra;

    private TipoUsuario tipo;
    private Integer cursoId;
    private Integer semestre;
    private String instituicao;
    private String departamento;
    private String titulacao;
    private String bio;
    private String interesses;
}
