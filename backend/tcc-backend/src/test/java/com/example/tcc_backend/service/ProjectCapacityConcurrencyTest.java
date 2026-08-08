package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.ProjetoRequest;
import com.example.tcc_backend.dto.request.InscricaoRequest;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.*;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
class ProjectCapacityConcurrencyTest {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private OrientadorRepository orientadorRepository;
    @Autowired private AlunoRepository alunoRepository;
    @Autowired private CursoRepository cursoRepository;
    @Autowired private AreaPesquisaRepository areaPesquisaRepository;
    @Autowired private ProjetoRepository projetoRepository;
    @Autowired private InscricaoRepository inscricaoRepository;
    @Autowired private EtapaProgressoRepository etapaProgressoRepository;
    @Autowired private PlatformTransactionManager transactionManager;

    @Test
    void aprovacaoConcorrenteComReducaoNuncaDeveExcederVagas() throws Exception {
        String suffix = Long.toString(System.nanoTime());
        Curso curso = cursoRepository.save(Curso.builder().nome("Curso " + suffix).build());
        AreaPesquisa area = areaPesquisaRepository.save(AreaPesquisa.builder().nome("Area " + suffix).curso(curso).build());
        Usuario advisorUser = usuarioRepository.save(usuario("advisor-" + suffix, TipoUsuario.ORIENTADOR));
        Orientador advisor = orientadorRepository.save(Orientador.builder()
                .usuario(advisorUser).departamento("Computacao").titulacao("Doutor").build());
        Usuario firstUser = usuarioRepository.save(usuario("student-a-" + suffix, TipoUsuario.ALUNO));
        Usuario secondUser = usuarioRepository.save(usuario("student-b-" + suffix, TipoUsuario.ALUNO));
        Aluno first = alunoRepository.save(Aluno.builder().usuario(firstUser).ra("RA-A-" + suffix).curso(curso).build());
        Aluno second = alunoRepository.save(Aluno.builder().usuario(secondUser).ra("RA-B-" + suffix).curso(curso).build());
        Projeto projeto = projetoRepository.save(Projeto.builder().titulo("Concorrencia " + suffix)
                .area(area).orientador(advisor).vagas(2).status(StatusProjeto.ABERTO).build());
        inscricaoRepository.save(Inscricao.builder().aluno(first).projeto(projeto).status(StatusInscricao.APROVADO).build());
        Inscricao pendente = inscricaoRepository.save(Inscricao.builder().aluno(second).projeto(projeto).status(StatusInscricao.PENDENTE).build());

        AuthHelper authHelper = mock(AuthHelper.class);
        when(authHelper.getCurrentUser()).thenReturn(advisorUser);
        NotificacaoService notificacaoService = mock(NotificacaoService.class);
        ProjectAccessPolicy policy = new ProjectAccessPolicy(inscricaoRepository);
        InscricaoService inscricaoService = new InscricaoService(inscricaoRepository, alunoRepository,
                projetoRepository, authHelper, notificacaoService, policy);
        ProjetoService projetoService = new ProjetoService(projetoRepository, orientadorRepository, alunoRepository,
                inscricaoRepository, areaPesquisaRepository, usuarioRepository, authHelper, notificacaoService,
                mock(EtapaProgressoService.class), policy, etapaProgressoRepository);
        ProjetoRequest request = ProjetoRequest.builder().titulo(projeto.getTitulo()).descricao("Atualizado")
                .vagas(1).areaId(area.getId()).build();

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        AtomicReference<Throwable> approvalFailure = new AtomicReference<>();
        AtomicReference<Throwable> updateFailure = new AtomicReference<>();
        TransactionTemplate transactions = new TransactionTemplate(transactionManager);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var approval = executor.submit(() -> runConcurrent(ready, start, approvalFailure,
                    () -> transactions.executeWithoutResult(status -> inscricaoService.aprovar(pendente.getId()))));
            var update = executor.submit(() -> runConcurrent(ready, start, updateFailure,
                    () -> transactions.executeWithoutResult(status -> projetoService.update(projeto.getId(), request))));
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            approval.get(15, TimeUnit.SECONDS);
            update.get(15, TimeUnit.SECONDS);
        }

