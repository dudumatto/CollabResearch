package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.OrdemRequest;
import com.example.tcc_backend.dto.request.RevisaoRequest;
import com.example.tcc_backend.dto.request.TarefaPatchRequest;
import com.example.tcc_backend.dto.request.TarefaRequest;
import com.example.tcc_backend.dto.response.EtapaResponse;
import com.example.tcc_backend.dto.response.RevisaoResponse;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.EtapaProgressoRepository;
import com.example.tcc_backend.repository.EtapaRevisaoRepository;
import com.example.tcc_backend.repository.EtapaTarefaRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Checklist dos marcos (tarefas do orientador e pessoais) e fluxo de revisao.
 * Percentual e estado de revisao sao independentes: concluir todas as tarefas nunca aprova o marco.
 */
@Service
@RequiredArgsConstructor
public class EtapaChecklistService {

    private enum Papel { ORIENTADOR, ALUNO }

    private final EtapaProgressoRepository etapaProgressoRepository;
    private final EtapaTarefaRepository tarefaRepository;
    private final EtapaRevisaoRepository revisaoRepository;
    private final ProjetoRepository projetoRepository;
    private final AuthHelper authHelper;
    private final ProjectAccessPolicy projectAccessPolicy;
    private final EtapaResponseAssembler assembler;

    @Transactional
    public EtapaResponse criarTarefa(Integer projetoId, Integer etapaId, TarefaRequest request) {
        Contexto ctx = abrir(projetoId, etapaId);
        exigirChecklistEditavel(ctx.etapa());
        String titulo = tituloValido(request == null ? null : request.getTitulo());
        boolean obrigatoria = request != null && Boolean.TRUE.equals(request.getObrigatoria());
        if (ctx.papel() == Papel.ALUNO && obrigatoria) {
            throw badRequest("Tarefa pessoal nao pode ser obrigatoria");
        }

        List<EtapaTarefa> existentes = tarefaRepository.findByEtapaIdOrderByOrdemAscIdAsc(etapaId);
        int proximaOrdem = existentes.stream().mapToInt(t -> t.getOrdem() == null ? 0 : t.getOrdem()).max().orElse(0) + 1;

        tarefaRepository.save(EtapaTarefa.builder()
                .etapa(ctx.etapa())
                .titulo(titulo)
                .obrigatoria(obrigatoria)
                .origem(ctx.papel() == Papel.ORIENTADOR ? TarefaOrigem.ORIENTADOR : TarefaOrigem.ALUNO)
                .ordem(proximaOrdem)
                .criadaPor(ctx.usuario())
                .build());
        return atualizarEstadoEMontar(ctx.etapa());
    }

    @Transactional
    public EtapaResponse atualizarTarefa(Integer projetoId, Integer etapaId, Integer tarefaId, TarefaPatchRequest request) {
        Contexto ctx = abrir(projetoId, etapaId);
        if (request == null || (request.getTitulo() == null && request.getObrigatoria() == null && request.getConcluida() == null)) {
            throw badRequest("Nenhuma alteracao informada");
        }
        EtapaTarefa tarefa = carregarTarefa(etapaId, tarefaId);
        exigirChecklistEditavel(ctx.etapa());

        boolean alteraEstrutura = request.getTitulo() != null || request.getObrigatoria() != null;
        if (alteraEstrutura && !podeGerenciar(tarefa, ctx)) {
            throw forbidden("Sem permissao para editar esta tarefa");
        }
        if (request.getConcluida() != null && !podeMarcar(tarefa, ctx)) {
            throw forbidden("Sem permissao para marcar esta tarefa");
        }
        if (Boolean.TRUE.equals(request.getObrigatoria()) && tarefa.getOrigem() == TarefaOrigem.ALUNO) {
            throw badRequest("Tarefa pessoal nao pode ser obrigatoria");
        }

        if (request.getTitulo() != null) {
            tarefa.setTitulo(tituloValido(request.getTitulo()));
        }
        if (request.getObrigatoria() != null) {
            tarefa.setObrigatoria(request.getObrigatoria());
        }
        if (request.getConcluida() != null) {
            boolean concluida = request.getConcluida();
            if (concluida != Boolean.TRUE.equals(tarefa.getConcluida())) {
                tarefa.setConcluida(concluida);
                tarefa.setConcluidaEm(concluida ? LocalDateTime.now() : null);
                tarefa.setConcluidaPor(concluida ? ctx.usuario() : null);
            }
        }
        tarefaRepository.save(tarefa);
        return atualizarEstadoEMontar(ctx.etapa());
    }

