package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.DeliveryReviewRequest;
import com.example.tcc_backend.dto.request.EntregaRequest;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.DeliveryReviewRepository;
import com.example.tcc_backend.repository.DeliveryVersionRepository;
import com.example.tcc_backend.repository.EtapaProgressoRepository;
import com.example.tcc_backend.repository.ProjectDeliveryRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EntregaServiceTest {

    @Mock
    private ProjectDeliveryRepository projectDeliveryRepository;
    @Mock
    private DeliveryVersionRepository deliveryVersionRepository;
    @Mock
    private DeliveryReviewRepository deliveryReviewRepository;
    @Mock
    private ProjetoRepository projetoRepository;
    @Mock
    private EtapaProgressoRepository etapaProgressoRepository;
    @Mock
    private AuthHelper authHelper;
    @Mock
    private ProjectAccessPolicy projectAccessPolicy;
    @Mock
    private SupabaseStorageService supabaseStorageService;

    @InjectMocks
    private EntregaService entregaService;

    private Projeto projetoComAluno() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        return TestDataFactory.projetoComAlunoCriador(10, TestDataFactory.aluno(1, alunoUsuario));
    }

    private Projeto projetoComOrientador() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        return TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(1, orientadorUsuario));
    }

    private MockMultipartFile arquivoPdf() {
        return new MockMultipartFile(
                "arquivo", "relatorio.pdf", "application/pdf", new byte[]{'%', 'P', 'D', 'F', '-', '1', '2', '3'});
    }

    private EntregaRequest request() {
        EntregaRequest request = new EntregaRequest();
        request.setTitulo("Relatorio parcial");
        request.setCategoria("relatorio");
        return request;
    }

    private ProjectDelivery entrega(Projeto projeto, Usuario autor, EntregaStatus status) {
        return ProjectDelivery.builder()
                .id(1L)
                .projeto(projeto)
                .autor(autor)
                .titulo("Relatorio parcial")
                .categoria("relatorio")
                .status(status)
                .build();
    }

    @Test
    void criarDeveSalvarEntregaEVersaoInicial() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = projetoComAluno();
        ProjectDelivery entrega = entrega(projeto, alunoUsuario, EntregaStatus.PENDING_REVIEW);
        DeliveryVersion versao = DeliveryVersion.builder()
                .id(5L)
                .entrega(entrega)
                .numeroVersao(1)
                .nomeArquivo("relatorio.pdf")
                .build();

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        doNothing().when(projectAccessPolicy).requireTeamMember(projeto, alunoUsuario);
        when(projectDeliveryRepository.save(any())).thenReturn(entrega);
        when(deliveryVersionRepository.save(any())).thenReturn(versao);
        when(deliveryVersionRepository.findFirstByEntregaIdOrderByNumeroVersaoDesc(1L))
                .thenReturn(Optional.of(versao));
        when(deliveryVersionRepository.findByEntregaIdOrderByNumeroVersaoAsc(1L)).thenReturn(List.of(versao));
        when(supabaseStorageService.isConfigured()).thenReturn(false);

        var response = entregaService.criar(10, request(), arquivoPdf());

        assertThat(response.getStatus()).isEqualTo(EntregaStatus.PENDING_REVIEW);
        assertThat(response.getTotalVersoes()).isEqualTo(1);
        assertThat(response.getUltimaVersaoId()).isEqualTo(5L);
        verify(projectDeliveryRepository).save(any());
        verify(deliveryVersionRepository).save(any());
    }

    @Test
    void criarDeveNegarUsuarioExterno() {
        Usuario externo = TestDataFactory.usuarioAluno(9);
        Projeto projeto = projetoComAluno();

        when(authHelper.getCurrentUser()).thenReturn(externo);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario nao participa do projeto"))
                .when(projectAccessPolicy).requireTeamMember(projeto, externo);

        assertThatThrownBy(() -> entregaService.criar(10, request(), arquivoPdf()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void criarDeveRejeitarTipoDeArquivoNaoPermitido() {
        Usuario alunoUsuario = TestDataFactory.usuarioAluno(1);
        Projeto projeto = projetoComAluno();

        when(authHelper.getCurrentUser()).thenReturn(alunoUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        doNothing().when(projectAccessPolicy).requireTeamMember(projeto, alunoUsuario);

        MockMultipartFile executavel = new MockMultipartFile(
                "arquivo", "virus.exe", "application/octet-stream", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> entregaService.criar(10, request(), executavel))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void reenviarDeveNegarQuemNaoEhAutor() {
        Usuario autor = TestDataFactory.usuarioAluno(1);
        Usuario outroAluno = TestDataFactory.usuarioAluno(3);
        Projeto projeto = projetoComAluno();
        ProjectDelivery entrega = entrega(projeto, autor, EntregaStatus.CHANGES_REQUESTED);

        when(authHelper.getCurrentUser()).thenReturn(outroAluno);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        doNothing().when(projectAccessPolicy).requireTeamMember(projeto, outroAluno);
        when(projectDeliveryRepository.findById(1L)).thenReturn(Optional.of(entrega));

        assertThatThrownBy(() -> entregaService.reenviar(10, 1L, arquivoPdf()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
        verify(deliveryVersionRepository, never()).save(any());
    }

    @Test
    void revisarComAjustesSemComentarioDeveFalhar() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = projetoComOrientador();
        ProjectDelivery entrega = entrega(projeto, TestDataFactory.usuarioAluno(1), EntregaStatus.PENDING_REVIEW);
        DeliveryVersion versao = DeliveryVersion.builder()
                .id(5L)
                .entrega(entrega)
                .numeroVersao(1)
                .build();

        DeliveryReviewRequest request = new DeliveryReviewRequest();
        request.setDecisao(EntregaDecisao.CHANGES_REQUESTED);
        request.setComentario("   ");

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        doNothing().when(projectAccessPolicy).requireResponsibleAdvisor(projeto, orientadorUsuario);
        when(projectDeliveryRepository.findById(1L)).thenReturn(Optional.of(entrega));
        when(deliveryVersionRepository.findById(5L)).thenReturn(Optional.of(versao));
        when(deliveryVersionRepository.findFirstByEntregaIdOrderByNumeroVersaoDesc(1L))
                .thenReturn(Optional.of(versao));

        assertThatThrownBy(() -> entregaService.revisar(10, 1L, 5L, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(deliveryReviewRepository, never()).save(any());
    }

    @Test
    void revisarDeveAprovarEAtualizarStatusDaEntrega() {
        Usuario orientadorUsuario = TestDataFactory.usuarioOrientador(2);
        Projeto projeto = projetoComOrientador();
        ProjectDelivery entrega = entrega(projeto, TestDataFactory.usuarioAluno(1), EntregaStatus.PENDING_REVIEW);
        DeliveryVersion versao = DeliveryVersion.builder()
                .id(5L)
                .entrega(entrega)
                .numeroVersao(1)
                .build();
        DeliveryReview revisao = DeliveryReview.builder()
                .id(9L)
                .versao(versao)
                .revisor(orientadorUsuario)
                .decisao(EntregaDecisao.APPROVED)
                .build();

        DeliveryReviewRequest request = new DeliveryReviewRequest();
        request.setDecisao(EntregaDecisao.APPROVED);

        when(authHelper.getCurrentUser()).thenReturn(orientadorUsuario);
        when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
        doNothing().when(projectAccessPolicy).requireResponsibleAdvisor(projeto, orientadorUsuario);
        when(projectDeliveryRepository.findById(1L)).thenReturn(Optional.of(entrega));
        when(deliveryVersionRepository.findById(5L)).thenReturn(Optional.of(versao));
        when(deliveryVersionRepository.findFirstByEntregaIdOrderByNumeroVersaoDesc(1L))
                .thenReturn(Optional.of(versao));
        when(deliveryReviewRepository.findByVersaoId(5L)).thenReturn(Optional.empty());
        when(deliveryReviewRepository.save(any())).thenReturn(revisao);

        var response = entregaService.revisar(10, 1L, 5L, request);

        assertThat(response.getDecisao()).isEqualTo(EntregaDecisao.APPROVED);
        assertThat(entrega.getStatus()).isEqualTo(EntregaStatus.APPROVED);
        verify(projectDeliveryRepository).save(entrega);
    }
}
