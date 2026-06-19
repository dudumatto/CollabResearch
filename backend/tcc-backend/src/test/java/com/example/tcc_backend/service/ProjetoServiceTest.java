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
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjetoServiceTest {

    @Mock
    private ProjetoRepository projetoRepository;
    @Mock
    private OrientadorRepository orientadorRepository;
    @Mock
    private AlunoRepository alunoRepository;
    @Mock
    private InscricaoRepository inscricaoRepository;
    @Mock
    private AreaPesquisaRepository areaPesquisaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AuthHelper authHelper;
    @Mock
    private NotificacaoService notificacaoService;
    @Mock
    private EtapaProgressoService etapaProgressoService;

    @InjectMocks
    private ProjetoService projetoService;

    @Test
    void createDeveCriarProjetoPendenteEInscricaoQuandoUsuarioForAluno() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Aluno aluno = TestDataFactory.aluno(1, usuario);
        Orientador orientador = TestDataFactory.orientador(2, orientadorUsuario);
        AreaPesquisa area = AreaPesquisa.builder().id(3).nome("IA").build();
        ProjetoRequest request = requestProjeto();
        request.setOrientadorId(2);

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(areaPesquisaRepository.findById(3)).thenReturn(Optional.of(area));
        when(orientadorRepository.findByUsuarioId(2)).thenReturn(Optional.of(orientador));
        when(alunoRepository.findByUsuarioId(1)).thenReturn(Optional.of(aluno));
        when(projetoRepository.save(any(Projeto.class))).thenAnswer(invocation -> {
            Projeto projeto = invocation.getArgument(0);
            projeto.setId(10);
            return projeto;
        });
        when(inscricaoRepository.save(any(Inscricao.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Projeto projeto = projetoService.create(request);

        assertThat(projeto.getId()).isEqualTo(10);
        assertThat(projeto.getStatus()).isEqualTo(StatusProjeto.PENDENTE_ORIENTADOR);
        assertThat(projeto.getOrientador()).isEqualTo(orientador);
        assertThat(projeto.getAlunoCriador()).isEqualTo(aluno);
        verify(inscricaoRepository).save(any(Inscricao.class));
        verify(notificacaoService).criarNotificacao(
                2,
                "Novo projeto aguardando aceite de orientacao",
                TipoNotificacao.SOLICITACAO_ORIENTACAO,
                "PROJETO",
                10,
                "/app/projects/10",
                "Projeto"
        );
    }

    @Test
    void createDeveExigirOrientadorQuandoUsuarioForAluno() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        AreaPesquisa area = AreaPesquisa.builder().id(3).nome("IA").build();

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(areaPesquisaRepository.findById(3)).thenReturn(Optional.of(area));

        assertThatThrownBy(() -> projetoService.create(requestProjeto()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException response = (ResponseStatusException) ex;
                    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(response.getReason()).isEqualTo("Orientador e obrigatorio para projetos criados por alunos");
                });

        verify(projetoRepository, never()).save(any(Projeto.class));
    }

    @Test
    void createDevePermitirOrientadorComoResponsavel() {
        Usuario usuario = TestDataFactory.usuarioOrientador(2);
        Orientador orientador = TestDataFactory.orientador(2, usuario);
        AreaPesquisa area = AreaPesquisa.builder().id(3).nome("IA").build();

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(areaPesquisaRepository.findById(3)).thenReturn(Optional.of(area));
        when(orientadorRepository.findByUsuarioId(2)).thenReturn(Optional.of(orientador));
        when(projetoRepository.save(any(Projeto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Projeto projeto = projetoService.create(requestProjeto());

        assertThat(projeto.getOrientador()).isEqualTo(orientador);
        assertThat(projeto.getAlunoCriador()).isNull();
        assertThat(projeto.getTecnologias()).isEqualTo("React, Spring");
        verify(inscricaoRepository, never()).save(any(Inscricao.class));
    }

    @Test
    void aceitarOrientacaoDeveAbrirProjetoENotificarAluno() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, orientadorUsuario));
        projeto.setAlunoCriador(TestDataFactory.aluno(1, alunoUsuario));
        projeto.setStatus(StatusProjeto.PENDENTE_ORIENTADOR);

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(projetoRepository.save(any(Projeto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Projeto aceito = projetoService.aceitarOrientacao(10);

        assertThat(aceito.getStatus()).isEqualTo(StatusProjeto.ABERTO);
        verify(notificacaoService).criarNotificacao(
                1,
                "Seu projeto foi aceito pelo orientador",
                TipoNotificacao.PROJETO_ACEITO,
                "PROJETO",
                10,
                "/app/projects/10",
                "Projeto 10"
        );
    }

    @Test
    void rejeitarOrientacaoDeveMarcarProjetoComoRecusado() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, orientadorUsuario));
        projeto.setAlunoCriador(TestDataFactory.aluno(1, alunoUsuario));
        projeto.setStatus(StatusProjeto.PENDENTE_ORIENTADOR);

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(projetoRepository.save(any(Projeto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Projeto rejeitado = projetoService.rejeitarOrientacao(10);

        assertThat(rejeitado.getStatus()).isEqualTo(StatusProjeto.REJEITADO_ORIENTADOR);
        verify(notificacaoService).criarNotificacao(
                1,
                "Seu projeto foi recusado pelo orientador",
                TipoNotificacao.PROJETO_REJEITADO,
                "PROJETO",
                10,
                "/app/projects/10",
                "Projeto 10"
        );
    }

    @Test
    void aceitarOrientacaoDeveNegarOrientadorDiferenteDoSolicitado() {
        Usuario outroOrientador = TestDataFactory.usuarioOrientador(9);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
        projeto.setStatus(StatusProjeto.PENDENTE_ORIENTADOR);

        when(authHelper.getCurrentUser()).thenReturn(outroOrientador);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

        assertThatThrownBy(() -> projetoService.aceitarOrientacao(10))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        verify(projetoRepository, never()).save(any(Projeto.class));
    }

    @Test
    void updateDeveNegarUsuarioSemPermissao() {
        Usuario outro = TestDataFactory.usuarioAluno(9);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));

        when(authHelper.getCurrentUser()).thenReturn(outro);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

        assertThatThrownBy(() -> projetoService.update(10, requestProjeto()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void updateDevePermitirOrientadorDoProjeto() {
        Usuario usuario = TestDataFactory.usuarioOrientador(2);
        Orientador orientador = TestDataFactory.orientador(2, usuario);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, orientador);
        AreaPesquisa area = AreaPesquisa.builder().id(3).nome("IA").build();

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(areaPesquisaRepository.findById(3)).thenReturn(Optional.of(area));
        when(projetoRepository.save(any(Projeto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Projeto atualizado = projetoService.update(10, requestProjeto());

        assertThat(atualizado.getOrientador()).isEqualTo(orientador);
        assertThat(atualizado.getTecnologias()).isEqualTo("React, Spring");
    }

    @Test
    void createDeveNegarLimiteDeInscricaoDepoisDoTermino() {
        ProjetoRequest request = requestProjeto();
        request.setDataFim(LocalDate.of(2026, 7, 30));
        request.setDataLimiteInscricao(LocalDate.of(2026, 12, 25));

        assertThatThrownBy(() -> projetoService.create(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getReason())
                        .isEqualTo("Limite de inscricao deve ser igual ou anterior a data de termino"));
    }

    @Test
    void deleteDevePermitirAlunoCriador() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, usuario));

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

        projetoService.delete(10);

        verify(projetoRepository).delete(projeto);
    }

    @Test
    void recrutarDeveAprovarAlunoECriarNotificacao() {
        Usuario gestor = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, gestor));
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(3);
        Aluno aluno = TestDataFactory.aluno(3, alunoUsuario);

        when(authHelper.getCurrentUser()).thenReturn(gestor);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(usuarioRepository.findById(3)).thenReturn(Optional.of(alunoUsuario));
        when(alunoRepository.findByUsuarioId(3)).thenReturn(Optional.of(aluno));
        when(inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(10, 3)).thenReturn(Optional.empty());
        when(inscricaoRepository.save(any(Inscricao.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Inscricao inscricao = projetoService.recrutar(10, 3);

        assertThat(inscricao.getStatus()).isEqualTo(StatusInscricao.APROVADO);
        verify(notificacaoService).criarNotificacao(
                3,
                "Voce foi recrutado para um projeto",
                TipoNotificacao.INSCRICAO_APROVADA,
                "PROJETO",
                10,
                "/app/projects/10",
                "Projeto 10"
        );
    }

    @Test
    void recrutarDeveNegarOrientadorQueNaoGerenciaProjeto() {
        Usuario gestor = TestDataFactory.usuarioOrientador(9);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));

        when(authHelper.getCurrentUser()).thenReturn(gestor);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

        assertThatThrownBy(() -> projetoService.recrutar(10, 3))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        verify(usuarioRepository, never()).findById(3);
    }

    @Test
    void listarColaboradoresDeveRetornarUsuariosSemDuplicar() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, orientadorUsuario));
        projeto.setAlunoCriador(TestDataFactory.aluno(1, alunoUsuario));
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, TestDataFactory.aluno(1, alunoUsuario), projeto);

        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(inscricaoRepository.findByProjetoIdAndStatus(10, StatusInscricao.APROVADO)).thenReturn(List.of(inscricao));

        List<Usuario> colaboradores = projetoService.listarColaboradores(10);

        assertThat(colaboradores).hasSize(2);
    }

    @Test
    void removerColaboradorDeveNegarRemocaoDoAlunoCriador() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, usuario));

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

        assertThatThrownBy(() -> projetoService.removerColaborador(10, 1))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void findByBuscaDeveDelegarAoRepositorio() {
        when(projetoRepository.findByTituloContainingIgnoreCase("java")).thenReturn(List.of());

        List<Projeto> projetos = projetoService.findByBusca("java");

        assertThat(projetos).isEmpty();
    }

    private ProjetoRequest requestProjeto() {
        ProjetoRequest request = new ProjetoRequest();
        request.setTitulo("Projeto");
        request.setDescricao("Descricao");
        request.setRequisitos("Java");
        request.setTecnologias("React, Spring");
        request.setVagas(2);
        request.setAreaId(3);
        return request;
    }
}
