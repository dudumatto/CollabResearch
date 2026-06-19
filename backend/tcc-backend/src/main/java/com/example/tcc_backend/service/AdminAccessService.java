package com.example.tcc_backend.service;

import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminAccessService {

    private final AuthHelper authHelper;

    public Usuario requireAdmin() {
        Usuario usuario = authHelper.getCurrentUser();
        if (usuario.getTipo() != TipoUsuario.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso restrito a administradores");
        }
        return usuario;
    }
}
