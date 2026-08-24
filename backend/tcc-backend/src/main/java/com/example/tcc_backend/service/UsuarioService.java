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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final AlunoRepository alunoRepository;
    private final OrientadorRepository orientadorRepository;
    private final CursoRepository cursoRepository;
    private static final long MAX_PROFILE_PHOTO_BYTES = 2L * 1024 * 1024;

    private final ProjetoRepository projetoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final AuthHelper authHelper;
    private final SupabaseStorageService supabaseStorageService;

    @Autowired
    public UsuarioService(UsuarioRepository usuarioRepository,
                          AlunoRepository alunoRepository,
                          OrientadorRepository orientadorRepository,
                          CursoRepository cursoRepository,
                          ProjetoRepository projetoRepository,
                          InscricaoRepository inscricaoRepository,
                          AuthHelper authHelper,
                          SupabaseStorageService supabaseStorageService) {
        this.usuarioRepository = usuarioRepository;
        this.alunoRepository = alunoRepository;
        this.orientadorRepository = orientadorRepository;
        this.cursoRepository = cursoRepository;
        this.projetoRepository = projetoRepository;
        this.inscricaoRepository = inscricaoRepository;
        this.authHelper = authHelper;
        this.supabaseStorageService = supabaseStorageService;
    }

    public UsuarioService(UsuarioRepository usuarioRepository,
                          AlunoRepository alunoRepository,
                          OrientadorRepository orientadorRepository,
                          CursoRepository cursoRepository,
                          ProjetoRepository projetoRepository,
                          InscricaoRepository inscricaoRepository,
                          AuthHelper authHelper) {
        this(usuarioRepository, alunoRepository, orientadorRepository, cursoRepository,
                projetoRepository, inscricaoRepository, authHelper, null);
    }

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
        String emailNormalizado = dto.getEmail().trim().toLowerCase();
        usuarioRepository.findByEmail(emailNormalizado)
                .filter(outro -> !outro.getId().equals(usuario.getId()))
                .ifPresent(outro -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Email ja esta em uso por outro usuario");
                });
        usuario.setNome(dto.getNome().trim());
        usuario.setEmail(emailNormalizado);
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

    @Transactional
    public UsuarioProfileResponse atualizarFotoPerfil(MultipartFile arquivo) {
        Usuario usuario = authHelper.getCurrentUser();
        String extensao = validarFotoPerfil(arquivo);
        String caminho = supabaseStorageService.uploadUserDocument(
                "usuarios/" + usuario.getId() + "/foto-perfil",
                "foto-perfil" + extensao,
                lerBytes(arquivo),
                arquivo.getContentType(),
                true
        );
        String publicUrl = supabaseStorageService.createPublicUserDocumentUrl(caminho);
        if (publicUrl == null || publicUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao gerar URL da foto de perfil");
        }
        usuario.setFotoPerfilUrl(publicUrl);
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
            Set<Projeto> projetos = new LinkedHashSet<>(projetoRepository.findByOrientadorUsuarioIdOrAlunoCriadorUsuarioId(id, id));
            inscricaoRepository.findByAlunoUsuarioId(id).stream()
                    .map(Inscricao::getProjeto)
                    .forEach(projetos::add);
            return new ArrayList<>(projetos);
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

    private void validarFotoPerfil(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem obrigatoria");
        }
        if (arquivo.getSize() > MAX_PROFILE_PHOTO_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Imagem muito grande. O limite e 2 MB");
        }

        String contentType = arquivo.getContentType();
        String nomeOriginal = arquivo.getOriginalFilename() == null
                ? ""
                : arquivo.getOriginalFilename().toLowerCase(Locale.ROOT);

        if ("image/jpeg".equals(contentType) && (nomeOriginal.endsWith(".jpg") || nomeOriginal.endsWith(".jpeg"))) {
            validarAssinaturaFoto(arquivo, contentType);
            return ".jpg";
        }
        if ("image/png".equals(contentType) && nomeOriginal.endsWith(".png")) {
            validarAssinaturaFoto(arquivo, contentType);
            return ".png";
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use uma imagem JPG ou PNG");
    }

    private void validarAssinaturaFoto(MultipartFile arquivo, String contentType) {
        byte[] header = new byte[8];
        int read;
        try (InputStream in = arquivo.getInputStream()) {
            read = in.read(header);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem invalida");
        }

        if (read <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem invalida");
        }
        if ("image/png".equals(contentType)) {
            byte[] png = new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
            if (read < png.length || !Arrays.equals(Arrays.copyOf(header, png.length), png)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem invalida");
            }
            return;
        }
        if ("image/jpeg".equals(contentType) && (read < 3 || (header[0] & 0xFF) != 0xFF || (header[1] & 0xFF) != 0xD8 || (header[2] & 0xFF) != 0xFF)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem invalida");
        }
    }

    private byte[] lerBytes(MultipartFile arquivo) {
        try {
            return arquivo.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem invalida");
        }
    }

    private String normalizarTexto(String valor) {
        if (valor == null) {
            return null;
        }
        String normalizado = valor.trim();
        return normalizado.isEmpty() ? null : normalizado;
    }
}
