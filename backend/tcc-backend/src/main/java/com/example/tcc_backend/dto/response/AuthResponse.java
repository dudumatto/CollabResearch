package com.example.tcc_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UsuarioProfileResponse usuario;

    public AuthResponse(String token) {
        this.token = token;
    }
}