        Projeto persisted = projetoRepository.findById(projeto.getId()).orElseThrow();
        long approved = inscricaoRepository.countByProjetoIdAndStatus(projeto.getId(), StatusInscricao.APROVADO);
        assertThat(approved).isLessThanOrEqualTo(persisted.getVagas());
        assertThat(java.util.stream.Stream.of(approvalFailure.get(), updateFailure.get())
                .filter(java.util.Objects::nonNull).count()).isEqualTo(1);
        Throwable conflict = Optional.ofNullable(approvalFailure.get()).orElse(updateFailure.get());
        assertThat(conflict).isInstanceOf(ResponseStatusException.class);
        assertThat(((ResponseStatusException) conflict).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void duasAprovacoesConcorrentesDevemDisputarUmaUnicaVaga() throws Exception {
        String suffix = "last-seat-" + System.nanoTime();
        Curso curso = cursoRepository.save(Curso.builder().nome("Curso " + suffix).build());
        String raSuffix = suffix.substring(suffix.length() - 8);
        AreaPesquisa area = areaPesquisaRepository.save(AreaPesquisa.builder().nome("Area " + suffix).curso(curso).build());
        Usuario advisorUser = usuarioRepository.save(usuario("advisor-" + suffix, TipoUsuario.ORIENTADOR));
        Orientador advisor = orientadorRepository.save(Orientador.builder()
                .usuario(advisorUser).departamento("Computacao").titulacao("Doutor").build());
        Usuario firstUser = usuarioRepository.save(usuario("student-a-" + suffix, TipoUsuario.ALUNO));
        Usuario secondUser = usuarioRepository.save(usuario("student-b-" + suffix, TipoUsuario.ALUNO));
        Aluno first = alunoRepository.save(Aluno.builder().usuario(firstUser).ra("RA-A-" + raSuffix).curso(curso).build());
        Aluno second = alunoRepository.save(Aluno.builder().usuario(secondUser).ra("RA-B-" + raSuffix).curso(curso).build());
        Projeto projeto = projetoRepository.save(Projeto.builder().titulo("Ultima vaga " + suffix)
                .area(area).orientador(advisor).vagas(1).status(StatusProjeto.ABERTO).build());
        Inscricao firstPending = inscricaoRepository.save(
                Inscricao.builder().aluno(first).projeto(projeto).status(StatusInscricao.PENDENTE).build());
        Inscricao secondPending = inscricaoRepository.save(
                Inscricao.builder().aluno(second).projeto(projeto).status(StatusInscricao.PENDENTE).build());

        InscricaoRepository coordinatedRepository = mock(
                InscricaoRepository.class, org.mockito.AdditionalAnswers.delegatesTo(inscricaoRepository));
        CountDownLatch reachedScalarRead = new CountDownLatch(2);
        org.mockito.Mockito.doAnswer(invocation -> {
            Integer inscricaoId = invocation.getArgument(0);
            Optional<Integer> projectId = inscricaoRepository.findProjetoIdById(inscricaoId);
            reachedScalarRead.countDown();
            if (!reachedScalarRead.await(10, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Scalar read barrier timeout");
            }
            return projectId;
        }).when(coordinatedRepository).findProjetoIdById(org.mockito.ArgumentMatchers.anyInt());

        AuthHelper authHelper = mock(AuthHelper.class);
        when(authHelper.getCurrentUser()).thenReturn(advisorUser);
        ProjectAccessPolicy policy = new ProjectAccessPolicy(coordinatedRepository);
        InscricaoService service = new InscricaoService(coordinatedRepository, alunoRepository,
                projetoRepository, authHelper, mock(NotificacaoService.class), policy);

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        AtomicReference<Throwable> firstFailure = new AtomicReference<>();
        AtomicReference<Throwable> secondFailure = new AtomicReference<>();
        TransactionTemplate transactions = new TransactionTemplate(transactionManager);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var firstApproval = executor.submit(() -> runConcurrent(ready, start, firstFailure,
                    () -> transactions.executeWithoutResult(status -> service.aprovar(firstPending.getId()))));
            var secondApproval = executor.submit(() -> runConcurrent(ready, start, secondFailure,
                    () -> transactions.executeWithoutResult(status -> service.aprovar(secondPending.getId()))));
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            firstApproval.get(15, TimeUnit.SECONDS);
            secondApproval.get(15, TimeUnit.SECONDS);
        }

        assertThat(inscricaoRepository.countByProjetoIdAndStatus(projeto.getId(), StatusInscricao.APROVADO))
                .isEqualTo(1);
        assertThat(java.util.stream.Stream.of(firstFailure.get(), secondFailure.get())
                .filter(java.util.Objects::nonNull).count()).isEqualTo(1);
        Throwable conflict = Optional.ofNullable(firstFailure.get()).orElse(secondFailure.get());
        assertThat(conflict).isInstanceOf(ResponseStatusException.class);
        assertThat(((ResponseStatusException) conflict).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void atualizarMotivacaoConcorrenteComAprovacaoDevePreservarStatus() throws Exception {
        String suffix = "motivation-" + System.nanoTime();
        String raSuffix = suffix.substring(suffix.length() - 8);
        Curso curso = cursoRepository.save(Curso.builder().nome("Curso " + suffix).build());
        AreaPesquisa area = areaPesquisaRepository.save(AreaPesquisa.builder().nome("Area " + suffix).curso(curso).build());
        Usuario advisorUser = usuarioRepository.save(usuario("advisor-" + suffix, TipoUsuario.ORIENTADOR));
        Orientador advisor = orientadorRepository.save(Orientador.builder()
                .usuario(advisorUser).departamento("Computacao").titulacao("Doutor").build());
        Usuario studentUser = usuarioRepository.save(usuario("student-" + suffix, TipoUsuario.ALUNO));
        Aluno student = alunoRepository.save(Aluno.builder().usuario(studentUser)
                .ra("RA-" + raSuffix).curso(curso).build());
        Projeto projeto = projetoRepository.save(Projeto.builder().titulo("Motivacao " + suffix)
                .area(area).orientador(advisor).vagas(1).status(StatusProjeto.ABERTO).build());
        Inscricao pendente = inscricaoRepository.save(Inscricao.builder().aluno(student).projeto(projeto)
                .status(StatusInscricao.PENDENTE).motivacao("Original").build());

        CountDownLatch motivationHasLock = new CountDownLatch(1);
        CountDownLatch approvalReachedScalar = new CountDownLatch(1);
        InscricaoRepository coordinatedRepository = mock(
                InscricaoRepository.class, org.mockito.AdditionalAnswers.delegatesTo(inscricaoRepository));
        org.mockito.Mockito.doAnswer(invocation -> {
            Optional<Inscricao> locked = inscricaoRepository.findByIdForUpdate(invocation.getArgument(0));
            if (Thread.currentThread().getName().equals("motivation")) {
                motivationHasLock.countDown();
                if (!approvalReachedScalar.await(10, TimeUnit.SECONDS)) {
                    throw new IllegalStateException("Approval scalar barrier timeout");
                }
            }
            return locked;
        }).when(coordinatedRepository).findByIdForUpdate(org.mockito.ArgumentMatchers.anyInt());
        org.mockito.Mockito.doAnswer(invocation -> {
            Optional<Integer> projectId = inscricaoRepository.findProjetoIdById(invocation.getArgument(0));
            approvalReachedScalar.countDown();
            return projectId;
        }).when(coordinatedRepository).findProjetoIdById(org.mockito.ArgumentMatchers.anyInt());

        AuthHelper authHelper = mock(AuthHelper.class);
        when(authHelper.getCurrentUser()).thenAnswer(invocation ->
                Thread.currentThread().getName().equals("motivation") ? studentUser : advisorUser);
        ProjectAccessPolicy policy = new ProjectAccessPolicy(coordinatedRepository);
        InscricaoService service = new InscricaoService(coordinatedRepository, alunoRepository,
                projetoRepository, authHelper, mock(NotificacaoService.class), policy);
        TransactionTemplate transactions = new TransactionTemplate(transactionManager);
        AtomicReference<Throwable> motivationFailure = new AtomicReference<>();
        AtomicReference<Throwable> approvalFailure = new AtomicReference<>();

        try (var executor = Executors.newFixedThreadPool(2)) {
            var motivation = executor.submit(() -> {
                Thread.currentThread().setName("motivation");
                try {
                    transactions.executeWithoutResult(status -> service.update(pendente.getId(),
                            InscricaoRequest.builder().projetoId(projeto.getId()).motivacao("Nova motivacao").build()));
                } catch (Throwable error) {
                    motivationFailure.set(error);
                }
            });
            assertThat(motivationHasLock.await(10, TimeUnit.SECONDS)).isTrue();
            var approval = executor.submit(() -> {
                Thread.currentThread().setName("approval");
                try {
                    transactions.executeWithoutResult(status -> service.aprovar(pendente.getId()));
                } catch (Throwable error) {
                    approvalFailure.set(error);
                }
            });
            motivation.get(15, TimeUnit.SECONDS);
            approval.get(15, TimeUnit.SECONDS);
        }

        Inscricao persisted = inscricaoRepository.findById(pendente.getId()).orElseThrow();
        assertThat(motivationFailure.get()).isNull();
        assertThat(approvalFailure.get()).isNull();
        assertThat(persisted.getStatus()).isEqualTo(StatusInscricao.APROVADO);
        assertThat(persisted.getMotivacao()).isEqualTo("Nova motivacao");
    }

    private Usuario usuario(String name, TipoUsuario tipo) {
        return Usuario.builder().nome(name).email(name + "@test.local").senha("encoded-password")
                .tipo(tipo).ativo(true).build();
    }

    private void runConcurrent(CountDownLatch ready, CountDownLatch start,
                               AtomicReference<Throwable> failure, Runnable action) {
        ready.countDown();
        try {
            if (!start.await(10, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Concurrent start timeout");
            }
            action.run();
        } catch (Throwable error) {
            failure.set(error);
        }
    }
}