    @Transactional
    public EtapaResponse excluirTarefa(Integer projetoId, Integer etapaId, Integer tarefaId) {
        Contexto ctx = abrir(projetoId, etapaId);
        EtapaTarefa tarefa = carregarTarefa(etapaId, tarefaId);
        exigirChecklistEditavel(ctx.etapa());
        if (!podeGerenciar(tarefa, ctx)) {
            throw forbidden("Sem permissao para remover esta tarefa");
        }
        tarefaRepository.delete(tarefa);
        tarefaRepository.flush();

        int ordem = 1;
        for (EtapaTarefa restante : tarefaRepository.findByEtapaIdOrderByOrdemAscIdAsc(etapaId)) {
            if (!Integer.valueOf(ordem).equals(restante.getOrdem())) {
                restante.setOrdem(ordem);
                tarefaRepository.save(restante);
            }
            ordem++;
        }
        return atualizarEstadoEMontar(ctx.etapa());
    }

    /**
     * Reordena as tarefas que o usuario gerencia (do orientador ou as proprias). {@code ids} deve conter exatamente
     * esse conjunto; as tarefas dos outros mantem suas posicoes.
     */
    @Transactional
    public EtapaResponse reordenarTarefas(Integer projetoId, Integer etapaId, OrdemRequest request) {
        Contexto ctx = abrir(projetoId, etapaId);
        exigirChecklistEditavel(ctx.etapa());

        List<EtapaTarefa> gerenciadas = tarefaRepository.findByEtapaIdOrderByOrdemAscIdAsc(etapaId).stream()
                .filter(t -> podeGerenciar(t, ctx))
                .toList();
        List<Integer> ids = idsValidos(request, gerenciadas.stream().map(EtapaTarefa::getId).collect(Collectors.toSet()));

        List<Integer> posicoes = gerenciadas.stream().map(EtapaTarefa::getOrdem).sorted().toList();
        for (int i = 0; i < ids.size(); i++) {
            Integer id = ids.get(i);
            EtapaTarefa tarefa = gerenciadas.stream().filter(t -> t.getId().equals(id)).findFirst().orElseThrow();
            tarefa.setOrdem(posicoes.get(i));
            tarefaRepository.save(tarefa);
        }
        tarefaRepository.flush();
        return assembler.montar(ctx.etapa());
    }

    @Transactional
    public EtapaResponse enviarParaRevisao(Integer projetoId, Integer etapaId) {
        Contexto ctx = abrir(projetoId, etapaId);
        if (ctx.papel() != Papel.ALUNO) {
            throw forbidden("Apenas alunos do projeto podem enviar o marco para revisao");
        }
        EtapaProgresso etapa = ctx.etapa();
        exigirMarcoAberto(etapa);
        if (MarcoProgressoCalculator.emRevisao(etapa)) {
            throw conflict("Marco ja esta em revisao");
        }
        exigirObrigatoriasConcluidas(etapaId);

        etapa.setEnviadaEm(LocalDateTime.now());
        etapa.setStatus(EtapaProgressoStatus.ACTIVE);
        etapaProgressoRepository.save(etapa);
        registrar(etapa, RevisaoAcao.ENVIADO, null, ctx.usuario());
        return assembler.montar(etapa);
    }

