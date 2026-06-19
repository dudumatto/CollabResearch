package com.example.tcc_backend.service;

import com.example.tcc_backend.model.Documento;
import com.example.tcc_backend.model.TipoDocumento;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.DocumentoRepository;
import com.example.tcc_backend.repository.UsuarioRepository;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentoServiceTest {

    private static final int OVER_10MB = (10 * 1024 * 1024) + 1;

    @Mock
    private DocumentoRepository documentoRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AuthHelper authHelper;

    @InjectMocks
    private DocumentoService documentoService;

    @Test
    void uploadDeveSalvarDocumentoValido() throws Exception {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        when(authHelper.getCurrentUser()).thenReturn(usuario);
        MockMultipartFile arquivo = new MockMultipartFile(
                "arquivo",
                "curriculo.pdf",
                "application/pdf",
                "%PDF-1.7\nconteudo".getBytes()
        );

        // 1. MUDANÇA AQUI: Nós não usamos mais o authHelper nesse método.
        // Agora o Service busca o usuário pelo ID, então precisamos simular o banco:
        when(usuarioRepository.findById(1)).thenReturn(java.util.Optional.of(usuario));

        when(documentoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // 2. MUDANÇA AQUI: Passamos o ID do usuário (1) como primeiro parâmetro!
        Documento documento = documentoService.upload(1, TipoDocumento.CURRICULO, arquivo);

        Path caminho = Path.of(documento.getCaminho());
        assertThat(Files.exists(caminho)).isTrue();
        assertThat(caminho.getFileName().toString()).endsWith(".pdf");

        // BÔNUS: Já que adicionamos a coluna nova, vamos garantir que ela está sendo preenchida!
        assertThat(documento.getNomeArquivo()).isEqualTo("curriculo.pdf");

        verify(documentoRepository).save(any());

        limparArquivoCriado(caminho);
    }

    @Test
    void uploadComUrlDeveSalvarMetadadosSemArquivoFisico() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        String url = "https://qqusyyzkroensiazmslf.supabase.co/storage/v1/object/public/documents/usuarios/1/curriculo.pdf";

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));
        when(documentoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Documento documento = documentoService.upload(1, TipoDocumento.CURRICULO, "curriculo.pdf", url);

        assertThat(documento.getUsuario()).isEqualTo(usuario);
        assertThat(documento.getTipo()).isEqualTo(TipoDocumento.CURRICULO);
        assertThat(documento.getNomeArquivo()).isEqualTo("curriculo.pdf");
        assertThat(documento.getCaminho()).isEqualTo(url);

        verify(documentoRepository).save(any());
    }

    @Test
    void uploadComUrlDeveNegarUrlForaDoSupabase() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        when(authHelper.getCurrentUser()).thenReturn(usuario);

        assertThatThrownBy(() -> documentoService.upload(1, TipoDocumento.CURRICULO, "curriculo.pdf", "https://example.com/curriculo.pdf"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void uploadDeveNegarTipoDeArquivoInvalido() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        MockMultipartFile arquivo = new MockMultipartFile(
                "arquivo",
                "malicioso.exe",
                "application/octet-stream",
                "conteudo".getBytes()
        );

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> documentoService.upload(1,TipoDocumento.CURRICULO, arquivo))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void uploadDeveNegarQuandoUsuarioIdForDeOutroUsuario() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        MockMultipartFile arquivo = new MockMultipartFile(
                "arquivo",
                "curriculo.pdf",
                "application/pdf",
                "%PDF-1.7\nconteudo".getBytes()
        );

        when(authHelper.getCurrentUser()).thenReturn(usuario);

        assertThatThrownBy(() -> documentoService.upload(2, TipoDocumento.CURRICULO, arquivo))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void uploadDeveNegarQuandoArquivoForMuitoGrande() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        when(authHelper.getCurrentUser()).thenReturn(usuario);

        byte[] bytes = new byte[OVER_10MB];
        bytes[0] = '%';
        bytes[1] = 'P';
        bytes[2] = 'D';
        bytes[3] = 'F';
        bytes[4] = '-';

        MockMultipartFile arquivo = new MockMultipartFile(
                "arquivo",
                "curriculo.pdf",
                "application/pdf",
                bytes
        );

        assertThatThrownBy(() -> documentoService.upload(1, TipoDocumento.CURRICULO, arquivo))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
    }

    @Test
    void listarPorUsuarioDevePermitirUsuarioAutenticadoAcessarCurriculoDeAluno() {
        when(authHelper.getCurrentUser()).thenReturn(TestDataFactory.usuarioAluno(1));
        when(documentoRepository.findByUsuarioIdAndTipo(2, TipoDocumento.CURRICULO)).thenReturn(java.util.List.of());

        assertThat(documentoService.listarPorUsuario(2)).isEmpty();

        verify(documentoRepository).findByUsuarioIdAndTipo(2, TipoDocumento.CURRICULO);
    }

    @Test
    void listarPorUsuarioDevePermitirAdministrador() {
        when(authHelper.getCurrentUser()).thenReturn(TestDataFactory.usuarioAdmin(9));
        when(documentoRepository.findByUsuarioId(2)).thenReturn(java.util.List.of());

        assertThat(documentoService.listarPorUsuario(2)).isEmpty();

        verify(documentoRepository).findByUsuarioId(2);
    }

    @Test
    void removerDeveNegarQuandoDocumentoForDeOutroUsuario() {
        Usuario dono = TestDataFactory.usuarioAluno(2);
        Usuario usuarioLogado = TestDataFactory.usuarioAluno(1);
        Documento documento = TestDataFactory.documento(5, dono, "uploads/documentos/2/doc.pdf");

        when(authHelper.getCurrentUser()).thenReturn(usuarioLogado);
        when(documentoRepository.findById(5)).thenReturn(Optional.of(documento));

        assertThatThrownBy(() -> documentoService.remover(5))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    private void limparArquivoCriado(Path caminho) throws IOException {
        Files.deleteIfExists(caminho);
        try {
            Files.deleteIfExists(caminho.getParent());
        } catch (IOException ignored) {
        }
    }
}
