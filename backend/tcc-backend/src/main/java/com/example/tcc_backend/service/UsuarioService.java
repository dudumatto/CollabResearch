package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.UsuarioPreferenciasRequest;
import com.example.tcc_backend.dto.request.UsuarioRequest;
import com.example.tcc_backend.dto.response.UsuarioProfileResponse;
import com.example.tcc_backend.model.Aluno;
import com.example.tcc_backend.model.Curso;
import com.example.tcc_backend.model.Inscricao;
import com.example.tcc_backend.model.Orientador;
import com.example.tcc_backend.model.Projeto;
import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.AlunoRepository;
import com.example.tcc_backend.repository.CursoRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.OrientadorRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.repository.UsuarioRepository;
import com.example.tcc_backend.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final AlunoRepository alunoRepository;
    private final OrientadorRepository orientadorRepository;
    private final CursoRepository cursoRepository;
    private final ProjetoRepository projetoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final AuthHelper authHelper;

    public List<Usuario> findAll() {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (usuarioLogado.getTipo() != TipoUsuario.ORIENTADOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas orientadores podem listar usuarios");
        }
        return usuarioRepository.findAll();
    }

    public Page<Usuario> findAll(Pageable pageable) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (usuarioLogado.getTipo() != TipoUsuario.ORIENTADOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas orientadores podem listar usuarios");
        }
        return usuarioRepository.findAll(pageable);
    }

    public List<Usuario> findOrientadoresAtivos() {
        authHelper.getCurrentUser();
        return usuarioRepository.findByTipoAndAtivoTrueOrderByNomeAsc(TipoUsuario.ORIENTADOR);
    }

    public Usuario findById(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));
        validarAcessoAoUsuario(usuario, true);
        return usuario;
    }

    public UsuarioProfileResponse me() {
        Usuario usuario = authHelper.getCurrentUser();
        return montarPerfil(usuario);
    }

    public UsuarioProfileResponse findProfileById(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));
        validarAcessoAoUsuario(usuario, true);
        return montarPerfil(usuario);
    }

    @Transactional
    public Usuario update(Integer id, UsuarioRequest dto) {
        Usuario usuarioLogado = authHelper.getCurrentUser();

        if (!usuarioLogado.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Voce nao pode editar outro usuario");
        }

        Usuario usuario = findById(id);
        usuario.setNome(dto.getNome().trim());
        usuario.setEmail(dto.getEmail().trim().toLowerCase());
        usuario.setInstituicao(normalizarTexto(dto.getInstituicao()));
        usuario.setBio(normalizarTexto(dto.getBio()));
        if (dto.getFotoPerfilUrl() != null) {
            usuario.setFotoPerfilUrl(normalizarTexto(dto.getFotoPerfilUrl()));
        }
        usuarioRepository.save(usuario);

        if (usuario.getTipo() == TipoUsuario.ALUNO) {
            Aluno aluno = alunoRepository.findByUsuarioId(usuario.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado"));
            aluno.setSemestre(dto.getSemestre());
            aluno.setInteresses(normalizarTexto(dto.getInteresses()));
            aluno.setCurso(buscarCurso(dto.getCursoId()));
            alunoRepository.save(aluno);
        }

        if (usuario.getTipo() == TipoUsuario.ORIENTADOR) {
            Orientador orientador = orientadorRepository.findByUsuarioId(usuario.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Orientador nao encontrado"));
            if (dto.getDepartamento() != null) {
                orientador.setDepartamento(dto.getDepartamento().trim());
            }
            if (dto.getTitulacao() != null) {
                orientador.setTitulacao(dto.getTitulacao().trim());
            }
            orientadorRepository.save(orientador);
        }

        return usuario;
    }

    @Transactional
    public UsuarioProfileResponse updatePreferencias(UsuarioPreferenciasRequest dto) {
        Usuario usuario = authHelper.getCurrentUser();
        usuario.setNotificacoesAtivas(dto.getNotificacoesAtivas());
        if (dto.getTema() != null && !dto.getTema().isBlank()) {
            usuario.setTema(dto.getTema().trim().toLowerCase());
        }
        usuarioRepository.save(usuario);
        return montarPerfil(usuario);
    }

    public void delete(Integer id) {
        Usuario usuarioLogado = authHelper.getCurrentUser();

        if (!usuarioLogado.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Voce nao pode remover outro usuario");
        }

        Usuario usuario = findById(id);
        usuario.setAtivo(false);
        usuarioRepository.save(usuario);
    }

    public List<Projeto> findProjetosByUsuario(Integer id) {
        Usuario usuario = findById(id);
        if (usuario.getTipo() == TipoUsuario.ALUNO) {
            return projetoRepository.findRelacionadosAoUsuario(id);
        }
        return projetoRepository.findByOrientadorUsuarioIdOrAlunoCriadorUsuarioId(id, id);
    }

    public List<Inscricao> findInscricoesByUsuario(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));
        validarAcessoRestritoAoUsuario(id);
        if (usuario.getTipo() == TipoUsuario.ALUNO) {
            return inscricaoRepository.findByAlunoUsuarioId(id);
        }
        return inscricaoRepository.findByProjetoOrientadorUsuarioId(id);
    }

    private void validarAcessoRestritoAoUsuario(Integer id) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (usuarioLogado.getId().equals(id) || usuarioLogado.getTipo() == TipoUsuario.ORIENTADOR) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para acessar dados de outro usuario");
    }

    private void validarAcessoAoUsuario(Usuario usuario, boolean permitirOrientador) {
        Usuario usuarioLogado = authHelper.getCurrentUser();

        if (usuarioLogado.getId().equals(usuario.getId())) {
            return;
        }

        if (usuario.getTipo() == TipoUsuario.ALUNO) {
            return;
        }

        if (permitirOrientador && usuarioLogado.getTipo() == TipoUsuario.ORIENTADOR) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para acessar dados de outro usuario");
    }

    private UsuarioProfileResponse montarPerfil(Usuario usuario) {
        Aluno aluno = alunoRepository.findByUsuarioId(usuario.getId()).orElse(null);
        Orientador orientador = orientadorRepository.findByUsuarioId(usuario.getId()).orElse(null);
        return UsuarioProfileResponse.from(usuario, aluno, orientador);
    }

    private Curso buscarCurso(Integer cursoId) {
        if (cursoId == null) {
            return null;
        }
        return cursoRepository.findById(cursoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Curso nao encontrado"));
    }

    private String normalizarTexto(String valor) {
        if (valor == null) {
            return null;
        }
        String normalizado = valor.trim();
        return normalizado.isEmpty() ? null : normalizado;
    }
}
