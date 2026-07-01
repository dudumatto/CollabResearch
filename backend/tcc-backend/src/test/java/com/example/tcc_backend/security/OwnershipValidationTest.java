package com.example.tcc_backend.security;

import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.*;
import com.example.tcc_backend.service.*;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OwnershipValidationTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private AlunoRepository alunoRepository;
    @Mock private OrientadorRepository orientadorRepository;
    @Mock private CursoRepository cursoRepository;
    @Mock private ProjetoRepository projetoRepository;
    @Mock private InscricaoRepository inscricaoRepository;
    @Mock private ConversaRepository conversaRepository;
    @Mock private MensagemRepository mensagemRepository;
    @Mock private DocumentoRepository documentoRepository;
    @Mock private NotificacaoRepository notificacaoRepository;
    @Mock private ProgressoRepository progressoRepository;
    @Mock private AuthHelper authHelper;
    @Mock private AreaPesquisaRepository areaPesquisaRepository;
    @Mock private EtapaProgressoService etapaProgressoService;
    @Mock private ChatRealtimeService chatRealtimeService;

    private NotificacaoService notificacaoService;
    private UsuarioService usuarioService;
    private ConversaService conversaService;
    private DocumentoService documentoService;
    private InscricaoService inscricaoService;
    private ProjetoService projetoService;
    private ProgressoService progressoService;

    @BeforeEach
    void setUp() {
        notificacaoService = new NotificacaoService(notificacaoRepository, usuarioRepository, authHelper);
        usuarioService = new UsuarioService(
                usuarioRepository, alunoRepository, orientadorRepository,
                cursoRepository, projetoRepository, inscricaoRepository, authHelper);
        inscricaoService = new InscricaoService(
                inscricaoRepository, alunoRepository, projetoRepository,
                authHelper, notificacaoService);
        documentoService = new DocumentoService(
                documentoRepository, usuarioRepository, authHelper);
        projetoService = new ProjetoService(
                projetoRepository, orientadorRepository, alunoRepository,
                inscricaoRepository, areaPesquisaRepository,
                usuarioRepository, authHelper, notificacaoService,
                etapaProgressoService);
        progressoService = new ProgressoService(
                progressoRepository, projetoRepository, inscricaoRepository,
                authHelper, notificacaoService);
        conversaService = new ConversaService(
                conversaRepository, mensagemRepository, projetoRepository,
                inscricaoRepository, usuarioRepository, authHelper,
                notificacaoService, chatRealtimeService);
    }

    // ── UsuarioController ──────────────────────────────────────────

    @Nested
    class UsuarioUpdate {

        @Test
        void devePermitirAtualizarProprioPerfil() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);
            when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioA));
            when(alunoRepository.findByUsuarioId(1)).thenReturn(Optional.of(TestDataFactory.aluno(1, usuarioA)));

            var dto = new com.example.tcc_backend.dto.request.UsuarioRequest();
            dto.setNome("Atualizado");
            dto.setEmail("a@teste.com");

            Usuario atualizado = usuarioService.update(1, dto);
            assertThat(atualizado.getNome()).isEqualTo("Atualizado");
        }

        @Test
        void deveBloquearAtualizarOutroUsuario() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            Usuario usuarioB = TestDataFactory.usuarioAluno(2);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            var dto = new com.example.tcc_backend.dto.request.UsuarioRequest();
            dto.setNome("Hack");
            dto.setEmail("b@teste.com");

            assertThatThrownBy(() -> usuarioService.update(2, dto))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    @Nested
    class UsuarioDelete {

        @Test
        void devePermitirDeletarProprioPerfil() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);
            when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioA));

            usuarioService.delete(1);
            assertThat(usuarioA.getAtivo()).isFalse();
        }

        @Test
        void deveBloquearDeletarOutroUsuario() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            assertThatThrownBy(() -> usuarioService.delete(2))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    @Nested
    class UsuarioInscricoes {

        @Test
        void devePermitirListarPropriasInscricoes() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);
            when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioA));

            var result = usuarioService.findInscricoesByUsuario(1);
            assertThat(result).isNotNull();
        }

        @Test
        void deveBloquearListarInscricoesDeOutroAluno() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            Usuario usuarioB = TestDataFactory.usuarioAluno(2);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);
            when(usuarioRepository.findById(2)).thenReturn(Optional.of(usuarioB));

            assertThatThrownBy(() -> usuarioService.findInscricoesByUsuario(2))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }

        @Test
        void devePermitirOrientadorListarInscricoes() {
            Usuario orientador = TestDataFactory.usuarioOrientador(10);
            Usuario aluno = TestDataFactory.usuarioAluno(2);
            when(authHelper.getCurrentUser()).thenReturn(orientador);
            when(usuarioRepository.findById(2)).thenReturn(Optional.of(aluno));
            when(inscricaoRepository.findByAlunoUsuarioId(2)).thenReturn(java.util.List.of());

            var result = usuarioService.findInscricoesByUsuario(2);
            assertThat(result).isNotNull();
        }
    }

    // ── ConversaController ─────────────────────────────────────────

    @Nested
    class ConversaListar {

        @Test
        void devePermitirListarPropriasConversas() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            when(projetoRepository.findByOrientadorUsuarioIdOrAlunoCriadorUsuarioId(1, 1))
                    .thenReturn(java.util.List.of());
            when(inscricaoRepository.findByAlunoUsuarioIdAndStatus(1, StatusInscricao.APROVADO))
                    .thenReturn(java.util.List.of());
            when(conversaRepository.findByProjetoIdIn(java.util.List.of()))
                    .thenReturn(java.util.List.of());

            var result = conversaService.listarConversasDoUsuario(1);
            assertThat(result).isNotNull();
        }

        @Test
        void deveBloquearListarConversasDeOutroUsuario() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            assertThatThrownBy(() -> conversaService.listarConversasDoUsuario(2))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    @Nested
    class ConversaMensagens {

        @Test
        void deveBloquearAcessarMensagensSemParticipacao() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Projeto projetoB = TestDataFactory.projetoComOrientador(10,
                    TestDataFactory.orientador(99, TestDataFactory.usuarioOrientador(99)));
            Conversa conversa = TestDataFactory.conversa(5, projetoB);
            when(conversaRepository.findById(5)).thenReturn(Optional.of(conversa));

            assertThatThrownBy(() -> conversaService.listarMensagens(5))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }

        @Test
        void devePermitirListarMensagensParticipante() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Orientador orientador = TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2));
            Aluno aluno = TestDataFactory.aluno(1, usuarioA);
            Projeto projeto = Projeto.builder()
                    .id(10).titulo("P").orientador(orientador).alunoCriador(aluno)
                    .status(StatusProjeto.ABERTO).build();
            Conversa conversa = TestDataFactory.conversa(5, projeto);
            when(conversaRepository.findById(5)).thenReturn(Optional.of(conversa));
            when(mensagemRepository.findByConversaIdOrderByDataEnvioAsc(5))
                    .thenReturn(java.util.List.of());

            var result = conversaService.listarMensagens(5);
            assertThat(result).isNotNull();
        }
    }

    @Nested
    class ConversaEditarMensagem {

        @Test
        void deveBloquearEditarMensagemDeOutro() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Usuario remetente = TestDataFactory.usuarioAluno(99);
            Conversa conversa = TestDataFactory.conversa(5,
                    TestDataFactory.projetoComOrientador(10,
                            TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2))));
            Mensagem msg = TestDataFactory.mensagem(1, conversa, remetente);

            when(mensagemRepository.findById(1)).thenReturn(Optional.of(msg));
            when(conversaRepository.findById(5)).thenReturn(Optional.of(conversa));
            when(inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(10, 1))
                    .thenReturn(java.util.Optional.empty());

            assertThatThrownBy(() -> conversaService.editarMensagem(1, "novo"))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    @Nested
    class ConversaExcluirMensagem {

        @Test
        void deveBloquearExcluirMensagemDeOutro() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Usuario remetente = TestDataFactory.usuarioAluno(99);
            Conversa conversa = TestDataFactory.conversa(5,
                    TestDataFactory.projetoComOrientador(10,
                            TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2))));
            Mensagem msg = TestDataFactory.mensagem(1, conversa, remetente);

            when(mensagemRepository.findById(1)).thenReturn(Optional.of(msg));
            when(conversaRepository.findById(5)).thenReturn(Optional.of(conversa));
            when(inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(10, 1))
                    .thenReturn(java.util.Optional.empty());

            assertThatThrownBy(() -> conversaService.excluirMensagem(1))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    // ── DocumentoController ────────────────────────────────────────

    @Nested
    class DocumentoAcesso {

        @Test
        void devePermitirDonoAcessarDocumento() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Documento doc = TestDataFactory.documento(10, usuarioA, "https://supabase.co/doc.pdf");
            doc.setTipo(TipoDocumento.CURRICULO);
            when(documentoRepository.findById(10)).thenReturn(Optional.of(doc));

            var result = documentoService.obterDocumento(10);
            assertThat(result).isNotNull();
        }

        @Test
        void deveBloquearNaoDonoAcessarDocumentoNaoPublico() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            Usuario usuarioB = TestDataFactory.usuarioAluno(2);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Documento doc = TestDataFactory.documento(10, usuarioB, "https://supabase.co/doc.pdf");
            doc.setTipo(TipoDocumento.HISTORICO);
            when(documentoRepository.findById(10)).thenReturn(Optional.of(doc));

            assertThatThrownBy(() -> documentoService.obterDocumento(10))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }

        @Test
        void devePermitirQualquerUsuarioAcessarCurriculoDeOutro() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            Usuario usuarioB = TestDataFactory.usuarioAluno(2);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Documento doc = TestDataFactory.documento(10, usuarioB, "https://supabase.co/doc.pdf");
            doc.setTipo(TipoDocumento.CURRICULO);
            when(documentoRepository.findById(10)).thenReturn(Optional.of(doc));

            var result = documentoService.obterDocumento(10);
            assertThat(result).isNotNull();
        }

        @Test
        void devePermitirAdminAcessarDocumentoDeOutro() {
            Usuario admin = TestDataFactory.usuarioAdmin(1);
            when(authHelper.getCurrentUser()).thenReturn(admin);

            Usuario usuarioB = TestDataFactory.usuarioAluno(2);
            Documento doc = TestDataFactory.documento(10, usuarioB, "https://supabase.co/doc.pdf");
            doc.setTipo(TipoDocumento.CURRICULO);
            when(documentoRepository.findById(10)).thenReturn(Optional.of(doc));

            var result = documentoService.obterDocumento(10);
            assertThat(result).isNotNull();
        }
    }

    @Nested
    class DocumentoUpload {

        @Test
        void deveBloquearUploadParaOutroUsuario() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            assertThatThrownBy(() -> documentoService.upload(2, TipoDocumento.CURRICULO, "arq.pdf", "https://supabase.co/storage/doc.pdf"))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    @Nested
    class DocumentoRemover {

        @Test
        void deveBloquearRemoverDocumentoDeOutro() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Usuario usuarioB = TestDataFactory.usuarioAluno(2);
            Documento doc = TestDataFactory.documento(10, usuarioB, "https://supabase.co/doc.pdf");
            doc.setTipo(TipoDocumento.CURRICULO);
            when(documentoRepository.findById(10)).thenReturn(Optional.of(doc));

            assertThatThrownBy(() -> documentoService.remover(10))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    // ── InscricaoController ────────────────────────────────────────

    @Nested
    class InscricaoAprovar {

        @Test
        void deveBloquearAlunoAprovarInscricao() {
            Usuario aluno = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(aluno);

            Orientador orientador = TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2));
            Aluno alunoDono = TestDataFactory.aluno(99, TestDataFactory.usuarioAluno(99));
            Projeto projeto = TestDataFactory.projetoComOrientador(10, orientador);
            Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, alunoDono, projeto);
            when(inscricaoRepository.findById(5)).thenReturn(Optional.of(inscricao));

            assertThatThrownBy(() -> inscricaoService.aprovar(5))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }

        @Test
        void deveBloquearOrientadorDeOutroProjetoAprovar() {
            Usuario orientadorA = TestDataFactory.usuarioOrientador(10);
            when(authHelper.getCurrentUser()).thenReturn(orientadorA);

            Orientador orientadorB = TestDataFactory.orientador(20, TestDataFactory.usuarioOrientador(20));
            Aluno aluno = TestDataFactory.aluno(99, TestDataFactory.usuarioAluno(99));
            Projeto projeto = TestDataFactory.projetoComOrientador(10, orientadorB);
            Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, aluno, projeto);
            when(inscricaoRepository.findById(5)).thenReturn(Optional.of(inscricao));

            assertThatThrownBy(() -> inscricaoService.aprovar(5))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    @Nested
    class InscricaoRejeitar {

        @Test
        void deveBloquearAlunoRejeitarInscricao() {
            Usuario aluno = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(aluno);

            Orientador orientador = TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2));
            Aluno alunoDono = TestDataFactory.aluno(99, TestDataFactory.usuarioAluno(99));
            Projeto projeto = TestDataFactory.projetoComOrientador(10, orientador);
            Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, alunoDono, projeto);
            when(inscricaoRepository.findById(5)).thenReturn(Optional.of(inscricao));

            assertThatThrownBy(() -> inscricaoService.rejeitar(5))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    @Nested
    class InscricaoCancelar {

        @Test
        void devePermitirAlunoCancelarPropriaInscricao() {
            Usuario aluno = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(aluno);

            Aluno alunoDono = TestDataFactory.aluno(1, aluno);
            Projeto projeto = TestDataFactory.projetoComOrientador(10,
                    TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
            Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, alunoDono, projeto);
            when(inscricaoRepository.findById(5)).thenReturn(Optional.of(inscricao));

            inscricaoService.cancel(5);
            verify(inscricaoRepository).delete(inscricao);
        }

        @Test
        void deveBloquearCancelarInscricaoDeOutro() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Aluno outroAluno = TestDataFactory.aluno(99, TestDataFactory.usuarioAluno(99));
            Projeto projeto = TestDataFactory.projetoComOrientador(10,
                    TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)));
            Inscricao inscricao = TestDataFactory.inscricaoAprovada(5, outroAluno, projeto);
            when(inscricaoRepository.findById(5)).thenReturn(Optional.of(inscricao));

            assertThatThrownBy(() -> inscricaoService.cancel(5))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    // ── ProjetoController ──────────────────────────────────────────

    @Nested
    class ProjetoUpdate {

        @Test
        void devePermitirOrientadorAtualizarProjeto() {
            Usuario orientador = TestDataFactory.usuarioOrientador(2);
            when(authHelper.getCurrentUser()).thenReturn(orientador);

            Orientador ori = TestDataFactory.orientador(2, orientador);
            Projeto projeto = Projeto.builder()
                    .id(10).titulo("P").orientador(ori).status(StatusProjeto.ABERTO).build();
            when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
            when(projetoRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(areaPesquisaRepository.findById(any())).thenReturn(Optional.of(
                    com.example.tcc_backend.model.AreaPesquisa.builder().id(1).nome("IA").build()));

            var dto = new com.example.tcc_backend.dto.request.ProjetoRequest();
            dto.setTitulo("Atualizado");
            dto.setDescricao("Desc");
            dto.setRequisitos("Req");
            dto.setVagas(1);
            dto.setAreaId(1);

            var result = projetoService.update(10, dto);
            assertThat(result.getTitulo()).isEqualTo("Atualizado");
        }

        @Test
        void deveBloquearAtualizarProjetoDeOutro() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Orientador orientador = TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2));
            Projeto projeto = Projeto.builder()
                    .id(10).titulo("P").orientador(orientador).status(StatusProjeto.ABERTO).build();
            when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

            var dto = new com.example.tcc_backend.dto.request.ProjetoRequest();
            dto.setTitulo("Hack");
            dto.setDescricao("Desc");
            dto.setRequisitos("Req");
            dto.setVagas(1);
            dto.setAreaId(1);

            assertThatThrownBy(() -> projetoService.update(10, dto))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    @Nested
    class ProjetoDelete {

        @Test
        void devePermitirOrientadorDeletarProjeto() {
            Usuario orientador = TestDataFactory.usuarioOrientador(2);
            when(authHelper.getCurrentUser()).thenReturn(orientador);

            Orientador ori = TestDataFactory.orientador(2, orientador);
            Projeto projeto = Projeto.builder()
                    .id(10).titulo("P").orientador(ori).status(StatusProjeto.ABERTO).build();
            when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

            projetoService.delete(10);
            verify(projetoRepository).delete(projeto);
        }

        @Test
        void deveBloquearDeletarProjetoDeOutro() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Orientador orientador = TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2));
            Projeto projeto = Projeto.builder()
                    .id(10).titulo("P").orientador(orientador).status(StatusProjeto.ABERTO).build();
            when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

            assertThatThrownBy(() -> projetoService.delete(10))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    @Nested
    class ProjetoRecrutar {

        @Test
        void deveBloquearRecrutarSemGestao() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Orientador orientador = TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2));
            Projeto projeto = Projeto.builder()
                    .id(10).titulo("P").orientador(orientador).status(StatusProjeto.ABERTO).build();
            when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));

            assertThatThrownBy(() -> projetoService.recrutar(10, 3))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    // ── NotificacaoController ──────────────────────────────────────

    @Nested
    class NotificacaoMarcarLida {

        @Test
        void devePermitirMarcarPropriaNotificacao() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Notificacao notificacao = TestDataFactory.notificacao(5, usuarioA);
            when(notificacaoRepository.findById(5)).thenReturn(Optional.of(notificacao));
            when(notificacaoRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = notificacaoService.marcarComoLida(5);
            assertThat(result.getLida()).isTrue();
        }

        @Test
        void deveBloquearMarcarNotificacaoDeOutro() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Usuario usuarioB = TestDataFactory.usuarioAluno(2);
            Notificacao notificacao = TestDataFactory.notificacao(5, usuarioB);
            when(notificacaoRepository.findById(5)).thenReturn(Optional.of(notificacao));

            assertThatThrownBy(() -> notificacaoService.marcarComoLida(5))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    // ── ProgressoController ────────────────────────────────────────

    @Nested
    class ProgressoCriar {

        @Test
        void deveBloquearCriarProgressoEmProjetoAlheio() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Orientador orientador = TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2));
            Projeto projeto = Projeto.builder()
                    .id(10).titulo("P").orientador(orientador).status(StatusProjeto.ABERTO).build();
            when(projetoRepository.findById(10)).thenReturn(Optional.of(projeto));
            when(inscricaoRepository.findByProjetoIdAndAlunoUsuarioId(10, 1))
                    .thenReturn(Optional.empty());

            var dto = new com.example.tcc_backend.dto.request.ProgressoRequest();
            dto.setDescricao("Teste");

            assertThatThrownBy(() -> progressoService.criar(10, dto))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    @Nested
    class ProgressoAtualizar {

        @Test
        void deveBloquearAtualizarProgressoDeOutro() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Usuario autor = TestDataFactory.usuarioAluno(99);
            Orientador orientador = TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2));
            Projeto projeto = TestDataFactory.projetoComOrientador(10, orientador);
            Progresso progresso = TestDataFactory.progresso(5, projeto, autor);
            when(progressoRepository.findById(5)).thenReturn(Optional.of(progresso));

            var dto = new com.example.tcc_backend.dto.request.ProgressoRequest();
            dto.setDescricao("Hack");

            assertThatThrownBy(() -> progressoService.atualizar(5, dto))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    @Nested
    class ProgressoRemover {

        @Test
        void deveBloquearRemoverProgressoDeOutro() {
            Usuario usuarioA = TestDataFactory.usuarioAluno(1);
            when(authHelper.getCurrentUser()).thenReturn(usuarioA);

            Usuario autor = TestDataFactory.usuarioAluno(99);
            Orientador orientador = TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2));
            Projeto projeto = TestDataFactory.projetoComOrientador(10, orientador);
            Progresso progresso = TestDataFactory.progresso(5, projeto, autor);
            when(progressoRepository.findById(5)).thenReturn(Optional.of(progresso));

            assertThatThrownBy(() -> progressoService.remover(5))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                            .isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

}
