package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.OrientadorPerfilRequest;
import com.example.tcc_backend.dto.request.UsuarioRequest;
import com.example.tcc_backend.dto.response.*;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.*;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrientadorServiceTest {

    @Mock
    private AuthHelper authHelper;
    @Mock
    private ProjetoRepository projetoRepository;
    @Mock
    private InscricaoRepository inscricaoRepository;
    @Mock
    private EtapaProgressoRepository etapaProgressoRepository;
    @Mock
    private ProjectDeliveryRepository projectDeliveryRepository;
    @Mock
    private AcademicEvaluationRepository academicEvaluationRepository;
    @Mock
    private AcademicEvaluationAcknowledgementRepository acknowledgementRepository;
    @Mock
    private AlunoRepository alunoRepository;
    @Mock
    private ProgressoRepository progressoRepository;
    @Mock
    private OrientadorRepository orientadorRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private UsuarioService usuarioService;

    private OrientadorService orientadorService;

    private Usuario orientadorUsuario;
    private Usuario alunoUsuario;
    private Aluno aluno;
    private Projeto projetoAberto;
    private Projeto projetoAndamento;
    private Inscricao inscricaoAprovadaAberto;
    private Inscricao inscricaoAprovadaAndamento;

    @BeforeEach
    void setUp() {
        orientadorService = new OrientadorService(
                authHelper, projetoRepository, inscricaoRepository, etapaProgressoRepository,
                projectDeliveryRepository, academicEvaluationRepository, acknowledgementRepository,
                alunoRepository, progressoRepository, orientadorRepository, usuarioRepository, usuarioService);

        orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        alunoUsuario = TestDataFactory.usuarioAluno(1);
        aluno = TestDataFactory.aluno(1, alunoUsuario);

        Orientador orientador = TestDataFactory.orientador(2, orientadorUsuario);

        projetoAberto = Projeto.builder()
                .id(10).titulo("Projeto A").status(StatusProjeto.ABERTO).vagas(5)
                .orientador(orientador).build();
        projetoAndamento = Projeto.builder()
                .id(11).titulo("Projeto B").status(StatusProjeto.EM_ANDAMENTO).vagas(3)
                .orientador(orientador).build();

        inscricaoAprovadaAberto = Inscricao.builder()
                .id(20).aluno(aluno).projeto(projetoAberto).status(StatusInscricao.APROVADO).build();
        inscricaoAprovadaAndamento = Inscricao.builder()
                .id(21).aluno(aluno).projeto(projetoAndamento).status(StatusInscricao.APROVADO).build();
    }

    private void autenticarOrientador() {
        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findByOrientadorUsuarioId(2))
                .thenReturn(List.of(projetoAberto, projetoAndamento));
        when(inscricaoRepository.findByProjetoOrientadorUsuarioId(2))
                .thenReturn(List.of(inscricaoAprovadaAberto, inscricaoAprovadaAndamento));
    }

    @Test
    void dashboardDeveCalcularMetricas() {
        autenticarOrientador();

        EtapaProgresso atrasada = EtapaProgresso.builder()
                .id(30).projeto(projetoAberto).titulo("Etapa atrasada").peso(40)
                .status(EtapaProgressoStatus.PENDING)
                .prazo(OffsetDateTime.now().minusDays(2)).build();
        when(etapaProgressoRepository.findByProjetoOrientadorUsuarioId(2)).thenReturn(List.of(atrasada));

        ProjectDelivery entrega = ProjectDelivery.builder()
                .id(40L).projeto(projetoAberto).autor(alunoUsuario).titulo("Monografia")
                .categoria("documento").status(EntregaStatus.PENDING_REVIEW).build();
        when(projectDeliveryRepository.findByProjetoOrientadorUsuarioId(2)).thenReturn(List.of(entrega));

        AcademicEvaluation avaliacao = AcademicEvaluation.builder()
                .id(50L).projeto(projetoAberto).aluno(aluno).build();
        when(academicEvaluationRepository.findByProjetoOrientadorUsuarioId(2)).thenReturn(List.of(avaliacao));
        when(acknowledgementRepository.existsByAvaliacaoId(50L)).thenReturn(false);

        OrientadorDashboardResponse response = orientadorService.dashboard();

        assertThat(response.getMetricas().getProjetosAtivos()).isEqualTo(2);
        assertThat(response.getMetricas().getSolicitacoesOrientacao()).isZero();
        assertThat(response.getMetricas().getInscricoesPendentes()).isZero();
        assertThat(response.getMetricas().getOrientandosAtivos()).isEqualTo(1);
        assertThat(response.getMetricas().getEtapasAtrasadas()).isEqualTo(1);
        assertThat(response.getMetricas().getEntregasAguardandoRevisao()).isEqualTo(1);
        assertThat(response.getMetricas().getAvaliacoesAguardandoCiencia()).isEqualTo(1);

        assertThat(response.getFilas().getEtapasAtrasadas()).hasSize(1);
        assertThat(response.getFilas().getEtapasAtrasadas().get(0).getDestino()).isEqualTo("/app/projects/10");
        assertThat(response.getFilas().getEntregasAguardandoRevisao()).hasSize(1);
        assertThat(response.getFilas().getAvaliacoesAguardandoCiencia()).hasSize(1);
    }

    @Test
    void filasDevemSerLimitadasACincoItens() {
        autenticarOrientador();
        when(etapaProgressoRepository.findByProjetoOrientadorUsuarioId(2)).thenReturn(List.of());
        when(projectDeliveryRepository.findByProjetoOrientadorUsuarioId(2)).thenReturn(List.of());
        when(academicEvaluationRepository.findByProjetoOrientadorUsuarioId(2)).thenReturn(List.of());

        Usuario alunoPendenteUsuario = TestDataFactory.usuarioAluno(3);
        Aluno alunoPendente = TestDataFactory.aluno(3, alunoPendenteUsuario);
        List<Inscricao> pendentes = java.util.stream.IntStream.range(0, 6)
                .mapToObj(i -> Inscricao.builder()
                        .id(100 + i)
                        .aluno(alunoPendente)
                        .projeto(projetoAberto)
                        .status(StatusInscricao.PENDENTE)
                        .build())
                .toList();
        when(inscricaoRepository.findByProjetoOrientadorUsuarioId(2))
                .thenReturn(java.util.stream.Stream.concat(
                                List.of(inscricaoAprovadaAberto, inscricaoAprovadaAndamento).stream(),
                                pendentes.stream())
                        .toList());

        OrientadorDashboardResponse response = orientadorService.dashboard();

        assertThat(response.getMetricas().getInscricoesPendentes()).isEqualTo(6);
        assertThat(response.getFilas().getInscricoesPendentes()).hasSize(5);
    }

    @Test
    void orientandosDevemDeduplicarAlunoEmVariosProjetos() {
        autenticarOrientador();
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of());
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(11)).thenReturn(List.of());

        List<OrientandoResponse> orientandos = orientadorService.orientandos(null, null, null);

        assertThat(orientandos).hasSize(1);
        OrientandoResponse unico = orientandos.get(0);
        assertThat(unico.getAlunoId()).isEqualTo(1);
        assertThat(unico.getProjetos()).hasSize(2);
        assertThat(unico.getSituacao()).isEqualTo("EM_ANDAMENTO");
    }

    @Test
    void orientandosDevemSuportarBuscaPorNomeESituacao() {
        autenticarOrientador();
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of());
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(11)).thenReturn(List.of());

        assertThat(orientadorService.orientandos("Aluno Teste", null, null)).hasSize(1);
        assertThat(orientadorService.orientandos("Inexistente", null, null)).isEmpty();
        assertThat(orientadorService.orientandos(null, "EM_ANDAMENTO", null)).hasSize(1);
        assertThat(orientadorService.orientandos(null, "ABERTO", null)).isEmpty();
    }

    @Test
    void orientandosDevemFiltrarPorProjeto() {
        autenticarOrientador();
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of());
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(11)).thenReturn(List.of());

        assertThat(orientadorService.orientandos(null, null, 11)).hasSize(1);
        assertThat(orientadorService.orientandos(null, null, 99)).isEmpty();
    }

    @Test
    void orientandosDeveIncluirProgressoEPendencias() {
        autenticarOrientador();
        EtapaProgresso concluida = EtapaProgresso.builder()
                .id(30).projeto(projetoAberto).titulo("Concluida").peso(40)
                .status(EtapaProgressoStatus.DONE).build();
        EtapaProgresso atrasada = EtapaProgresso.builder()
                .id(31).projeto(projetoAberto).titulo("Atrasada").peso(60)
                .status(EtapaProgressoStatus.PENDING)
                .prazo(OffsetDateTime.now().minusDays(1)).build();
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of(concluida, atrasada));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(11)).thenReturn(List.of());

        OrientandoResponse orientando = orientadorService.orientandos(null, null, 10).get(0);

        assertThat(orientando.getProgresso()).isEqualTo(40);
        assertThat(orientando.getPendencias()).isEqualTo(1);
    }

    @Test
    void detalheOrientandoDeveRetornarEtapasPrazosEHistorico() {
        autenticarOrientador();
        when(alunoRepository.findById(1)).thenReturn(Optional.of(aluno));

        EtapaProgresso etapa = EtapaProgresso.builder()
                .id(30).projeto(projetoAberto).titulo("Revisao").peso(50).ordem(1)
                .status(EtapaProgressoStatus.PENDING)
                .responsavel(EtapaResponsavel.AMBOS)
                .prazo(OffsetDateTime.now().plusDays(3))
                .obrigatoria(true)
                .build();
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of(etapa));

        Progresso historico = Progresso.builder()
                .id(60).projeto(projetoAberto).autor(alunoUsuario)
                .titulo("Entrega parcial").categoria("progress").build();
        when(progressoRepository.findByProjetoIdAndAutorIdOrderByDataRegistroDesc(10, 1))
                .thenReturn(List.of(historico));

        OrientandoDetalheResponse detalhe = orientadorService.detalheOrientando(1, 10);

        assertThat(detalhe.getNome()).isEqualTo("Aluno Teste");
        assertThat(detalhe.getProjetoSelecionado().getProjetoId()).isEqualTo(10);
        assertThat(detalhe.getEtapas()).hasSize(1);
        assertThat(detalhe.getEtapas().get(0).getPrazo()).isNotNull();
        assertThat(detalhe.getEtapas().get(0).getResponsavel()).isEqualTo(EtapaResponsavel.AMBOS);
        assertThat(detalhe.getHistorico()).hasSize(1);
        assertThat(detalhe.getProjetos()).hasSize(2);
    }

    @Test
    void detalheOrientandoDeveEscolherProjetoPreferido() {
        autenticarOrientador();
        when(alunoRepository.findById(1)).thenReturn(Optional.of(aluno));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(11)).thenReturn(List.of());
        when(progressoRepository.findByProjetoIdAndAutorIdOrderByDataRegistroDesc(11, 1)).thenReturn(List.of());

        OrientandoDetalheResponse detalhe = orientadorService.detalheOrientando(1, null);

        assertThat(detalhe.getProjetoSelecionado().getProjetoId()).isEqualTo(11);
    }

    @Test
    void detalheOrientandoDeveNegarAlunoDeOutroOrientador() {
        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findByOrientadorUsuarioId(2)).thenReturn(List.of(projetoAberto, projetoAndamento));
        when(inscricaoRepository.findByProjetoOrientadorUsuarioId(2)).thenReturn(List.of());

        Aluno alunoExterno = TestDataFactory.aluno(9, TestDataFactory.usuarioAluno(9));
        when(alunoRepository.findById(9)).thenReturn(Optional.of(alunoExterno));

        assertThatThrownBy(() -> orientadorService.detalheOrientando(9, null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void detalheOrientandoDeveNegarAcessoAProjetoForaDoEscopo() {
        autenticarOrientador();
        when(alunoRepository.findById(1)).thenReturn(Optional.of(aluno));

        assertThatThrownBy(() -> orientadorService.detalheOrientando(1, 999))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void alunoNaoPodeAcessarAreaDoOrientador() {
        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);

        assertThatThrownBy(() -> orientadorService.dashboard())
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> orientadorService.orientandos(null, null, null))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> orientadorService.detalheOrientando(1, null))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void adminPodeAuditarDashboard() {
        Usuario admin = TestDataFactory.usuarioAdmin(8);
        when(authHelper.getCurrentUser()).thenReturn(admin);
        when(projetoRepository.findAll()).thenReturn(List.of(projetoAberto, projetoAndamento));
        when(inscricaoRepository.findAll()).thenReturn(List.of(inscricaoAprovadaAberto, inscricaoAprovadaAndamento));
        when(etapaProgressoRepository.findAll()).thenReturn(List.of());
        when(projectDeliveryRepository.findAll()).thenReturn(List.of());
        when(academicEvaluationRepository.findAll()).thenReturn(List.of());

        OrientadorDashboardResponse response = orientadorService.dashboard();

        assertThat(response.getMetricas().getProjetosAtivos()).isEqualTo(2);
    }

    @Test
    void inscricoesDevemFiltrarPorStatus() {
        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(inscricaoRepository.findByProjetoOrientadorUsuarioId(2))
                .thenReturn(List.of(inscricaoAprovadaAberto, inscricaoAprovadaAndamento));

        List<InscricaoResponse> resposta = orientadorService.inscricoes("PENDENTE", null);

        assertThat(resposta).isEmpty();
    }

    @Test
    void inscricoesDeveRejeitarStatusInvalido() {
        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);

        assertThatThrownBy(() -> orientadorService.inscricoes("INVALIDO", null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void perfilDeveRetornarContadores() {
        autenticarOrientador();
        when(usuarioRepository.findById(2)).thenReturn(Optional.of(orientadorUsuario));
        when(orientadorRepository.findByUsuarioId(2)).thenReturn(Optional.of(TestDataFactory.orientador(2, orientadorUsuario)));
        when(projetoRepository.findByOrientadorUsuarioId(2))
                .thenReturn(List.of(projetoAberto, projetoAndamento));
        when(inscricaoRepository.findByProjetoOrientadorUsuarioId(2))
                .thenReturn(List.of(inscricaoAprovadaAberto, inscricaoAprovadaAndamento));
        when(academicEvaluationRepository.findByProjetoOrientadorUsuarioId(2))
                .thenReturn(List.of(AcademicEvaluation.builder().id(1L).build(),
                        AcademicEvaluation.builder().id(2L).build()));

        OrientadorPerfilResponse perfil = orientadorService.perfil();

        assertThat(perfil.getNome()).isEqualTo("Orientador Teste");
        assertThat(perfil.getDepartamento()).isEqualTo("Computacao");
        assertThat(perfil.getProjetos()).isEqualTo(2);
        assertThat(perfil.getOrientandos()).isEqualTo(1);
        assertThat(perfil.getAvaliacoes()).isEqualTo(2);
    }

    @Test
    void atualizarPerfilDeveDelegarParaUsuarioService() {
        autenticarOrientador();
        when(usuarioRepository.findById(2)).thenReturn(Optional.of(orientadorUsuario));
        when(orientadorRepository.findByUsuarioId(2)).thenReturn(Optional.of(TestDataFactory.orientador(2, orientadorUsuario)));
        when(projetoRepository.findByOrientadorUsuarioId(2)).thenReturn(List.of(projetoAberto));
        when(inscricaoRepository.findByProjetoOrientadorUsuarioId(2)).thenReturn(List.of());
        when(academicEvaluationRepository.findByProjetoOrientadorUsuarioId(2)).thenReturn(List.of());
        when(usuarioService.update(any(), any())).thenReturn(orientadorUsuario);

        OrientadorPerfilRequest request = OrientadorPerfilRequest.builder()
                .nome("Novo Nome")
                .email("novo@teste.com")
                .departamento("Matematica")
                .titulacao("Doutor")
                .build();

        OrientadorPerfilResponse perfil = orientadorService.atualizarPerfil(request);

        assertThat(perfil.getNome()).isEqualTo("Orientador Teste");
        verify(usuarioService).update(eq(2), any(UsuarioRequest.class));
    }

    @Test
    void atualizarPerfilDeveRejeitarNomeEmBranco() {
        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);

        assertThatThrownBy(() -> orientadorService.atualizarPerfil(OrientadorPerfilRequest.builder()
                .nome("   ")
                .email("novo@teste.com")
                .build()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }
}
