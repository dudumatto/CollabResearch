package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.UsuarioRequest;
import com.example.tcc_backend.dto.request.UsuarioPreferenciasRequest;
import com.example.tcc_backend.dto.response.UsuarioProfileResponse;
import com.example.tcc_backend.model.Curso;
import com.example.tcc_backend.model.Inscricao;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.AlunoRepository;
import com.example.tcc_backend.repository.CursoRepository;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AlunoRepository alunoRepository;
    @Mock
    private OrientadorRepository orientadorRepository;
    @Mock
    private CursoRepository cursoRepository;
    @Mock
    private ProjetoRepository projetoRepository;
    @Mock
    private InscricaoRepository inscricaoRepository;
    @Mock
    private AuthHelper authHelper;

    @InjectMocks
    private UsuarioService usuarioService;

    @Test
    void findAllDevePermitirOrientador() {
        Usuario orientador = TestDataFactory.usuarioOrientador(2);
        when(authHelper.getCurrentUser()).thenReturn(orientador);
        when(usuarioRepository.findAll()).thenReturn(List.of(TestDataFactory.usuarioAluno(1)));

        List<Usuario> usuarios = usuarioService.findAll();

        assertThat(usuarios).hasSize(1);
        verify(usuarioRepository).findAll();
    }

    @Test
    void findAllDeveNegarAluno() {
        when(authHelper.getCurrentUser()).thenReturn(TestDataFactory.usuarioAluno(1));

        assertThatThrownBy(() -> usuarioService.findAll())
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void findByIdDevePermitirProprioUsuario() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));

        Usuario encontrado = usuarioService.findById(1);

        assertThat(encontrado.getId()).isEqualTo(1);
    }

    @Test
    void updateDeveSalvarAlteracoesDoProprioAluno() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        var aluno = TestDataFactory.aluno(1, usuario);
        Curso curso = Curso.builder().id(5).nome("ADS").build();
        UsuarioRequest request = UsuarioRequest.builder()
                .nome("Novo Nome")
                .email("novo@teste.com")
                .instituicao("FATEC")
                .bio("Bio")
                .semestre(4)
                .cursoId(5)
                .interesses("IA")
                .build();

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));
        when(alunoRepository.findByUsuarioId(1)).thenReturn(Optional.of(aluno));
        when(cursoRepository.findById(5)).thenReturn(Optional.of(curso));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Usuario atualizado = usuarioService.update(1, request);

        assertThat(atualizado.getNome()).isEqualTo("Novo Nome");
        assertThat(atualizado.getEmail()).isEqualTo("novo@teste.com");
        assertThat(atualizado.getInstituicao()).isEqualTo("FATEC");
        verify(alunoRepository).save(any());
    }

    @Test
    void updateDevePreservarFotoQuandoNaoEnviada() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        usuario.setFotoPerfilUrl("https://cdn.exemplo/foto-antiga.png");
        var aluno = TestDataFactory.aluno(1, usuario);
        Curso curso = Curso.builder().id(5).nome("ADS").build();
        UsuarioRequest request = UsuarioRequest.builder()
                .nome("Novo Nome")
                .email("novo@teste.com")
                .instituicao("FATEC")
                .bio("Bio")
                .semestre(4)
                .cursoId(5)
                .build();

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));
        when(alunoRepository.findByUsuarioId(1)).thenReturn(Optional.of(aluno));
        when(cursoRepository.findById(5)).thenReturn(Optional.of(curso));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Usuario atualizado = usuarioService.update(1, request);

        assertThat(atualizado.getFotoPerfilUrl()).isEqualTo("https://cdn.exemplo/foto-antiga.png");
    }

    @Test
    void meDeveRetornarPerfilCompletoDoAluno() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        Curso curso = Curso.builder().id(5).nome("ADS").build();
        var aluno = TestDataFactory.aluno(1, usuario);
        aluno.setCurso(curso);
        aluno.setSemestre(4);
        aluno.setInteresses("IA");
        usuario.setTema("escuro");
        usuario.setNotificacoesAtivas(true);

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(alunoRepository.findByUsuarioId(1)).thenReturn(Optional.of(aluno));
        when(orientadorRepository.findByUsuarioId(1)).thenReturn(Optional.empty());

        UsuarioProfileResponse profile = usuarioService.me();

        assertThat(profile.getId()).isEqualTo(1);
        assertThat(profile.getCursoNome()).isEqualTo("ADS");
        assertThat(profile.getTema()).isEqualTo("escuro");
    }

    @Test
    void findProfileByIdDeveRetornarPerfilCompletoDoUsuario() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        Curso curso = Curso.builder().id(5).nome("ADS").build();
        var aluno = TestDataFactory.aluno(1, usuario);
        aluno.setCurso(curso);
        aluno.setSemestre(4);
        aluno.setInteresses("IA");

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));
        when(alunoRepository.findByUsuarioId(1)).thenReturn(Optional.of(aluno));
        when(orientadorRepository.findByUsuarioId(1)).thenReturn(Optional.empty());

        UsuarioProfileResponse profile = usuarioService.findProfileById(1);

        assertThat(profile.getId()).isEqualTo(1);
        assertThat(profile.getCursoNome()).isEqualTo("ADS");
    }

    @Test
    void updatePreferenciasDevePersistirTemaENotificacoes() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        UsuarioPreferenciasRequest request = new UsuarioPreferenciasRequest();
        request.setTema("claro");
        request.setNotificacoesAtivas(false);

        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(alunoRepository.findByUsuarioId(1)).thenReturn(Optional.empty());
        when(orientadorRepository.findByUsuarioId(1)).thenReturn(Optional.empty());

        UsuarioProfileResponse profile = usuarioService.updatePreferencias(request);

        assertThat(profile.getTema()).isEqualTo("claro");
        assertThat(profile.getNotificacoesAtivas()).isFalse();
    }

    @Test
    void deleteDeveDesativarUsuario() {
        Usuario usuario = TestDataFactory.usuarioAluno(1);
        when(authHelper.getCurrentUser()).thenReturn(usuario);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        usuarioService.delete(1);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertThat(captor.getValue().getAtivo()).isFalse();
    }

    @Test
    void findProjetosByUsuarioDevePermitirOrientadorConsultarOutroUsuario() {
        Usuario orientador = TestDataFactory.usuarioOrientador(2);
        Usuario alvo = TestDataFactory.usuarioAluno(1);
        when(authHelper.getCurrentUser()).thenReturn(orientador);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(alvo));
        when(projetoRepository.findRelacionadosAoUsuario(1)).thenReturn(List.of());

        List<?> projetos = usuarioService.findProjetosByUsuario(1);

        assertThat(projetos).isEmpty();
    }

    @Test
    void findInscricoesByUsuarioDeveRetornarInscricoesDoAluno() {
        Usuario aluno = TestDataFactory.usuarioAluno(1);
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(
                5,
                TestDataFactory.aluno(1, aluno),
                TestDataFactory.projetoComOrientador(10, TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2)))
        );

        when(authHelper.getCurrentUser()).thenReturn(aluno);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(aluno));
        when(inscricaoRepository.findByAlunoUsuarioId(1)).thenReturn(List.of(inscricao));

        List<Inscricao> inscricoes = usuarioService.findInscricoesByUsuario(1);

        assertThat(inscricoes).hasSize(1);
    }
}
