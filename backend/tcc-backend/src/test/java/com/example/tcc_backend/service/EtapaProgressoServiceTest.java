package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.AdvanceProgressStepRequest;
import com.example.tcc_backend.dto.request.CreateProjectProgressUpdateRequest;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.EtapaProgressoRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProgressoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EtapaProgressoServiceTest {

    @Mock
    private EtapaProgressoRepository etapaProgressoRepository;
    @Mock
    private ProgressoRepository progressoRepository;
    @Mock
    private ProjetoRepository projetoRepository;
    @Mock
    private InscricaoRepository inscricaoRepository;
    @Mock
    private AuthHelper authHelper;

    @InjectMocks
    private EtapaProgressoService etapaProgressoService;

    @Test
    void obterResumoDeveRetornarEtapasEAtualizacoes() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapaAtiva = TestDataFactory.etapaProgresso(1, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);
        EtapaProgresso etapaConcluida = TestDataFactory.etapaProgresso(2, projeto, alunoUsuario, 2, 15, EtapaProgressoStatus.DONE);
        Progresso progresso = TestDataFactory.progressoComEtapa(3, projeto, alunoUsuario, etapaConcluida);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of(etapaAtiva, etapaConcluida));
        when(progressoRepository.findByProjetoIdOrderByDataRegistroDesc(10)).thenReturn(List.of(progresso));

        var resumo = etapaProgressoService.obterResumo(10);

        assertThat(resumo.getProjectId()).isEqualTo(10);
        assertThat(resumo.getOverallPercent()).isEqualTo(15);
        assertThat(resumo.getSteps()).hasSize(2);
        assertThat(resumo.getUpdates()).hasSize(1);
    }

    @Test
    void avancarEtapaDeveNegarAlunoEmEtapaDoOrientador() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(1, projeto, null, 1, 10, EtapaProgressoStatus.ACTIVE);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdOrderByOrdemAsc(10)).thenReturn(List.of(etapa));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 1)).thenReturn(Optional.of(etapa));

        AdvanceProgressStepRequest request = new AdvanceProgressStepRequest();
        request.setStatus("done");

        assertThatThrownBy(() -> etapaProgressoService.avancarEtapa(10, 1, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void criarAtualizacaoDeveSalvarCategoriaEtapaEContribuicao() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
        EtapaProgresso etapa = TestDataFactory.etapaProgresso(2, projeto, null, 2, 15, EtapaProgressoStatus.ACTIVE);

        CreateProjectProgressUpdateRequest request = new CreateProjectProgressUpdateRequest();
        request.setTitulo("Capitulo 2");
        request.setDescricao("Texto");
        request.setCategoria("milestone");
        request.setEtapaId(2);
        request.setEtapaContribuicao(60);

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        when(etapaProgressoRepository.findByProjetoIdAndId(10, 2)).thenReturn(Optional.of(etapa));
        when(progressoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = etapaProgressoService.criarAtualizacao(10, request);

        assertThat(response.getCategory()).isEqualTo("milestone");
        assertThat(response.getStepContribution()).isEqualTo(60);
        verify(progressoRepository).save(any());
    }
}
