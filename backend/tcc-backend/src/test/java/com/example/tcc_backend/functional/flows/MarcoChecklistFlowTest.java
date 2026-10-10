package com.example.tcc_backend.functional.flows;

import com.example.tcc_backend.functional.FunctionalTestSupport;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MarcoChecklistFlowTest extends FunctionalTestSupport {

    private TestUser orientador;
    private TestUser aluno;
    private TestUser outroAluno;
    private TestUser invasor;
    private Integer projetoId;

    private void montarCenario() throws Exception {
        orientador = registerOrientador("chk-orient");
        aluno = registerAluno("chk-aluno");
        outroAluno = registerAluno("chk-aluno2");
        invasor = registerAluno("chk-inv");
        Integer cursoId = createCurso("Ciencia da Computacao");
        Integer areaId = createArea("Engenharia de Software", cursoId);
        projetoId = createProjetoAsOrientador(orientador.token(), "Projeto Checklist", areaId);
        aprovarInscricao(orientador.token(), inscreverAluno(aluno.token(), projetoId));
        aprovarInscricao(orientador.token(), inscreverAluno(outroAluno.token(), projetoId));
    }

    private String base() {
        return "/api/projetos/" + projetoId + "/etapas";
    }

    private ResultActions chamar(String metodo, String url, TestUser quem, Object corpo) throws Exception {
        var req = switch (metodo) {
            case "POST" -> post(url);
            case "PUT" -> put(url);
            case "PATCH" -> patch(url);
            case "DELETE" -> delete(url);
            default -> get(url);
        };
        req.header("Authorization", authHeader(quem.token()));
        if (corpo != null) {
            req.contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(corpo));
        }
        return mockMvc.perform(req);
    }

    private JsonNode json(ResultActions r, int statusEsperado) throws Exception {
        r.andExpect(status().is(statusEsperado));
        String corpo = r.andReturn().getResponse().getContentAsString();
        return corpo.isBlank() ? null : objectMapper.readTree(corpo);
    }

    private JsonNode marcos() throws Exception {
        return json(chamar("GET", base(), orientador, null), 200);
    }

    private JsonNode tarefaPorTitulo(JsonNode marco, String titulo) {
        for (JsonNode t : marco.get("tarefas")) {
            if (titulo.equals(t.get("titulo").asText())) {
                return t;
            }
        }
        throw new AssertionError("Tarefa nao encontrada: " + titulo);
    }

    private JsonNode novaTarefa(TestUser quem, int marcoId, String titulo, boolean obrigatoria) throws Exception {
        return json(chamar("POST", base() + "/" + marcoId + "/tarefas", quem,
                Map.of("titulo", titulo, "obrigatoria", obrigatoria)), 201);
    }

    private JsonNode marcar(TestUser quem, int marcoId, int tarefaId, boolean concluida, int statusEsperado) throws Exception {
        return json(chamar("PATCH", base() + "/" + marcoId + "/tarefas/" + tarefaId, quem,
                Map.of("concluida", concluida)), statusEsperado);
    }

    @Test
    void fluxoCompletoDeChecklistRevisaoEHistorico() throws Exception {
        montarCenario();

        JsonNode lista = marcos();
        assertThat(lista.size()).isEqualTo(6);
        int marcoA = lista.get(0).get("id").asInt();
        int marcoB = lista.get(1).get("id").asInt();
        for (JsonNode m : lista) {
            assertThat(m.get("status").asText()).isEqualTo("PENDING");
            assertThat(m.get("semTarefas").asBoolean()).isTrue();
            assertThat(m.get("percentual").asInt()).isZero();
            assertThat(m.get("emRevisao").asBoolean()).isFalse();
        }

        // orientador monta o checklist; aluno cria tarefa pessoal e nao pode criar obrigatoria
        JsonNode comTarefa = novaTarefa(orientador, marcoA, "Ler artigo base", true);
        assertThat(comTarefa.get("tarefas").get(0).get("origem").asText()).isEqualTo("ORIENTADOR");
        assertThat(comTarefa.get("tarefas").get(0).get("obrigatoria").asBoolean()).isTrue();
        novaTarefa(orientador, marcoA, "Resumo opcional", false);
        json(chamar("POST", base() + "/" + marcoA + "/tarefas", aluno, Map.of("titulo", "X", "obrigatoria", true)), 400);
        JsonNode comPessoal = novaTarefa(aluno, marcoA, "Minha anotacao", false);
        assertThat(comPessoal.get("itensTotal").asInt()).isEqualTo(3);
        int idObrigatoria = tarefaPorTitulo(comPessoal, "Ler artigo base").get("id").asInt();
        int idOpcional = tarefaPorTitulo(comPessoal, "Resumo opcional").get("id").asInt();
        int idPessoal = tarefaPorTitulo(comPessoal, "Minha anotacao").get("id").asInt();
        assertThat(tarefaPorTitulo(comPessoal, "Minha anotacao").get("origem").asText()).isEqualTo("ALUNO");

        // permissoes: aluno nao edita tarefa do orientador; outro aluno e o orientador nao mexem na pessoal; invasor nada
        json(chamar("PATCH", base() + "/" + marcoA + "/tarefas/" + idObrigatoria, aluno, Map.of("titulo", "hack")), 403);
        json(chamar("DELETE", base() + "/" + marcoA + "/tarefas/" + idObrigatoria, aluno, null), 403);
        marcar(outroAluno, marcoA, idPessoal, true, 403);
        marcar(orientador, marcoA, idPessoal, true, 403);
        json(chamar("DELETE", base() + "/" + marcoA + "/tarefas/" + idPessoal, orientador, null), 403);
        json(chamar("POST", base() + "/" + marcoA + "/tarefas", invasor, Map.of("titulo", "x")), 403);
        json(chamar("GET", base(), invasor, null), 403);

        // varios marcos em andamento ao mesmo tempo
        JsonNode apos = marcar(aluno, marcoA, idOpcional, true, 200);
        assertThat(apos.get("status").asText()).isEqualTo("ACTIVE");
        assertThat(apos.get("percentual").asInt()).isEqualTo(33);
        long ativosAntes = 0;
        JsonNode tarefaB = novaTarefa(orientador, marcoB, "Passo B", false);
        JsonNode aposB = marcar(aluno, marcoB, tarefaB.get("tarefas").get(0).get("id").asInt(), true, 200);
        assertThat(aposB.get("status").asText()).isEqualTo("ACTIVE");
        assertThat(aposB.get("percentual").asInt()).isEqualTo(100);
        for (JsonNode m : marcos()) {
            if (m.get("status").asText().equals("ACTIVE")) {
                ativosAntes++;
            }
        }
        assertThat(ativosAntes).isEqualTo(2);
        // 100% nao aprova sozinho
        assertThat(aposB.get("status").asText()).isNotEqualTo("DONE");

        // envio exige obrigatorias
        json(chamar("POST", base() + "/" + marcoA + "/enviar-revisao", aluno, null), 409);
        json(chamar("POST", base() + "/" + marcoA + "/enviar-revisao", orientador, null), 403);
        marcar(aluno, marcoA, idObrigatoria, true, 200);
        JsonNode enviado = json(chamar("POST", base() + "/" + marcoA + "/enviar-revisao", aluno, null), 200);
        assertThat(enviado.get("emRevisao").asBoolean()).isTrue();
        assertThat(enviado.get("status").asText()).isEqualTo("ACTIVE");
        json(chamar("POST", base() + "/" + marcoA + "/enviar-revisao", aluno, null), 409);
        marcar(aluno, marcoA, idObrigatoria, false, 409);

        // revisao: aluno nao decide; devolver exige comentario
        json(chamar("POST", base() + "/" + marcoA + "/revisao", aluno, Map.of("acao", "APROVAR")), 403);
        json(chamar("POST", base() + "/" + marcoA + "/revisao", orientador, Map.of("acao", "DEVOLVER")), 400);
        JsonNode devolvido = json(chamar("POST", base() + "/" + marcoA + "/revisao", orientador,
                Map.of("acao", "DEVOLVER", "comentario", "Faltou citar a fonte")), 200);
        assertThat(devolvido.get("status").asText()).isEqualTo("REJECTED");
        assertThat(devolvido.get("emRevisao").asBoolean()).isFalse();
        assertThat(devolvido.get("ultimaRevisao").get("acao").asText()).isEqualTo("DEVOLVIDO");
        assertThat(devolvido.get("ultimaRevisao").get("comentario").asText()).isEqualTo("Faltou citar a fonte");
        assertThat(devolvido.get("ultimaRevisao").get("autorNome").asText()).contains("Orientador");
        // sem envio pendente nao ha o que aprovar
        json(chamar("POST", base() + "/" + marcoA + "/revisao", orientador, Map.of("acao", "APROVAR")), 409);

        // reenvio e aprovacao preservam o historico
        json(chamar("POST", base() + "/" + marcoA + "/enviar-revisao", aluno, null), 200);
        JsonNode aprovado = json(chamar("POST", base() + "/" + marcoA + "/revisao", orientador,
                Map.of("acao", "APROVAR", "comentario", "Ok")), 200);
        assertThat(aprovado.get("status").asText()).isEqualTo("DONE");
        assertThat(aprovado.get("emRevisao").asBoolean()).isFalse();
        assertThat(aprovado.get("ultimaRevisao").get("acao").asText()).isEqualTo("APROVADO");

        JsonNode historico = json(chamar("GET", base() + "/" + marcoA + "/revisoes", aluno, null), 200);
        List<String> acoes = new java.util.ArrayList<>();
        historico.forEach(h -> acoes.add(h.get("acao").asText()));
        assertThat(acoes).containsExactly("APROVADO", "ENVIADO", "DEVOLVIDO", "ENVIADO");
        json(chamar("GET", base() + "/" + marcoA + "/revisoes", invasor, null), 403);

        // marco aprovado fica travado
        json(chamar("POST", base() + "/" + marcoA + "/tarefas", orientador, Map.of("titulo", "Tarde demais")), 409);
        marcar(aluno, marcoA, idOpcional, false, 409);

        // resumo consistente com os itens dos marcos
        JsonNode resumo = json(chamar("GET", "/api/projects/" + projetoId + "/progress", aluno, null), 200);
        int concluidos = 0;
        int total = 0;
        for (JsonNode m : resumo.get("marcos")) {
            concluidos += m.get("itensConcluidos").asInt();
            total += m.get("itensTotal").asInt();
        }
        assertThat(resumo.get("itensConcluidos").asInt()).isEqualTo(concluidos).isEqualTo(3);
        assertThat(resumo.get("itensTotal").asInt()).isEqualTo(total).isEqualTo(4);
        assertThat(resumo.get("percentualGeral").asInt()).isEqualTo(75);
        assertThat(resumo.get("overallPercent").asInt()).isEqualTo(75);
        assertThat(resumo.get("marcosTotal").asInt()).isEqualTo(6);
        assertThat(resumo.get("marcosConcluidos").asInt()).isEqualTo(1);
        assertThat(resumo.get("marcosEmRevisao").asInt()).isZero();
    }

    @Test
    void atualizacaoNarrativaNaoMudaChecklist() throws Exception {
        montarCenario();
        int marco = marcos().get(0).get("id").asInt();
        novaTarefa(orientador, marco, "Item", false);

        json(chamar("POST", "/api/projetos/" + projetoId + "/updates", aluno, Map.of(
                "titulo", "Avancei muito", "categoria", "progress", "etapaId", marco, "etapaContribuicao", 100)), 201);

        JsonNode depois = marcos().get(0);
        assertThat(depois.get("itensConcluidos").asInt()).isZero();
        assertThat(depois.get("status").asText()).isEqualTo("PENDING");
        assertThat(depois.get("percentual").asInt()).isZero();
        JsonNode resumo = json(chamar("GET", "/api/projects/" + projetoId + "/progress", aluno, null), 200);
        assertThat(resumo.get("atualizacoesTotal").asInt()).isEqualTo(1);
    }

    @Test
    void reordenacaoEExclusaoMantemIntegridade() throws Exception {
        montarCenario();
        JsonNode lista = marcos();
        List<Integer> ids = new java.util.ArrayList<>();
        lista.forEach(m -> ids.add(m.get("id").asInt()));

        // somente o orientador reordena marcos, e a lista precisa ser exata
        json(chamar("PUT", base() + "/ordem", aluno, Map.of("ids", ids)), 403);
        json(chamar("PUT", base() + "/ordem", orientador, Map.of("ids", ids.subList(0, 5))), 400);
        List<Integer> comRepeticao = new java.util.ArrayList<>(ids);
        comRepeticao.set(1, ids.get(0));
        json(chamar("PUT", base() + "/ordem", orientador, Map.of("ids", comRepeticao)), 400);

        List<Integer> invertida = new java.util.ArrayList<>(ids);
        java.util.Collections.reverse(invertida);
        JsonNode reordenado = json(chamar("PUT", base() + "/ordem", orientador, Map.of("ids", invertida)), 200);
        for (int i = 0; i < invertida.size(); i++) {
            assertThat(reordenado.get(i).get("id").asInt()).isEqualTo(invertida.get(i));
            assertThat(reordenado.get(i).get("ordem").asInt()).isEqualTo(i + 1);
        }

        // reordenar tarefas: aluno so as pessoais; orientador so as dele
        int marco = invertida.get(0);
        novaTarefa(orientador, marco, "O1", false);
        novaTarefa(orientador, marco, "O2", false);
        JsonNode comPessoais = novaTarefa(aluno, marco, "P1", false);
        comPessoais = novaTarefa(aluno, marco, "P2", false);
        int o1 = tarefaPorTitulo(comPessoais, "O1").get("id").asInt();
        int o2 = tarefaPorTitulo(comPessoais, "O2").get("id").asInt();
        int p1 = tarefaPorTitulo(comPessoais, "P1").get("id").asInt();
        int p2 = tarefaPorTitulo(comPessoais, "P2").get("id").asInt();

        json(chamar("PUT", base() + "/" + marco + "/tarefas/ordem", aluno, Map.of("ids", List.of(o2, o1))), 400);
        JsonNode apos = json(chamar("PUT", base() + "/" + marco + "/tarefas/ordem", aluno, Map.of("ids", List.of(p2, p1))), 200);
        assertThat(tarefaPorTitulo(apos, "P2").get("ordem").asInt()).isLessThan(tarefaPorTitulo(apos, "P1").get("ordem").asInt());
        json(chamar("PUT", base() + "/" + marco + "/tarefas/ordem", orientador, Map.of("ids", List.of(o2, o1))), 200);
        json(chamar("PUT", base() + "/" + marco + "/tarefas/ordem", orientador, Map.of("ids", List.of(o2, o2))), 400);

        // remover tarefa renumera as restantes sem buracos
        JsonNode semO2 = json(chamar("DELETE", base() + "/" + marco + "/tarefas/" + o2, orientador, null), 200);
        List<Integer> ordens = new java.util.ArrayList<>();
        semO2.get("tarefas").forEach(t -> ordens.add(t.get("ordem").asInt()));
        assertThat(ordens).containsExactly(1, 2, 3);

        // excluir marco remove tarefas e historico em cascata e renumera os demais
        Integer tarefasAntes = jdbc.queryForObject("SELECT COUNT(*) FROM progress_step_tasks WHERE step_id = ?", Integer.class, marco);
        assertThat(tarefasAntes).isEqualTo(3);
        json(chamar("DELETE", base() + "/" + marco, orientador, null), 204);
        Integer tarefasDepois = jdbc.queryForObject("SELECT COUNT(*) FROM progress_step_tasks WHERE step_id = ?", Integer.class, marco);
        assertThat(tarefasDepois).isZero();
        JsonNode restantes = marcos();
        assertThat(restantes.size()).isEqualTo(5);
        for (int i = 0; i < restantes.size(); i++) {
            assertThat(restantes.get(i).get("ordem").asInt()).isEqualTo(i + 1);
        }
    }

    @Test
    void projetoSemMarcosTemProgressoZero() throws Exception {
        montarCenario();
        for (JsonNode m : marcos()) {
            json(chamar("DELETE", base() + "/" + m.get("id").asInt(), orientador, null), 204);
        }

        assertThat(marcos().size()).isZero();
        JsonNode resumo = json(chamar("GET", "/api/projects/" + projetoId + "/progress", aluno, null), 200);
        assertThat(resumo.get("percentualGeral").asInt()).isZero();
        assertThat(resumo.get("marcosTotal").asInt()).isZero();
        assertThat(resumo.get("itensTotal").asInt()).isZero();
        assertThat(resumo.get("marcos").size()).isZero();
        // listar nao recria marcos padrao
        assertThat(marcos().size()).isZero();
    }
}
