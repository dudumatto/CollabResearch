package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.AdminAtivoRequest;
import com.example.tcc_backend.dto.request.AdminUsuarioRequest;
import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.AlunoRepository;
import com.example.tcc_backend.repository.CursoRepository;
import com.example.tcc_backend.repository.OrientadorRepository;
import com.example.tcc_backend.repository.UsuarioRepository;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private AlunoRepository alunoRepository;
    @Mock private OrientadorRepository orientadorRepository;
    @Mock private CursoRepository cursoRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AdminAccessService accessService;
    @Mock private AdminAuditService auditService;

    @InjectMocks
    private AdminUserService service;

    @Test
    void createDeveCriarAdministradorSemPerfilAcademico() {
        AdminUsuarioRequest request = new AdminUsuarioRequest();
        request.setNome("Nova Admin");
        request.setEmail("ADMIN@teste.com");
        request.setSenha("senha-forte");
        request.setTipo(TipoUsuario.ADMIN);

        when(passwordEncoder.encode("senha-forte")).thenReturn("hash");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario usuario = invocation.getArgument(0);
            usuario.setId(10);
            return usuario;
        });
        when(alunoRepository.findByUsuarioId(10)).thenReturn(Optional.empty());
        when(orientadorRepository.findByUsuarioId(10)).thenReturn(Optional.empty());

        var response = service.create(request);

        assertThat(response.getTipo()).isEqualTo(TipoUsuario.ADMIN);
        assertThat(response.getEmail()).isEqualTo("admin@teste.com");
        verify(auditService).record("CRIAR", "USUARIO", 10, "admin@teste.com");
        verify(alunoRepository, never()).save(any());
        verify(orientadorRepository, never()).save(any());
    }

    @Test
    void setAtivoDeveImpedirAutoDesativacao() {
        Usuario admin = TestDataFactory.usuarioAdmin(5);
        AdminAtivoRequest request = new AdminAtivoRequest();
        request.setAtivo(false);
        when(accessService.requireAdmin()).thenReturn(admin);
        when(usuarioRepository.findById(5)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.setAtivo(5, request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void listDeveRejeitarPaginacaoInvalida() {
        assertThatThrownBy(() -> service.list(null, null, -1, 20))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