    @Transactional
    public EtapaResponse revisar(Integer projetoId, Integer etapaId, RevisaoRequest request) {
        Contexto ctx = abrir(projetoId, etapaId);
        if (ctx.papel() != Papel.ORIENTADOR) {
            throw forbidden("Apenas o orientador responsavel pode revisar o marco");
        }
        if (request == null || request.getAcao() == null) {
            throw badRequest("Acao e obrigatoria");
        }
        EtapaProgresso etapa = ctx.etapa();
        exigirMarcoAberto(etapa);
        if (!MarcoProgressoCalculator.emRevisao(etapa)) {
            throw conflict("Marco nao foi enviado para revisao");
        }
        String comentario = normalizar(request.getComentario());
        if (request.getAcao() == RevisaoRequest.Decisao.DEVOLVER) {
            if (comentario == null) {
                throw badRequest("Comentario e obrigatorio ao devolver o marco");
            }
            etapa.setStatus(EtapaProgressoStatus.REJECTED);
            etapa.setEnviadaEm(null);
            etapaProgressoRepository.save(etapa);
            registrar(etapa, RevisaoAcao.DEVOLVIDO, comentario, ctx.usuario());
        } else {
            aprovar(etapa, ctx.usuario(), comentario);
        }
        return assembler.montar(etapa);
    }

    /** Aprova o marco (exige obrigatorias concluidas) e registra no historico. */
    @Transactional
    public void aprovar(EtapaProgresso etapa, Usuario autor, String comentario) {
        exigirObrigatoriasConcluidas(etapa.getId());
        etapa.setStatus(EtapaProgressoStatus.DONE);
        etapa.setConcluidaEm(LocalDateTime.now());
        etapa.setConcluidaPor(autor);
        etapa.setEnviadaEm(null);
        etapaProgressoRepository.save(etapa);
        registrar(etapa, RevisaoAcao.APROVADO, comentario, autor);
    }

