package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.LoginRequest;
import com.example.tcc_backend.dto.request.RegisterRequest;
import com.example.tcc_backend.dto.response.AuthResponse;
import com.example.tcc_backend.model.Aluno;
import com.example.tcc_backend.model.Curso;
import com.example.tcc_backend.model.Orientador;
import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.AlunoRepository;
import com.example.tcc_backend.repository.CursoRepository;
import com.example.tcc_backend.repository.OrientadorRepository;
import com.example.tcc_backend.repository.UsuarioRepository;
import com.example.tcc_backend.security.AuthHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AlunoRepository alunoRepository;
    @Mock
    private OrientadorRepository orientadorRepository;
    @Mock
    private CursoRepository cursoRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private AuthHelper authHelper;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerDeveNormalizarCamposSalvarUsuarioEAlunoERetornarToken() {
        RegisterRequest request = new RegisterRequest();
        request.setNome("  Rodrigo  ");
        request.setEmail("  RODRIGO@TESTE.COM  ");
        request.setSenha("12345678");
        request.setRa(" 12345 ");
        request.setCursoId(10);
        request.setSemestre(3);
        request.setInteresses("Backend");

        Curso curso = Curso.builder().id(10).nome("ADS").build();

        when(usuarioRepository.existsByEmail("rodrigo@teste.com")).thenReturn(false);
        when(passwordEncoder.encode("12345678")).thenReturn("senha-codificada");
        when(cursoRepository.findById(10)).thenReturn(Optional.of(curso));
        when(jwtService.generateToken(any(Usuario.class))).thenReturn("jwt-token");

        AuthResponse response = authService.register(request);

        ArgumentCaptor<Usuario> usuarioCaptor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(usuarioCaptor.capture());

        Usuario usuarioSalvo = usuarioCaptor.getValue();
        assertThat(usuarioSalvo.getNome()).isEqualTo("Rodrigo");
        assertThat(usuarioSalvo.getEmail()).isEqualTo("rodrigo@teste.com");
        assertThat(usuarioSalvo.getSenha()).isEqualTo("senha-codificada");
        assertThat(usuarioSalvo.getTipo()).isEqualTo(TipoUsuario.ALUNO);
        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getUsuario()).isNotNull();
        assertThat(response.getUsuario().getTipo()).isEqualTo(TipoUsuario.ALUNO);
        assertThat(response.getUsuario().getRa()).isEqualTo("12345");
        assertThat(response.getUsuario().getCursoId()).isEqualTo(10);

        verify(alunoRepository).save(any(Aluno.class));
        verify(orientadorRepository, never()).save(any(Orientador.class));
    }

    @Test
    void registerDeveSalvarOrientadorQuandoTipoSolicitadoForOrientador() {
        RegisterRequest request = new RegisterRequest();
        request.setNome("  Maria  ");
        request.setEmail("  MARIA@TESTE.COM  ");
        request.setSenha("12345678");
        request.setTipo(TipoUsuario.ORIENTADOR);
        request.setInstituicao("Universidade");
        request.setDepartamento(" Computacao ");
        request.setTitulacao(" Doutora ");

        when(usuarioRepository.existsByEmail("maria@teste.com")).thenReturn(false);
        when(passwordEncoder.encode("12345678")).thenReturn("senha-codificada");
        when(jwtService.generateToken(any(Usuario.class))).thenReturn("jwt-orientador");

        AuthResponse response = authService.register(request);

        ArgumentCaptor<Usuario> usuarioCaptor = ArgumentCaptor.forClass(Usuario.class);
        ArgumentCaptor<Orientador> orientadorCaptor = ArgumentCaptor.forClass(Orientador.class);
        verify(usuarioRepository).save(usuarioCaptor.capture());
        verify(orientadorRepository).save(orientadorCaptor.capture());

        Usuario usuarioSalvo = usuarioCaptor.getValue();
        Orientador orientadorSalvo = orientadorCaptor.getValue();

        assertThat(usuarioSalvo.getTipo()).isEqualTo(TipoUsuario.ORIENTADOR);
        assertThat(orientadorSalvo.getUsuario()).isEqualTo(usuarioSalvo);
        assertThat(orientadorSalvo.getDepartamento()).isEqualTo("Computacao");
        assertThat(orientadorSalvo.getTitulacao()).isEqualTo("Doutora");
        assertThat(response.getToken()).isEqualTo("jwt-orientador");
        assertThat(response.getUsuario().getTipo()).isEqualTo(TipoUsuario.ORIENTADOR);
        assertThat(response.getUsuario().getDepartamento()).isEqualTo("Computacao");
        assertThat(response.getUsuario().getTitulacao()).isEqualTo("Doutora");

        verify(alunoRepository, never()).save(any(Aluno.class));
    }

    @Test
    void registerDeveNegarCadastroPublicoDeAdmin() {
        RegisterRequest request = new RegisterRequest();
        request.setNome("Admin");
        request.setEmail("admin@teste.com");
        request.setSenha("12345678");
        request.setTipo(TipoUsuario.ADMIN);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void registerDeveRetornarConflitoQuandoEmailJaExiste() {
        RegisterRequest request = new RegisterRequest();
        request.setNome("Rodrigo");
        request.setEmail("rodrigo@teste.com");
        request.setSenha("12345678");
        request.setRa("12345");

        when(usuarioRepository.existsByEmail("rodrigo@teste.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void loginDeveAutenticarEBuscarUsuarioParaGerarToken() {
        LoginRequest request = new LoginRequest();
        request.setEmail("rodrigo@teste.com");
        request.setSenha("12345678");

        Usuario usuario = Usuario.builder()
                .id(1)
                .nome("Rodrigo")
                .email("rodrigo@teste.com")
                .senha("hash")
                .build();

        when(usuarioRepository.findByEmail("rodrigo@teste.com")).thenReturn(Optional.of(usuario));
        when(alunoRepository.findByUsuarioId(1)).thenReturn(Optional.empty());
        when(orientadorRepository.findByUsuarioId(1)).thenReturn(Optional.empty());
        when(jwtService.generateToken(usuario)).thenReturn("jwt-login");

        AuthResponse response = authService.login(request);

        verify(authenticationManager).authenticate(new UsernamePasswordAuthenticationToken("rodrigo@teste.com", "12345678"));
        assertThat(response.getToken()).isEqualTo("jwt-login");
        assertThat(response.getUsuario().getId()).isEqualTo(1);
    }
}
