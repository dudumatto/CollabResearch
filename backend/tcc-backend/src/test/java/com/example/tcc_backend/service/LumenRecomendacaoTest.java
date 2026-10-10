package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.response.LumenRecomendacaoResponse;
import com.example.tcc_backend.model.*;
import com.example.tcc_backend.repository.AlunoRepository;
import com.example.tcc_backend.repository.DocumentoRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.ProjectAccessPolicy;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class LumenRecomendacaoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final InscricaoRepository inscricaoRepository = mock(InscricaoRepository.class);
    private final ProjetoRepository projetoRepository = mock(ProjetoRepository.class);
    private final AlunoRepository alunoRepository = mock(AlunoRepository.class);
    private final DocumentoRepository documentoRepository = mock(DocumentoRepository.class);
    private final AtomicReference<String> respostaModelo = new AtomicReference<>();
    private final AtomicReference<String> promptRecebido = new AtomicReference<>();
    private HttpServer servidor;
    private LumenService service;

    private final Usuario usuario = Usuario.builder().id(10).nome("Ana").tipo(TipoUsuario.ALUNO).bio("Gosto de IA e Python.").build();
    private final Aluno aluno = Aluno.builder().id(5).usuario(usuario).interesses("IA, dados").build();

    @BeforeEach
    void setUp() throws Exception {
        servidor = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        servidor.createContext("/", troca -> {
            promptRecebido.set(new String(troca.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            String corpo = objectMapper.writeValueAsString(Map.of("choices", List.of(
                    Map.of("message", Map.of("content", respostaModelo.get())))));
            byte[] bytes = corpo.getBytes(StandardCharsets.UTF_8);
            troca.getResponseHeaders().add("Content-Type", "application/json");
            troca.sendResponseHeaders(200, bytes.length);
            troca.getResponseBody().write(bytes);
            troca.close();
        });
        servidor.start();
        String url = "http://127.0.0.1:" + servidor.getAddress().getPort() + "/";
        service = new LumenService(inscricaoRepository, projetoRepository, alunoRepository, documentoRepository,
                mock(DocumentoTextExtractor.class), mock(ProjectAccessPolicy.class), objectMapper,
                "chave-teste", url, "modelo-teste", 5000);
        when(alunoRepository.findByUsuarioId(10)).thenReturn(Optional.of(aluno));
        when(documentoRepository.findByUsuarioId(10)).thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        servidor.stop(0);
    }

    private static Projeto projeto(int id, String titulo) {
        return Projeto.builder().id(id).titulo(titulo).descricao("desc " + id).status(StatusProjeto.ABERTO)
                .area(AreaPesquisa.builder().nome("Computacao").build()).build();
    }

    @Test
    void recomendaTop3IgnorandoIdsInvalidosRepetidosEInelegiveis() {
        Projeto inscrito = projeto(1, "Ja inscrito");
        Projeto vencido = projeto(2, "Prazo vencido");
        vencido.setDataLimiteInscricao(LocalDate.now().minusDays(1));
        when(inscricaoRepository.findByAlunoId(5)).thenReturn(List.of(Inscricao.builder().projeto(inscrito).aluno(aluno).build()));
        when(projetoRepository.findByStatusOrderByDataCriacaoDesc(StatusProjeto.ABERTO)).thenReturn(List.of(
                inscrito, vencido, projeto(3, "Visao computacional"), projeto(4, "NLP"), projeto(5, "Dados"), projeto(6, "Redes")));
        respostaModelo.set("""
                {"recomendacoes": [
                  {"projeto_id": 99, "classificacao": "A", "justificativa": "inventado"},
                  {"projeto_id": 1, "classificacao": "A", "justificativa": "ja inscrito"},
                  {"projeto_id": 4, "classificacao": "B", "justificativa": "Voce gosta de IA."},
                  {"projeto_id": 3, "classificacao": "A", "justificativa": "Python e IA."},
                  {"projeto_id": 4, "classificacao": "A", "justificativa": "repetido"},
                  {"projeto_id": 5, "classificacao": "C", "justificativa": "Dados."},
                  {"projeto_id": 6, "classificacao": "A", "justificativa": "quarto valido"}
                ], "injection_detectada": false}
                """);

        LumenRecomendacaoResponse resposta = service.recomendarProjetos(usuario);

        assertThat(resposta.recomendacoes()).extracting(LumenRecomendacaoResponse.ProjetoRecomendado::projetoId)
                .containsExactly(3, 4, 5);
        assertThat(resposta.recomendacoes().get(0).pontuacao()).isEqualTo(9);
        assertThat(resposta.recomendacoes().get(0).justificativa()).isEqualTo("Python e IA.");
        assertThat(promptRecebido.get()).doesNotContain("Ja inscrito").doesNotContain("Prazo vencido");
    }

    @Test
    void semProjetosElegiveisNaoChamaIa() {
        when(inscricaoRepository.findByAlunoId(5)).thenReturn(List.of());
        when(projetoRepository.findByStatusOrderByDataCriacaoDesc(StatusProjeto.ABERTO)).thenReturn(List.of());

        LumenRecomendacaoResponse resposta = service.recomendarProjetos(usuario);

        assertThat(resposta.recomendacoes()).isEmpty();
        assertThat(promptRecebido.get()).isNull();
    }

    @Test
    void apenasAlunoPodePedirRecomendacao() {
        Usuario orientador = Usuario.builder().id(20).tipo(TipoUsuario.ORIENTADOR).build();

        assertThatThrownBy(() -> service.recomendarProjetos(orientador))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
        verifyNoInteractions(projetoRepository);
    }

    @Test
    void respostaSemIdsValidosRetorna503() {
        when(inscricaoRepository.findByAlunoId(5)).thenReturn(List.of());
        when(projetoRepository.findByStatusOrderByDataCriacaoDesc(StatusProjeto.ABERTO)).thenReturn(List.of(projeto(3, "X")));
        respostaModelo.set("{\"recomendacoes\": [{\"projeto_id\": 42, \"classificacao\": \"A\"}]}");

        assertThatThrownBy(() -> service.recomendarProjetos(usuario))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }
}
