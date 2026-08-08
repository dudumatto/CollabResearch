package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.AvaliacaoAcademicaRequest;
import com.example.tcc_backend.dto.request.AvaliacaoCienciaRequest;
import com.example.tcc_backend.dto.response.AvaliacaoAcademicaResponse;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.*;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvaliacaoAcademicaServiceTest {

    @Mock
    private AuthHelper authHelper;
    @Mock
    private ProjetoRepository projetoRepository;
    @Mock
    private EtapaProgressoRepository etapaProgressoRepository;
    @Mock
    private AlunoRepository alunoRepository;
    @Mock
    private AcademicEvaluationRepository academicEvaluationRepository;
    @Mock
    private AcademicEvaluationAcknowledgementRepository acknowledgementRepository;
    @Mock
    private ProjectAccessPolicy projectAccessPolicy;

    private AvaliacaoAcademicaService service;

    private Usuario orientadorUsuario;
    private Usuario alunoUsuario;
    private Aluno aluno;
    private Projeto projeto;
    private EtapaProgresso etapaConcluida;

    @BeforeEach
    void setUp() {
        service = new AvaliacaoAcademicaService(
                authHelper, projetoRepository, etapaProgressoRepository, alunoRepository,
                academicEvaluationRepository, acknowledgementRepository, projectAccessPolicy);

        orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        alunoUsuario = TestDataFactory.usuarioAluno(1);
        aluno = TestDataFactory.aluno(1, alunoUsuario);
        Orientador orientador = TestDataFactory.orientador(2, orientadorUsuario);
        projeto = TestDataFactory.projetoComOrientador(10, orientador);
        etapaConcluida = EtapaProgresso.builder()
                .id(30).projeto(projeto).titulo("Desenvolvimento").peso(40).ordem(4)
                .status(EtapaProgressoStatus.DONE)
                .responsavel(EtapaResponsavel.ALUNO)
                .build();
    }

    private AvaliacaoAcademicaRequest request() {
        return AvaliacaoAcademicaRequest.builder()
                .alunoId(1)
                .etapaId(30)
                .participacao(5)
                .qualidadeTecnica(4)
                .cumprimentoDePrazos(3)
                .comunicacao(4)
                .comentarioOrientador("Bom trabalho")
                .build();
    }

    private void autenticarOrientador() {
        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
    }

    @Test
    void criarDeveValidarVinculoDoAluno() {
        autenticarOrientador();
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 30)).thenReturn(Optional.of(etapaConcluida));
        when(alunoRepository.findById(1)).thenReturn(Optional.of(aluno));
        when(projectAccessPolicy.relationship(projeto, alunoUsuario)).thenReturn(ProjectAccessPolicy.Relationship.EXTERNAL);

        assertThatThrownBy(() -> service.criar(10, request()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void criarDeveRecusarEtapaNaoConcluida() {
        autenticarOrientador();
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        EtapaProgresso pendente = EtapaProgresso.builder()
                .id(30).projeto(projeto).titulo("Em andamento").peso(40).ordem(4)
                .status(EtapaProgressoStatus.PENDING).build();
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 30)).thenReturn(Optional.of(pendente));

        assertThatThrownBy(() -> service.criar(10, request()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void criarDeveCalcularMediaESalvar() {
        autenticarOrientador();
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 30)).thenReturn(Optional.of(etapaConcluida));
        when(alunoRepository.findById(1)).thenReturn(Optional.of(aluno));
        when(projectAccessPolicy.relationship(projeto, alunoUsuario))
                .thenReturn(ProjectAccessPolicy.Relationship.APPROVED_MEMBER);
        when(academicEvaluationRepository.findByProjetoIdAndEtapaIdAndAlunoId(10, 30, 1)).thenReturn(Optional.empty());

        AcademicEvaluation salva = AcademicEvaluation.builder()
                .id(50L).projeto(projeto).etapa(etapaConcluida).aluno(aluno)
                .orientador(projeto.getOrientador())
                .participacao(5).qualidadeTecnica(4).cumprimentoDePrazos(3).comunicacao(4)
                .comentarioOrientador("Bom trabalho")
                .media(BigDecimal.valueOf(4.00))
                .criadaEm(OffsetDateTime.now()).atualizadaEm(OffsetDateTime.now())
                .build();
        when(academicEvaluationRepository.save(any(AcademicEvaluation.class))).thenReturn(salva);

        AvaliacaoAcademicaResponse resposta = service.criar(10, request());

        assertThat(resposta.getMedia()).isEqualByComparingTo("4.00");
        assertThat(resposta.getAlunoId()).isEqualTo(1);
        assertThat(resposta.getEtapaId()).isEqualTo(30);
        assertThat(resposta.getOrientadorId()).isEqualTo(2);

        ArgumentCaptor<AcademicEvaluation> captor = ArgumentCaptor.forClass(AcademicEvaluation.class);
        verify(academicEvaluationRepository).save(captor.capture());
        assertThat(captor.getValue().getMedia()).isEqualByComparingTo("4.00");
    }

    @Test
    void criarDeveBloquearDuplicidade() {
        autenticarOrientador();
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 30)).thenReturn(Optional.of(etapaConcluida));
        when(alunoRepository.findById(1)).thenReturn(Optional.of(aluno));
        when(projectAccessPolicy.relationship(projeto, alunoUsuario))
                .thenReturn(ProjectAccessPolicy.Relationship.APPROVED_MEMBER);
        when(academicEvaluationRepository.findByProjetoIdAndEtapaIdAndAlunoId(10, 30, 1))
                .thenReturn(Optional.of(AcademicEvaluation.builder().id(99L).build()));

        assertThatThrownBy(() -> service.criar(10, request()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void criarDeveExigirComentario() {
        autenticarOrientador();
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

        AvaliacaoAcademicaRequest semComentario = request();
        semComentario.setComentarioOrientador("   ");

        assertThatThrownBy(() -> service.criar(10, semComentario))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void atualizarDeveBloquearQuandoCienciaJaRegistrada() {
        autenticarOrientador();
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        AcademicEvaluation avaliacao = AcademicEvaluation.builder()
                .id(50L).projeto(projeto).etapa(etapaConcluida).aluno(aluno).build();
        when(academicEvaluationRepository.findByIdAndProjetoId(50L, 10)).thenReturn(Optional.of(avaliacao));
        when(acknowledgementRepository.existsByAvaliacaoId(50L)).thenReturn(true);

        assertThatThrownBy(() -> service.atualizar(10, 50L, request()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void registrarCienciaDeveSalvarUmaVez() {
        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        AcademicEvaluation avaliacao = AcademicEvaluation.builder()
                .id(50L).projeto(projeto).etapa(etapaConcluida).aluno(aluno)
                .orientador(projeto.getOrientador())
                .participacao(5).qualidadeTecnica(4).cumprimentoDePrazos(3).comunicacao(4)
                .comentarioOrientador("Bom trabalho")
                .media(BigDecimal.valueOf(4.00)).build();
        when(academicEvaluationRepository.findByIdAndProjetoId(50L, 10)).thenReturn(Optional.of(avaliacao));
        when(acknowledgementRepository.existsByAvaliacaoId(50L)).thenReturn(false);

        AcademicEvaluationAcknowledgement ciencia = AcademicEvaluationAcknowledgement.builder()
                .id(70L).avaliacao(avaliacao).aluno(alunoUsuario)
                .comentarioAluno("Obrigado, professor")
                .dataCiencia(OffsetDateTime.now()).build();
        when(acknowledgementRepository.save(any(AcademicEvaluationAcknowledgement.class))).thenReturn(ciencia);

        AvaliacaoAcademicaResponse resposta = service.registrarCiencia(10, 50L,
                AvaliacaoCienciaRequest.builder().comentarioAluno("Obrigado, professor").build());

        assertThat(resposta.isCienciaRegistrada()).isTrue();
        assertThat(resposta.getComentarioAluno()).isEqualTo("Obrigado, professor");

        ArgumentCaptor<AcademicEvaluationAcknowledgement> captor =
                ArgumentCaptor.forClass(AcademicEvaluationAcknowledgement.class);
        verify(acknowledgementRepository).save(captor.capture());
        assertThat(captor.getValue().getAluno().getId()).isEqualTo(alunoUsuario.getId());
    }

    @Test
    void registrarCienciaDuplicadaDeveFalhar() {
        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        AcademicEvaluation avaliacao = AcademicEvaluation.builder()
                .id(50L).projeto(projeto).etapa(etapaConcluida).aluno(aluno).build();
        when(academicEvaluationRepository.findByIdAndProjetoId(50L, 10)).thenReturn(Optional.of(avaliacao));
        when(acknowledgementRepository.existsByAvaliacaoId(50L)).thenReturn(true);

        assertThatThrownBy(() -> service.registrarCiencia(10, 50L, null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void alunoDeOutroProjetoNaoPodeVerAvaliacao() {
        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        AcademicEvaluation avaliacao = AcademicEvaluation.builder()
                .id(50L).projeto(projeto).etapa(etapaConcluida).aluno(aluno).build();
        when(academicEvaluationRepository.findByIdAndProjetoId(50L, 10)).thenReturn(Optional.of(avaliacao));
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao"))
                .when(projectAccessPolicy)
                .requireCanViewEvaluation(projeto, alunoUsuario, 1);

        assertThatThrownBy(() -> service.obter(10, 50L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.FORBIDDEN));
    }
}
