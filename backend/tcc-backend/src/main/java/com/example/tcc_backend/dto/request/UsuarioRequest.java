package com.example.tcc_backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRequest {

    @NotBlank(message = "Nome obrigatorio")
    @Size(max = 120, message = "Nome deve ter no maximo 120 caracteres")
    private String nome;

    @NotBlank(message = "Email obrigatorio")
    @Email(message = "Email invalido")
    @Size(max = 120, message = "Email deve ter no maximo 120 caracteres")
    private String email;

    @Size(max = 150, message = "Instituicao deve ter no maximo 150 caracteres")
    private String instituicao;

    @Size(max = 2000, message = "Bio deve ter no maximo 2000 caracteres")
    private String bio;

    @Size(max = 500, message = "Foto de perfil deve ter no maximo 500 caracteres")
    private String fotoPerfilUrl;

    private Integer cursoId;
    private Integer semestre;

    @Size(max = 2000, message = "Interesses deve ter no maximo 2000 caracteres")
    private String interesses;

    @Size(max = 100, message = "Departamento deve ter no maximo 100 caracteres")
    private String departamento;

    @Size(max = 50, message = "Titulacao deve ter no maximo 50 caracteres")
    private String titulacao;
}
