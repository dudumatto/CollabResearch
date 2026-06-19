package com.example.tcc_backend.service;

import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AdminBootstrapInitializer implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.bootstrap.name:}")
    private String adminName;

    @Value("${admin.bootstrap.email:}")
    private String adminEmail;

    @Value("${admin.bootstrap.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminEmail == null || adminEmail.isBlank()) {
            return;
        }
        if (adminPassword == null || adminPassword.length() < 8) {
            throw new IllegalStateException("ADMIN_BOOTSTRAP_PASSWORD deve ter pelo menos 8 caracteres");
        }

        String email = adminEmail.trim().toLowerCase();
        if (usuarioRepository.existsByEmail(email)) {
            return;
        }

        String nome = adminName == null || adminName.isBlank() ? "Administrador" : adminName.trim();
        usuarioRepository.save(Usuario.builder()
                .nome(nome)
                .email(email)
                .senha(passwordEncoder.encode(adminPassword))
                .tipo(TipoUsuario.ADMIN)
                .tema("sistema")
                .notificacoesAtivas(true)
                .build());
    }
}
