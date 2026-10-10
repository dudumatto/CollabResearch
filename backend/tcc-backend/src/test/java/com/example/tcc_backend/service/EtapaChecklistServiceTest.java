package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.OrdemRequest;
import com.example.tcc_backend.dto.request.RevisaoRequest;
import com.example.tcc_backend.dto.request.TarefaPatchRequest;
import com.example.tcc_backend.dto.request.TarefaRequest;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.EtapaProgressoRepository;
import com.example.tcc_backend.repository.EtapaRevisaoRepository;
import com.example.tcc_backend.repository.EtapaTarefaRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import com.example.tcc_backend.security.ProjectAccessPolicy.Relationship;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EtapaChecklistServiceTest {

    @Mock
    private EtapaProgressoRepository etapaRepository;
    @Mock
    private EtapaTarefaRepository tarefaRepository;
    @Mock
    private EtapaRevisaoRepository revisaoRepository;
    @Mock
    private ProjetoRepository projetoRepository;
    @Mock
    private AuthHelper authHelper;
    @Mock
    private ProjectAccessPolicy policy;
    @Mock
    private EtapaResponseAssembler assembler;

    private EtapaChecklistService service;

    private Usuario aluno;
    private Usuario outroAluno;
    private Usuario orientador;
    private Projeto projeto;
    private EtapaProgresso etapa;

    @BeforeEach
    void setUp() {
        service = new EtapaChecklistService(etapaRepository, tarefaRepository, revisaoRepository,
                projetoRepository, authHelper, policy, assembler);
        aluno = TestDataFactory.usuarioAluno(1);
        outroAluno = TestDataFactory.usuarioAluno(3);
        orientador = TestDataFactory.usuarioOrientador(2);
        projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, aluno));
        etapa = TestDataFactory.etapaProgresso(5, projeto, null, 1, 0, EtapaProgressoStatus.PENDING);

        lenient().when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        lenient().when(etapaRepository.findByProjetoIdAndId(10, 5)).thenReturn(Optional.of(etapa));
        lenient().when(tarefaRepository.findByEtapaIdOrderByOrdemAscIdAsc(5)).thenReturn(List.of());
    }

    private void como(Usuario usuario, Relationship relacao) {
        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(policy.relationship(projeto, usuario)).thenReturn(relacao);
    }

    private EtapaTarefa tarefa(int id, TarefaOrigem origem, Usuario criador, boolean obrigatoria, boolean concluida) {
        EtapaTarefa t = EtapaTarefa.builder().id(id).etapa(etapa).titulo("Item " + id).origem(origem)
                .obrigatoria(obrigatoria).concluida(concluida).ordem(id).criadaPor(criador).build();
        lenient().when(tarefaRepository.findByIdAndEtapaId(id, 5)).thenReturn(Optional.of(t));
        return t;
    }

    private static TarefaPatchRequest patch(String titulo, Boolean obrigatoria, Boolean concluida) {
        TarefaPatchRequest r = new TarefaPatchRequest();
        r.setTitulo(titulo);
        r.setObrigatoria(obrigatoria);
        r.setConcluida(concluida);
        return r;
    }

    private static TarefaRequest novaTarefa(String titulo, Boolean obrigatoria) {
        TarefaRequest r = new TarefaRequest();
        r.setTitulo(titulo);
        r.setObrigatoria(obrigatoria);
        return r;
    }

    private static RevisaoRequest revisao(RevisaoRequest.Decisao acao, String comentario) {
        RevisaoRequest r = new RevisaoRequest();
        r.setAcao(acao);
        r.setComentario(comentario);
        return r;
    }

    private static void assertStatus(Runnable acao, HttpStatus esperado) {
        assertThatThrownBy(acao::run)
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(esperado));
    }

    // ---- criacao ----

    @Test
    void orientadorCriaTarefaObrigatoriaComOrigemOrientador() {
        como(orientador, Relationship.RESPONSIBLE_ADVISOR);

        service.criarTarefa(10, 5, novaTarefa("  Revisar capitulo  ", true));

        ArgumentCaptor<EtapaTarefa> captor = ArgumentCaptor.forClass(EtapaTarefa.class);
        verify(tarefaRepository).save(captor.capture());
        assertThat(captor.getValue().getOrigem()).isEqualTo(TarefaOrigem.ORIENTADOR);
        assertThat(captor.getValue().getObrigatoria()).isTrue();
        assertThat(captor.getValue().getTitulo()).isEqualTo("Revisar capitulo");
        assertThat(captor.getValue().getOrdem()).isEqualTo(1);
    }

    @Test
    void alunoCriaTarefaPessoalNuncaObrigatoria() {
        como(aluno, Relationship.STUDENT_CREATOR);

        service.criarTarefa(10, 5, novaTarefa("Estudar", false));
        ArgumentCaptor<EtapaTarefa> captor = ArgumentCaptor.forClass(EtapaTarefa.class);
        verify(tarefaRepository).save(captor.capture());
        assertThat(captor.getValue().getOrigem()).isEqualTo(TarefaOrigem.ALUNO);
        assertThat(captor.getValue().getCriadaPor()).isSameAs(aluno);

        assertStatus(() -> service.criarTarefa(10, 5, novaTarefa("Obrigatoria", true)), HttpStatus.BAD_REQUEST);
    }

    @Test
    void tituloVazioOuMuitoLongoERejeitado() {
        como(orientador, Relationship.RESPONSIBLE_ADVISOR);

        assertStatus(() -> service.criarTarefa(10, 5, novaTarefa("   ", false)), HttpStatus.BAD_REQUEST);
        assertStatus(() -> service.criarTarefa(10, 5, novaTarefa("x".repeat(201), false)), HttpStatus.BAD_REQUEST);
        verify(tarefaRepository, never()).save(any());
    }

    @Test
    void usuariosForaDoProjetoEAdminNaoMutam() {
        como(outroAluno, Relationship.EXTERNAL);
        assertStatus(() -> service.criarTarefa(10, 5, novaTarefa("x", false)), HttpStatus.FORBIDDEN);

        como(TestDataFactory.usuarioAdmin(9), Relationship.ADMIN_AUDITOR);
        assertStatus(() -> service.criarTarefa(10, 5, novaTarefa("x", false)), HttpStatus.FORBIDDEN);
    }

    // ---- permissoes por origem ----

    @Test
    void alunoSoMarcaTarefaDoOrientadorSemEditarEstrutura() {
        como(aluno, Relationship.STUDENT_CREATOR);
        EtapaTarefa t = tarefa(1, TarefaOrigem.ORIENTADOR, orientador, true, false);

        assertStatus(() -> service.atualizarTarefa(10, 5, 1, patch("Outro titulo", null, null)), HttpStatus.FORBIDDEN);
        assertStatus(() -> service.atualizarTarefa(10, 5, 1, patch(null, false, null)), HttpStatus.FORBIDDEN);
        assertStatus(() -> service.excluirTarefa(10, 5, 1), HttpStatus.FORBIDDEN);

        service.atualizarTarefa(10, 5, 1, patch(null, null, true));
        assertThat(t.getConcluida()).isTrue();
        assertThat(t.getConcluidaPor()).isSameAs(aluno);
        assertThat(t.getConcluidaEm()).isNotNull();

        service.atualizarTarefa(10, 5, 1, patch(null, null, false));
        assertThat(t.getConcluida()).isFalse();
        assertThat(t.getConcluidaEm()).isNull();
    }

    @Test
    void orientadorGerenciaSuasTarefasMasSoVisualizaPessoais() {
        como(orientador, Relationship.RESPONSIBLE_ADVISOR);
        EtapaTarefa dele = tarefa(1, TarefaOrigem.ORIENTADOR, orientador, false, false);
        tarefa(2, TarefaOrigem.ALUNO, aluno, false, false);

        service.atualizarTarefa(10, 5, 1, patch("Novo", true, null));
        assertThat(dele.getTitulo()).isEqualTo("Novo");
        assertThat(dele.getObrigatoria()).isTrue();

        assertStatus(() -> service.atualizarTarefa(10, 5, 2, patch("Mudar", null, null)), HttpStatus.FORBIDDEN);
        assertStatus(() -> service.atualizarTarefa(10, 5, 2, patch(null, null, true)), HttpStatus.FORBIDDEN);
        assertStatus(() -> service.excluirTarefa(10, 5, 2), HttpStatus.FORBIDDEN);
    }

    @Test
    void tarefaPessoalSoPodeSerAlteradaPeloAlunoDono() {
        EtapaTarefa t = tarefa(2, TarefaOrigem.ALUNO, aluno, false, false);

        como(outroAluno, Relationship.APPROVED_MEMBER);
        assertStatus(() -> service.atualizarTarefa(10, 5, 2, patch(null, null, true)), HttpStatus.FORBIDDEN);
        assertStatus(() -> service.excluirTarefa(10, 5, 2), HttpStatus.FORBIDDEN);

        como(aluno, Relationship.STUDENT_CREATOR);
        service.atualizarTarefa(10, 5, 2, patch("Meu titulo", null, true));
        assertThat(t.getTitulo()).isEqualTo("Meu titulo");
        assertThat(t.getConcluida()).isTrue();
        assertStatus(() -> service.atualizarTarefa(10, 5, 2, patch(null, true, null)), HttpStatus.BAD_REQUEST);

        service.excluirTarefa(10, 5, 2);
        verify(tarefaRepository).delete(t);
    }

    @Test
    void patchSemCamposOuTarefaInexistenteFalha() {
        como(aluno, Relationship.STUDENT_CREATOR);
        assertStatus(() -> service.atualizarTarefa(10, 5, 1, patch(null, null, null)), HttpStatus.BAD_REQUEST);
        assertStatus(() -> service.atualizarTarefa(10, 5, 99, patch(null, null, true)), HttpStatus.NOT_FOUND);
    }

    // ---- estado do marco ----

    @Test
    void marcoAprovadoNaoAceitaAlteracoes() {
        etapa.setStatus(EtapaProgressoStatus.DONE);
        como(orientador, Relationship.RESPONSIBLE_ADVISOR);
        tarefa(1, TarefaOrigem.ORIENTADOR, orientador, false, false);

        assertStatus(() -> service.criarTarefa(10, 5, novaTarefa("x", false)), HttpStatus.CONFLICT);
        assertStatus(() -> service.atualizarTarefa(10, 5, 1, patch("x", null, null)), HttpStatus.CONFLICT);
        assertStatus(() -> service.excluirTarefa(10, 5, 1), HttpStatus.CONFLICT);
    }

    @Test
    void projetoFinalizadoBloqueiaChecklist() {
        projeto.setStatus(StatusProjeto.FINALIZADO);
        como(aluno, Relationship.STUDENT_CREATOR);

        assertStatus(() -> service.criarTarefa(10, 5, novaTarefa("x", false)), HttpStatus.CONFLICT);
        assertStatus(() -> service.enviarParaRevisao(10, 5), HttpStatus.CONFLICT);
    }

    @Test
    void checklistFicaSomenteLeituraParaTodosEnquantoMarcoEstaEmRevisao() {
        etapa.setStatus(EtapaProgressoStatus.ACTIVE);
        etapa.setEnviadaEm(java.time.LocalDateTime.now());
        como(aluno, Relationship.STUDENT_CREATOR);
        tarefa(1, TarefaOrigem.ORIENTADOR, orientador, false, false);

        assertStatus(() -> service.atualizarTarefa(10, 5, 1, patch(null, null, true)), HttpStatus.CONFLICT);
        assertStatus(() -> service.criarTarefa(10, 5, novaTarefa("x", false)), HttpStatus.CONFLICT);

        como(orientador, Relationship.RESPONSIBLE_ADVISOR);
        assertStatus(() -> service.criarTarefa(10, 5, novaTarefa("x", false)), HttpStatus.CONFLICT);
        assertStatus(() -> service.atualizarTarefa(10, 5, 1, patch("novo", null, null)), HttpStatus.CONFLICT);
        assertStatus(() -> service.excluirTarefa(10, 5, 1), HttpStatus.CONFLICT);
    }

    @Test
    void cemPorCentoNaoAprovaOMarco() {
        como(aluno, Relationship.STUDENT_CREATOR);
        EtapaTarefa unica = tarefa(1, TarefaOrigem.ORIENTADOR, orientador, true, false);
        when(tarefaRepository.findByEtapaIdOrderByOrdemAscIdAsc(5)).thenAnswer(i -> List.of(unica));

        service.atualizarTarefa(10, 5, 1, patch(null, null, true));

        assertThat(unica.getConcluida()).isTrue();
        assertThat(etapa.getStatus()).isEqualTo(EtapaProgressoStatus.ACTIVE);
        assertThat(etapa.getStatus()).isNotEqualTo(EtapaProgressoStatus.DONE);
        assertThat(etapa.getEnviadaEm()).isNull();
    }

    @Test
    void desmarcarTodasVoltaParaNaoIniciado() {
        etapa.setStatus(EtapaProgressoStatus.ACTIVE);
        como(aluno, Relationship.STUDENT_CREATOR);
        EtapaTarefa unica = tarefa(1, TarefaOrigem.ORIENTADOR, orientador, false, true);
        when(tarefaRepository.findByEtapaIdOrderByOrdemAscIdAsc(5)).thenAnswer(i -> List.of(unica));

        service.atualizarTarefa(10, 5, 1, patch(null, null, false));

        assertThat(etapa.getStatus()).isEqualTo(EtapaProgressoStatus.PENDING);
    }

    // ---- ordem ----

    @Test
    void reordenarTarefasMoveSoAsGerenciadasPeloUsuario() {
        como(aluno, Relationship.STUDENT_CREATOR);
        EtapaTarefa doOrientador = tarefa(1, TarefaOrigem.ORIENTADOR, orientador, false, false);
        EtapaTarefa p1 = tarefa(2, TarefaOrigem.ALUNO, aluno, false, false);
        EtapaTarefa p2 = tarefa(3, TarefaOrigem.ALUNO, aluno, false, false);
        EtapaTarefa deOutro = tarefa(4, TarefaOrigem.ALUNO, outroAluno, false, false);
        when(tarefaRepository.findByEtapaIdOrderByOrdemAscIdAsc(5)).thenReturn(List.of(doOrientador, p1, p2, deOutro));

        OrdemRequest req = new OrdemRequest();
        req.setIds(List.of(3, 2));
        service.reordenarTarefas(10, 5, req);

        assertThat(p2.getOrdem()).isEqualTo(2);
        assertThat(p1.getOrdem()).isEqualTo(3);
        assertThat(doOrientador.getOrdem()).isEqualTo(1);
        assertThat(deOutro.getOrdem()).isEqualTo(4);

        OrdemRequest comForaDoEscopo = new OrdemRequest();
        comForaDoEscopo.setIds(List.of(2, 3, 1));
        assertStatus(() -> service.reordenarTarefas(10, 5, comForaDoEscopo), HttpStatus.BAD_REQUEST);
        OrdemRequest duplicada = new OrdemRequest();
        duplicada.setIds(List.of(2, 2));
        assertStatus(() -> service.reordenarTarefas(10, 5, duplicada), HttpStatus.BAD_REQUEST);
    }

    // ---- revisao ----

    @Test
    void enviarParaRevisaoExigeObrigatoriasConcluidas() {
        como(aluno, Relationship.STUDENT_CREATOR);
        EtapaTarefa pendente = tarefa(1, TarefaOrigem.ORIENTADOR, orientador, true, false);
        EtapaTarefa feita = tarefa(2, TarefaOrigem.ORIENTADOR, orientador, false, true);
        when(tarefaRepository.findByEtapaIdOrderByOrdemAscIdAsc(5)).thenReturn(List.of(pendente, feita));

        assertStatus(() -> service.enviarParaRevisao(10, 5), HttpStatus.CONFLICT);
        assertThat(etapa.getEnviadaEm()).isNull();
        verify(revisaoRepository, never()).save(any());
    }

    @Test
    void enviarParaRevisaoMarcaEmRevisaoERegistraHistorico() {
        como(aluno, Relationship.STUDENT_CREATOR);
        EtapaTarefa feita = tarefa(1, TarefaOrigem.ORIENTADOR, orientador, true, true);
        when(tarefaRepository.findByEtapaIdOrderByOrdemAscIdAsc(5)).thenReturn(List.of(feita));

        service.enviarParaRevisao(10, 5);

        assertThat(etapa.getEnviadaEm()).isNotNull();
        assertThat(etapa.getStatus()).isEqualTo(EtapaProgressoStatus.ACTIVE);
        ArgumentCaptor<EtapaRevisao> captor = ArgumentCaptor.forClass(EtapaRevisao.class);
        verify(revisaoRepository).save(captor.capture());
        assertThat(captor.getValue().getAcao()).isEqualTo(RevisaoAcao.ENVIADO);
        assertThat(captor.getValue().getAutor()).isSameAs(aluno);

        assertStatus(() -> service.enviarParaRevisao(10, 5), HttpStatus.CONFLICT);
    }

    @Test
    void marcoSemTarefasPodeSerEnviadoParaRevisao() {
        como(aluno, Relationship.STUDENT_CREATOR);

        service.enviarParaRevisao(10, 5);

        assertThat(etapa.getEnviadaEm()).isNotNull();
    }

    @Test
    void orientadorNaoEnviaParaRevisaoEAlunoNaoRevisa() {
        como(orientador, Relationship.RESPONSIBLE_ADVISOR);
        assertStatus(() -> service.enviarParaRevisao(10, 5), HttpStatus.FORBIDDEN);

        etapa.setEnviadaEm(java.time.LocalDateTime.now());
        como(aluno, Relationship.STUDENT_CREATOR);
        assertStatus(() -> service.revisar(10, 5, revisao(RevisaoRequest.Decisao.APROVAR, null)), HttpStatus.FORBIDDEN);
    }

    @Test
    void revisarExigeMarcoEmRevisao() {
        como(orientador, Relationship.RESPONSIBLE_ADVISOR);

        assertStatus(() -> service.revisar(10, 5, revisao(RevisaoRequest.Decisao.APROVAR, null)), HttpStatus.CONFLICT);
    }

    @Test
    void devolverExigeComentarioERegistraHistoricoSemApagarAnterior() {
        etapa.setStatus(EtapaProgressoStatus.ACTIVE);
        etapa.setEnviadaEm(java.time.LocalDateTime.now());
        como(orientador, Relationship.RESPONSIBLE_ADVISOR);

        assertStatus(() -> service.revisar(10, 5, revisao(RevisaoRequest.Decisao.DEVOLVER, "   ")), HttpStatus.BAD_REQUEST);
        assertThat(etapa.getEnviadaEm()).isNotNull();

        service.revisar(10, 5, revisao(RevisaoRequest.Decisao.DEVOLVER, " Faltou referencia "));

        assertThat(etapa.getStatus()).isEqualTo(EtapaProgressoStatus.REJECTED);
        assertThat(etapa.getEnviadaEm()).isNull();
        ArgumentCaptor<EtapaRevisao> captor = ArgumentCaptor.forClass(EtapaRevisao.class);
        verify(revisaoRepository).save(captor.capture());
        assertThat(captor.getValue().getAcao()).isEqualTo(RevisaoAcao.DEVOLVIDO);
        assertThat(captor.getValue().getComentario()).isEqualTo("Faltou referencia");
        verify(revisaoRepository, never()).delete(any());
        verify(revisaoRepository, never()).deleteAll();
    }

    @Test
    void aprovarMarcaConcluidoRegistraHistoricoEExigeObrigatorias() {
        etapa.setStatus(EtapaProgressoStatus.ACTIVE);
        etapa.setEnviadaEm(java.time.LocalDateTime.now());
        como(orientador, Relationship.RESPONSIBLE_ADVISOR);
        EtapaTarefa obrigatoria = tarefa(1, TarefaOrigem.ORIENTADOR, orientador, true, false);
        when(tarefaRepository.findByEtapaIdOrderByOrdemAscIdAsc(5)).thenAnswer(i -> List.of(obrigatoria));

        assertStatus(() -> service.revisar(10, 5, revisao(RevisaoRequest.Decisao.APROVAR, null)), HttpStatus.CONFLICT);
        assertThat(etapa.getStatus()).isEqualTo(EtapaProgressoStatus.ACTIVE);

        obrigatoria.setConcluida(true);
        service.revisar(10, 5, revisao(RevisaoRequest.Decisao.APROVAR, "Ok"));

        assertThat(etapa.getStatus()).isEqualTo(EtapaProgressoStatus.DONE);
        assertThat(etapa.getEnviadaEm()).isNull();
        assertThat(etapa.getConcluidaPor()).isSameAs(orientador);
        ArgumentCaptor<EtapaRevisao> captor = ArgumentCaptor.forClass(EtapaRevisao.class);
        verify(revisaoRepository).save(captor.capture());
        assertThat(captor.getValue().getAcao()).isEqualTo(RevisaoAcao.APROVADO);
    }

    @Test
    void listarRevisoesExigeParticipanteEMarcoDoProjeto() {
        when(authHelper.getCurrentUser()).thenReturn(aluno);
        when(revisaoRepository.findHistorico(5)).thenReturn(List.of(
                EtapaRevisao.builder().id(1).etapa(etapa).acao(RevisaoAcao.ENVIADO).autor(aluno).build()));

        assertThat(service.listarRevisoes(10, 5)).hasSize(1);
        verify(policy).requireCanViewTeam(projeto, aluno);

        when(etapaRepository.findByProjetoIdAndId(10, 77)).thenReturn(Optional.empty());
        assertStatus(() -> service.listarRevisoes(10, 77), HttpStatus.NOT_FOUND);
    }
}