    @Transactional(readOnly = true)
    public List<RevisaoResponse> listarRevisoes(Integer projetoId, Integer etapaId) {
        Usuario usuario = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        projectAccessPolicy.requireCanViewTeam(projeto, usuario);
        etapaProgressoRepository.findByProjetoIdAndId(projetoId, etapaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etapa nao encontrada"));
        return revisaoRepository.findHistorico(etapaId).stream().map(RevisaoResponse::fromEntity).toList();
    }

    // ---- internos ----

    private record Contexto(Projeto projeto, Usuario usuario, Papel papel, EtapaProgresso etapa) {
    }

    private Contexto abrir(Integer projetoId, Integer etapaId) {
        Usuario usuario = authHelper.getCurrentUser();
        Projeto projeto = carregarProjeto(projetoId);
        ProjectAccessPolicy.Relationship relacao = projectAccessPolicy.relationship(projeto, usuario);
        Papel papel = relacao == null ? null : switch (relacao) {
            case RESPONSIBLE_ADVISOR -> Papel.ORIENTADOR;
            case STUDENT_CREATOR, APPROVED_MEMBER -> Papel.ALUNO;
            case EXTERNAL, ADMIN_AUDITOR -> null;
        };
        if (papel == null) {
            throw forbidden("Usuario nao participa do projeto");
        }
        if (projeto.getStatus() == StatusProjeto.FINALIZADO) {
            throw conflict("Projeto finalizado nao permite alteracoes de progresso");
        }
        EtapaProgresso etapa = etapaProgressoRepository.findByProjetoIdAndId(projetoId, etapaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Etapa nao encontrada"));
        return new Contexto(projeto, usuario, papel, etapa);
    }

    private Projeto carregarProjeto(Integer projetoId) {
        return projetoRepository.findById(projetoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto nao encontrado"));
    }

    private EtapaTarefa carregarTarefa(Integer etapaId, Integer tarefaId) {
        return tarefaRepository.findByIdAndEtapaId(tarefaId, etapaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarefa nao encontrada"));
    }

    /** Estrutura (titulo, obrigatoria, remocao, ordem): orientador nas suas tarefas; aluno nas proprias. */
    private boolean podeGerenciar(EtapaTarefa tarefa, Contexto ctx) {
        if (tarefa.getOrigem() == TarefaOrigem.ORIENTADOR) {
            return ctx.papel() == Papel.ORIENTADOR;
        }
        return ctx.papel() == Papel.ALUNO && eDono(tarefa, ctx.usuario());
    }

    /** Marcar/desmarcar: tarefas do orientador por qualquer participante; pessoais so pelo dono. */
    private boolean podeMarcar(EtapaTarefa tarefa, Contexto ctx) {
        if (tarefa.getOrigem() == TarefaOrigem.ORIENTADOR) {
            return true;
        }
        return ctx.papel() == Papel.ALUNO && eDono(tarefa, ctx.usuario());
    }

    private boolean eDono(EtapaTarefa tarefa, Usuario usuario) {
        return tarefa.getCriadaPor() != null && Objects.equals(tarefa.getCriadaPor().getId(), usuario.getId());
    }

    private void exigirMarcoAberto(EtapaProgresso etapa) {
        if (etapa.getStatus() == EtapaProgressoStatus.DONE) {
            throw conflict("Marco aprovado nao pode ser alterado");
        }
    }

    /** Checklist so e editavel enquanto o marco nao esta aprovado nem aguardando revisao. */
    private void exigirChecklistEditavel(EtapaProgresso etapa) {
        exigirMarcoAberto(etapa);
        if (MarcoProgressoCalculator.emRevisao(etapa)) {
            throw conflict("Marco em revisao: o checklist fica somente leitura ate a decisao do orientador");
        }
    }

    private void exigirObrigatoriasConcluidas(Integer etapaId) {
        boolean pendente = tarefaRepository.findByEtapaIdOrderByOrdemAscIdAsc(etapaId).stream()
                .anyMatch(t -> Boolean.TRUE.equals(t.getObrigatoria()) && !Boolean.TRUE.equals(t.getConcluida()));
        if (pendente) {
            throw conflict("Existem tarefas obrigatorias pendentes");
        }
    }

    /** Recalcula o estado derivado (PENDING/ACTIVE) e devolve o marco atualizado. */
    private EtapaResponse atualizarEstadoEMontar(EtapaProgresso etapa) {
        tarefaRepository.flush();
        EtapaProgressoStatus status = etapa.getStatus();
        if (status == EtapaProgressoStatus.PENDING || status == EtapaProgressoStatus.ACTIVE) {
            boolean algumConcluido = tarefaRepository.findByEtapaIdOrderByOrdemAscIdAsc(etapa.getId()).stream()
                    .anyMatch(t -> Boolean.TRUE.equals(t.getConcluida()));
            EtapaProgressoStatus novo = algumConcluido || etapa.getEnviadaEm() != null
                    ? EtapaProgressoStatus.ACTIVE : EtapaProgressoStatus.PENDING;
            if (novo != status) {
                etapa.setStatus(novo);
                etapaProgressoRepository.save(etapa);
            }
        }
        return assembler.montar(etapa);
    }

    private void registrar(EtapaProgresso etapa, RevisaoAcao acao, String comentario, Usuario autor) {
        revisaoRepository.save(EtapaRevisao.builder()
                .etapa(etapa)
                .acao(acao)
                .comentario(comentario)
                .autor(autor)
                .build());
    }

    private List<Integer> idsValidos(OrdemRequest request, Set<Integer> esperados) {
        List<Integer> ids = request == null ? null : request.getIds();
        if (ids == null || ids.size() != esperados.size() || !esperados.equals(new HashSet<>(ids))) {
            throw badRequest("A lista de ids deve conter exatamente os itens reordenaveis, sem repeticao");
        }
        return ids;
    }

    private String tituloValido(String titulo) {
        String valor = normalizar(titulo);
        if (valor == null) {
            throw badRequest("Titulo e obrigatorio");
        }
        if (valor.length() > 200) {
            throw badRequest("Titulo deve ter no maximo 200 caracteres");
        }
        return valor;
    }

    private String normalizar(String valor) {
        if (valor == null) {
            return null;
        }
        String normalizado = valor.trim();
        return normalizado.isEmpty() ? null : normalizado;
    }

    private ResponseStatusException badRequest(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    private ResponseStatusException forbidden(String msg) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, msg);
    }

    private ResponseStatusException conflict(String msg) {
        return new ResponseStatusException(HttpStatus.CONFLICT, msg);
    }
}
