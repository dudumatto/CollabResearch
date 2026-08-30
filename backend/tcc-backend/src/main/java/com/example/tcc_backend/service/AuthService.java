package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.ChangePasswordRequest;
import com.example.tcc_backend.dto.request.LoginRequest;
import com.example.tcc_backend.dto.request.RegisterRequest;
import com.example.tcc_backend.dto.response.AuthResponse;
import com.example.tcc_backend.dto.response.UsuarioProfileResponse;
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
import com.example.tcc_backend.security.LoginBruteForceProtectionService;
import com.example.tcc_backend.security.TokenRevocationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final AlunoRepository alunoRepository;
    private final OrientadorRepository orientadorRepository;
    private final CursoRepository cursoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AuthHelper authHelper;
    private final TokenRevocationService tokenRevocationService;
    private final LoginBruteForceProtectionService bruteForceProtectionService;

    public AuthService(UsuarioRepository usuarioRepository,
                       AlunoRepository alunoRepository,
                       OrientadorRepository orientadorRepository,
                       CursoRepository cursoRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       AuthHelper authHelper,
                       TokenRevocationService tokenRevocationService,
                       LoginBruteForceProtectionService bruteForceProtectionService) {
        this.usuarioRepository = usuarioRepository;
        this.alunoRepository = alunoRepository;
        this.orientadorRepository = orientadorRepository;
        this.cursoRepository = cursoRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.authHelper = authHelper;
        this.tokenRevocationService = tokenRevocationService;
        this.bruteForceProtectionService = bruteForceProtectionService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest dto) {
        TipoUsuario tipoSolicitado = dto.getTipo() == null ? TipoUsuario.ALUNO : dto.getTipo();
        if (tipoSolicitado == TipoUsuario.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cadastro publico nao permite administradores");
        }

        String nome = dto.getNome().trim();
        String email = dto.getEmail().trim().toLowerCase();

        if (usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email ja cadastrado");
        }

        Usuario usuario = Usuario.builder()
                .nome(nome)
                .email(email)
                .senha(passwordEncoder.encode(dto.getSenha()))
                .tipo(tipoSolicitado)
                .instituicao(normalizarTexto(dto.getInstituicao()))
                .bio(normalizarTexto(dto.getBio()))
                .tema("sistema")
                .notificacoesAtivas(true)
                .build();

        usuarioRepository.save(usuario);

        if (tipoSolicitado == TipoUsuario.ALUNO) {
            String ra = normalizarObrigatorio(dto.getRa(), "RA obrigatorio para alunos");
            Curso curso = dto.getCursoId() == null ? null : cursoRepository.findById(dto.getCursoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Curso nao encontrado"));

            Aluno aluno = Aluno.builder()
                    .usuario(usuario)
                    .ra(ra)
                    .semestre(dto.getSemestre())
                    .curso(curso)
                    .interesses(normalizarTexto(dto.getInteresses()))
                    .build();
            alunoRepository.save(aluno);

            return new AuthResponse(jwtService.generateToken(usuario), UsuarioProfileResponse.from(usuario, aluno, null));
        }

        Orientador orientador = Orientador.builder()
                .usuario(usuario)
                .departamento(normalizarObrigatorio(dto.getDepartamento(), "Departamento obrigatorio para orientadores"))
                .titulacao(normalizarObrigatorio(dto.getTitulacao(), "Titulacao obrigatoria para orientadores"))
                .build();
        orientadorRepository.save(orientador);

        return new AuthResponse(jwtService.generateToken(usuario), UsuarioProfileResponse.from(usuario, null, orientador));
    }

    public AuthResponse login(LoginRequest dto) {
        return login(dto, "unknown");
    }

    public AuthResponse login(LoginRequest dto, String clientIp) {
        String email = normalizarEmail(dto.getEmail());
        bruteForceProtectionService.assertAllowed(email, clientIp);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, dto.getSenha())
            );
        } catch (AuthenticationException ex) {
            bruteForceProtectionService.recordFailure(email, clientIp);
            throw ex;
        }

        Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow();
        Aluno aluno = alunoRepository.findByUsuarioId(usuario.getId()).orElse(null);
        Orientador orientador = orientadorRepository.findByUsuarioId(usuario.getId()).orElse(null);
        bruteForceProtectionService.recordSuccess(email, clientIp);
        return new AuthResponse(jwtService.generateToken(usuario), UsuarioProfileResponse.from(usuario, aluno, orientador));
    }

    @Transactional
    public void changePassword(ChangePasswordRequest dto) {
        Usuario usuario = authHelper.getCurrentUser();

        if (!passwordEncoder.matches(dto.getSenhaAtual(), usuario.getSenha())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual invalida");
        }

        usuario.setSenha(passwordEncoder.encode(dto.getNovaSenha()));
        usuarioRepository.save(usuario);
        SecurityContextHolder.clearContext();
    }

    public String logout(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        if (token != null) {
            tokenRevocationService.revoke(token);
        }
        SecurityContextHolder.clearContext();
        return "Logout realizado com sucesso";
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null) {
            return null;
        }
        String value = authorizationHeader.trim();
        if (!value.startsWith("Bearer ")) {
            return null;
        }
        String token = value.substring(7).trim();
        return token.isEmpty() ? null : token;
    }

    private String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizarTexto(String valor) {
        if (valor == null) {
            return null;
        }
        String normalizado = valor.trim();
        return normalizado.isEmpty() ? null : normalizado;
    }

    private String normalizarObrigatorio(String valor, String mensagem) {
        String normalizado = normalizarTexto(valor);
        if (normalizado == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensagem);
        }
        return normalizado;
    }
}