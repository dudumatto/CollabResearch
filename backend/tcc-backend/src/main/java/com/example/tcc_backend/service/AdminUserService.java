package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.AdminAtivoRequest;
import com.example.tcc_backend.dto.request.AdminUsuarioRequest;
import com.example.tcc_backend.dto.response.PageResponse;
import com.example.tcc_backend.dto.response.UsuarioProfileResponse;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.AlunoRepository;
import com.example.tcc_backend.repository.CursoRepository;
import com.example.tcc_backend.repository.OrientadorRepository;
import com.example.tcc_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UsuarioRepository usuarioRepository;
    private final AlunoRepository alunoRepository;
    private final OrientadorRepository orientadorRepository;
    private final CursoRepository cursoRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminAccessService accessService;
    private final AdminAuditService auditService;

    public PageResponse<UsuarioProfileResponse> list(TipoUsuario tipo, String busca, int page, int size) {
        accessService.requireAdmin();
        validatePage(page, size);
        Specification<Usuario> spec = (root, query, cb) -> cb.conjunction();
        if (tipo != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("tipo"), tipo));
        }
        if (busca != null && !busca.isBlank()) {
            String term = "%" + busca.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("nome")), term),
                    cb.like(cb.lower(root.get("email")), term)
            ));
        }
        Page<UsuarioProfileResponse> result = usuarioRepository.findAll(
                spec,
                PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "dataCadastro"))
        ).map(this::profile);
        return PageResponse.from(result);
    }

    public UsuarioProfileResponse find(Integer id) {
        accessService.requireAdmin();
        return profile(getUsuario(id));
    }

    @Transactional
    public UsuarioProfileResponse create(AdminUsuarioRequest dto) {
        accessService.requireAdmin();
        if (dto.getSenha() == null || dto.getSenha().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha obrigatoria para novo usuario");
        }
        String email = dto.getEmail().trim().toLowerCase();
        if (usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email ja cadastrado");
        }

        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .nome(dto.getNome().trim())
                .email(email)
                .senha(passwordEncoder.encode(dto.getSenha()))
                .tipo(dto.getTipo())
                .ativo(dto.getAtivo())
                .instituicao(text(dto.getInstituicao()))
                .bio(text(dto.getBio()))
                .tema("sistema")
                .notificacoesAtivas(true)
                .build());
        saveRoleDetails(usuario, dto, true);
        auditService.record("CRIAR", "USUARIO", usuario.getId(), usuario.getEmail());
        return profile(usuario);
    }

    @Transactional
    public UsuarioProfileResponse update(Integer id, AdminUsuarioRequest dto) {
        accessService.requireAdmin();
        Usuario usuario = getUsuario(id);
        if (usuario.getTipo() != dto.getTipo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Alteracao de tipo de usuario nao suportada");
        }
        String email = dto.getEmail().trim().toLowerCase();
        usuarioRepository.findByEmail(email)
                .filter(encontrado -> !encontrado.getId().equals(id))
                .ifPresent(encontrado -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email ja cadastrado");
                });

        usuario.setNome(dto.getNome().trim());
        usuario.setEmail(email);
        usuario.setInstituicao(text(dto.getInstituicao()));
        usuario.setBio(text(dto.getBio()));
        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            usuario.setSenha(passwordEncoder.encode(dto.getSenha()));
        }
        saveRoleDetails(usuario, dto, false);
        usuarioRepository.save(usuario);
        auditService.record("ATUALIZAR", "USUARIO", usuario.getId(), usuario.getEmail());
        return profile(usuario);
    }

    @Transactional
    public UsuarioProfileResponse setAtivo(Integer id, AdminAtivoRequest dto) {
        Usuario admin = accessService.requireAdmin();
        Usuario usuario = getUsuario(id);
        if (admin.getId().equals(id) && !Boolean.TRUE.equals(dto.getAtivo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrador nao pode desativar a propria conta");
        }
        usuario.setAtivo(dto.getAtivo());
        usuarioRepository.save(usuario);
        auditService.record("ALTERAR_STATUS", "USUARIO", id, Boolean.TRUE.equals(dto.getAtivo()) ? "ativo" : "inativo");
        return profile(usuario);
    }

    private void saveRoleDetails(Usuario usuario, AdminUsuarioRequest dto, boolean novo) {
        if (usuario.getTipo() == TipoUsuario.ALUNO) {
            if (dto.getRa() == null || dto.getRa().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "RA obrigatorio para aluno");
            }
            Aluno aluno = novo ? new Aluno() : alunoRepository.findByUsuarioId(usuario.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado"));
            aluno.setUsuario(usuario);
            aluno.setRa(dto.getRa().trim());
            aluno.setSemestre(dto.getSemestre());
            aluno.setCurso(findCurso(dto.getCursoId()));
            aluno.setInteresses(text(dto.getInteresses()));
            alunoRepository.save(aluno);
        }
        if (usuario.getTipo() == TipoUsuario.ORIENTADOR) {
            if (dto.getDepartamento() == null || dto.getDepartamento().isBlank()
                    || dto.getTitulacao() == null || dto.getTitulacao().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Departamento e titulacao obrigatorios para orientador");
            }
            Orientador orientador = novo ? new Orientador() : orientadorRepository.findByUsuarioId(usuario.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Orientador nao encontrado"));
            orientador.setUsuario(usuario);
            orientador.setDepartamento(dto.getDepartamento().trim());
            orientador.setTitulacao(dto.getTitulacao().trim());
            orientadorRepository.save(orientador);
        }
    }

    private Curso findCurso(Integer cursoId) {
        return cursoId == null ? null : cursoRepository.findById(cursoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Curso nao encontrado"));
    }

    private UsuarioProfileResponse profile(Usuario usuario) {
        return UsuarioProfileResponse.from(
                usuario,
                alunoRepository.findByUsuarioId(usuario.getId()).orElse(null),
                orientadorRepository.findByUsuarioId(usuario.getId()).orElse(null)
        );
    }

    private Usuario getUsuario(Integer id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));
    }

    private String text(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paginacao invalida");
        }
    }
}
