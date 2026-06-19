package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.ProjetoRequest;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.AlunoRepository;
import com.example.tcc_backend.repository.AreaPesquisaRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.OrientadorRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.repository.UsuarioRepository;
import com.example.tcc_backend.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProjetoService {

    private final ProjetoRepository projetoRepository;
    private final OrientadorRepository orientadorRepository;
    private final AlunoRepository alunoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final AreaPesquisaRepository areaPesquisaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuthHelper authHelper;
    private final NotificacaoService notificacaoService;
    private final EtapaProgressoService etapaProgressoService;

    public List<Projeto> findAll(String status, Integer areaId, String area, String curso, String busca) {
        return projetoRepository.findAll(createSpecification(status, areaId, area, curso, busca));
    }

    public Page<Projeto> findAll(String status, Integer areaId, String area, String curso, String busca, Pageable pageable) {
        return projetoRepository.findAll(createSpecification(status, areaId, area, curso, busca), pageable);
    }

    private Specification<Projeto> createSpecification(String status, Integer areaId, String area, String curso, String busca) {
        Specification<Projeto> spec = (root, query, cb) -> cb.conjunction();

        if (busca != null && !busca.trim().isEmpty()) {
            final String term = busca.trim().toLowerCase();
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("titulo")), "%" + term + "%"));
        }

        if (area != null && !area.trim().isEmpty()) {
            final String areaNome = area.trim();
            spec = spec.and((root, query, cb) -> cb.equal(root.get("area").get("nome"), areaNome));
        }

        if (areaId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("area").get("id"), areaId));
        }

        if (curso != null && !curso.trim().isEmpty()) {
            final String cursoNome = curso.trim();
            spec = spec.and((root, query, cb) -> cb.equal(root.get("area").get("curso").get("nome"), cursoNome));
        }

        if (status != null && !status.trim().isEmpty()) {
            final String raw = status.trim();
            final String normalized = raw.toUpperCase();

            if ("ATIVO".equals(normalized)) {
                // Compatibilidade: "ATIVO" significa projeto em andamento (nao FINALIZADO).
                spec = spec.and((root, query, cb) -> cb.or(
                        cb.equal(root.get("status"), StatusProjeto.ABERTO),
                        cb.equal(root.get("status"), StatusProjeto.EM_ANDAMENTO)
                ));
            } else {
                try {
                    StatusProjeto statusEnum = StatusProjeto.valueOf(normalized);
                    spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), statusEnum));
                } catch (IllegalArgumentException e) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status invalido: " + raw);
                }
            }
        }

        return spec;
    }

    public List<Projeto> findAll() {
        return projetoRepository.findAll();
    }

    public Page<Projeto> findAll(Pageable pageable) {
        return projetoRepository.findAll(pageable);
    }

    public Projeto findById(Integer id) {
        return projetoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));
    }

    public List<Projeto> findByStatus(StatusProjeto status) {
        return projetoRepository.findByStatus(status);
    }

    public Page<Projeto> findByStatus(StatusProjeto status, Pageable pageable) {
        return projetoRepository.findByStatus(status, pageable);
    }

    public List<Projeto> findByArea(Integer areaId) {
        return projetoRepository.findByAreaId(areaId);
    }

    public Page<Projeto> findByArea(Integer areaId, Pageable pageable) {
        return projetoRepository.findByAreaId(areaId, pageable);
    }

    public List<Projeto> findByAreaNome(String area) {
        return projetoRepository.findByAreaNomeContainingIgnoreCase(area);
    }

    public Page<Projeto> findByAreaNome(String area, Pageable pageable) {
        return projetoRepository.findByAreaNomeContainingIgnoreCase(area, pageable);
    }

    public List<Projeto> findByCursoNome(String curso) {
        return projetoRepository.findByAreaCursoNomeContainingIgnoreCase(curso);
    }

    public Page<Projeto> findByCursoNome(String curso, Pageable pageable) {
        return projetoRepository.findByAreaCursoNomeContainingIgnoreCase(curso, pageable);
    }

    public List<Projeto> findByBusca(String busca) {
        return projetoRepository.findByTituloContainingIgnoreCase(busca);
    }

    public Page<Projeto> findByBusca(String busca, Pageable pageable) {
        return projetoRepository.findByTituloContainingIgnoreCase(busca, pageable);
    }

    public Page<Projeto> findMeusProjetos(Pageable pageable) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        if (usuarioLogado.getTipo() == TipoUsuario.ALUNO) {
            return projetoRepository.findRelacionadosAoUsuario(usuarioLogado.getId(), pageable);
        }
        return projetoRepository.findByOrientadorUsuarioIdOrAlunoCriadorUsuarioId(
                usuarioLogado.getId(),
                usuarioLogado.getId(),
                pageable
        );
    }

    @Transactional
    public Projeto create(ProjetoRequest dto) {
        validarDatas(dto);
        Usuario usuarioLogado = authHelper.getCurrentUser();

        AreaPesquisa area = areaPesquisaRepository.findById(dto.getAreaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Area nao encontrada"));

        Projeto.ProjetoBuilder builder = Projeto.builder()
                .titulo(dto.getTitulo())
                .descricao(dto.getDescricao())
                .requisitos(dto.getRequisitos())
                .tecnologias(dto.getTecnologias())
                .vagas(dto.getVagas())
                .dataInicio(dto.getDataInicio())
                .dataFim(dto.getDataFim())
                .dataLimiteInscricao(dto.getDataLimiteInscricao())
                .area(area);

        Aluno alunoCriador = null;
        if (usuarioLogado.getTipo() == TipoUsuario.ORIENTADOR) {
            Orientador orientador = orientadorRepository.findByUsuarioId(usuarioLogado.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Orientador nao encontrado"));
            builder.orientador(orientador);
        } else if (usuarioLogado.getTipo() == TipoUsuario.ALUNO) {
            if (dto.getOrientadorId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Orientador e obrigatorio para projetos criados por alunos");
            }
            Orientador orientadorSolicitado = orientadorRepository.findByUsuarioId(dto.getOrientadorId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Orientador nao encontrado"));
            alunoCriador = alunoRepository.findByUsuarioId(usuarioLogado.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado"));
            builder
                    .orientador(orientadorSolicitado)
                    .alunoCriador(alunoCriador)
                    .status(StatusProjeto.PENDENTE_ORIENTADOR);
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas alunos ou orientadores podem criar projetos");
        }

        Projeto projeto = projetoRepository.save(builder.build());
        etapaProgressoService.garantirEtapasPadrao(projeto);

        if (alunoCriador != null) {
            Inscricao inscricaoCriador = Inscricao.builder()
                    .aluno(alunoCriador)
                    .projeto(projeto)
                    .status(StatusInscricao.APROVADO)
                    .build();
            inscricaoRepository.save(inscricaoCriador);
            notificacaoService.criarNotificacao(
                    projeto.getOrientador().getUsuario().getId(),
                    "Novo projeto aguardando aceite de orientacao",
                    TipoNotificacao.SOLICITACAO_ORIENTACAO,
                    "PROJETO",
                    projeto.getId(),
                    "/app/projects/" + projeto.getId(),
                    projeto.getTitulo()
            );
        }

        return projeto;
    }

    @Transactional
    public Projeto aceitarOrientacao(Integer id) {
        Projeto projeto = findById(id);
        Usuario usuarioLogado = authHelper.getCurrentUser();
        validarOrientadorSolicitado(projeto, usuarioLogado);
        validarProjetoPendente(projeto);

        projeto.setStatus(StatusProjeto.ABERTO);
        Projeto salvo = projetoRepository.save(projeto);
        notificarAlunoCriador(salvo, "Seu projeto foi aceito pelo orientador", TipoNotificacao.PROJETO_ACEITO);
        return salvo;
    }

    @Transactional
    public Projeto rejeitarOrientacao(Integer id) {
        Projeto projeto = findById(id);
        Usuario usuarioLogado = authHelper.getCurrentUser();
        validarOrientadorSolicitado(projeto, usuarioLogado);
        validarProjetoPendente(projeto);

        projeto.setStatus(StatusProjeto.REJEITADO_ORIENTADOR);
        Projeto salvo = projetoRepository.save(projeto);
        notificarAlunoCriador(salvo, "Seu projeto foi recusado pelo orientador", TipoNotificacao.PROJETO_REJEITADO);
        return salvo;
    }

    public Projeto update(Integer id, ProjetoRequest dto) {
        validarDatas(dto);
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = findById(id);

        boolean isOrientadorDoProjeto = projeto.getOrientador() != null &&
                projeto.getOrientador().getUsuario().getId().equals(usuarioLogado.getId());

        boolean isAlunoCriador = projeto.getAlunoCriador() != null &&
                projeto.getAlunoCriador().getUsuario().getId().equals(usuarioLogado.getId());

        if (!isOrientadorDoProjeto && !isAlunoCriador) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Voce nao tem permissao para editar este projeto");
        }

        AreaPesquisa area = areaPesquisaRepository.findById(dto.getAreaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Area nao encontrada"));

        Projeto atualizado = Projeto.builder()
                .id(projeto.getId())
                .titulo(dto.getTitulo())
                .descricao(dto.getDescricao())
                .requisitos(dto.getRequisitos())
                .tecnologias(dto.getTecnologias())
                .vagas(dto.getVagas())
                .dataInicio(dto.getDataInicio())
                .dataFim(dto.getDataFim())
                .dataLimiteInscricao(dto.getDataLimiteInscricao())
                .area(area)
                .orientador(projeto.getOrientador())
                .alunoCriador(projeto.getAlunoCriador())
                .dataCriacao(projeto.getDataCriacao())
                .status(projeto.getStatus())
                .build();

        return projetoRepository.save(atualizado);
    }

    public void delete(Integer id) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = findById(id);

        boolean isOrientadorDoProjeto = projeto.getOrientador() != null &&
                projeto.getOrientador().getUsuario().getId().equals(usuarioLogado.getId());

        boolean isAlunoCriador = projeto.getAlunoCriador() != null &&
                projeto.getAlunoCriador().getUsuario().getId().equals(usuarioLogado.getId());

        if (!isOrientadorDoProjeto && !isAlunoCriador) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Voce nao tem permissao para excluir este projeto");
        }

        projetoRepository.delete(projeto);
    }

    public Inscricao recrutar(Integer projetoId, Integer usuarioId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = findById(projetoId);
        validarGestaoProjeto(projeto, usuarioLogado.getId());

        Usuario usuarioColaborador = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));

        if (usuarioColaborador.getTipo() != TipoUsuario.ALUNO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Somente alunos podem ser recrutados");
        }

        Aluno aluno = alunoRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno nao encontrado"));

        Inscricao inscricao = inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(projetoId, usuarioId).orElse(null);

        if (inscricao == null) {
            inscricao = Inscricao.builder()
                    .aluno(aluno)
                    .projeto(projeto)
                    .status(StatusInscricao.APROVADO)
                    .build();
        } else {
            inscricao.setStatus(StatusInscricao.APROVADO);
        }

        Inscricao salva = inscricaoRepository.save(inscricao);
        notificacaoService.criarNotificacao(
                usuarioId,
                "Voce foi recrutado para um projeto",
                TipoNotificacao.INSCRICAO_APROVADA,
                "PROJETO",
                projetoId,
                "/app/projects/" + projetoId,
                projeto.getTitulo()
        );
        return salva;
    }

    public List<Usuario> listarColaboradores(Integer projetoId) {
        Projeto projeto = findById(projetoId);
        Set<Usuario> colaboradores = new LinkedHashSet<>();

        if (projeto.getOrientador() != null) {
            colaboradores.add(projeto.getOrientador().getUsuario());
        }
        if (projeto.getAlunoCriador() != null) {
            colaboradores.add(projeto.getAlunoCriador().getUsuario());
        }

        List<Inscricao> aprovadas = inscricaoRepository.findByProjetoIdAndStatus(projetoId, StatusInscricao.APROVADO);
        for (Inscricao inscricao : aprovadas) {
            colaboradores.add(inscricao.getAluno().getUsuario());
        }

        return colaboradores.stream().toList();
    }

    public void removerColaborador(Integer projetoId, Integer usuarioId) {
        Usuario usuarioLogado = authHelper.getCurrentUser();
        Projeto projeto = findById(projetoId);
        validarGestaoProjeto(projeto, usuarioLogado.getId());

        if (projeto.getAlunoCriador() != null && projeto.getAlunoCriador().getUsuario().getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nao e permitido remover o aluno criador do projeto");
        }

        Inscricao inscricao = inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(projetoId, usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Colaborador nao encontrado no projeto"));

        inscricaoRepository.delete(inscricao);
    }

    private void validarGestaoProjeto(Projeto projeto, Integer usuarioLogadoId) {
        boolean isOrientadorDoProjeto = projeto.getOrientador() != null &&
                projeto.getOrientador().getUsuario().getId().equals(usuarioLogadoId);

        boolean isAlunoCriador = projeto.getAlunoCriador() != null &&
                projeto.getAlunoCriador().getUsuario().getId().equals(usuarioLogadoId);

        if (!isOrientadorDoProjeto && !isAlunoCriador) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para gerenciar colaboradores deste projeto");
        }
    }

    private void validarOrientadorSolicitado(Projeto projeto, Usuario usuarioLogado) {
        if (usuarioLogado.getTipo() != TipoUsuario.ORIENTADOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas orientadores podem aceitar ou recusar projetos");
        }

        boolean isOrientadorSolicitado = projeto.getOrientador() != null &&
                projeto.getOrientador().getUsuario().getId().equals(usuarioLogado.getId());

        if (!isOrientadorSolicitado) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Voce nao e o orientador solicitado para este projeto");
        }
    }

    private void validarProjetoPendente(Projeto projeto) {
        if (projeto.getStatus() != StatusProjeto.PENDENTE_ORIENTADOR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Projeto nao esta aguardando aceite do orientador");
        }
    }

    private void notificarAlunoCriador(Projeto projeto, String mensagem, TipoNotificacao tipo) {
        if (projeto.getAlunoCriador() == null) {
            return;
        }

        notificacaoService.criarNotificacao(
                projeto.getAlunoCriador().getUsuario().getId(),
                mensagem,
                tipo,
                "PROJETO",
                projeto.getId(),
                "/app/projects/" + projeto.getId(),
                projeto.getTitulo()
        );
    }

    private void validarDatas(ProjetoRequest dto) {
        if (dto.getDataInicio() != null && dto.getDataFim() != null
                && dto.getDataFim().isBefore(dto.getDataInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Data de termino deve ser igual ou posterior a data de inicio");
        }
        if (dto.getDataLimiteInscricao() != null && dto.getDataFim() != null
                && dto.getDataLimiteInscricao().isAfter(dto.getDataFim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Limite de inscricao deve ser igual ou anterior a data de termino");
        }
    }
}
