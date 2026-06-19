package com.example.tcc_backend.support;

import com.example.tcc_backend.model.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

public final class TestDataFactory {

    private TestDataFactory() {
    }

    public static Usuario usuarioAluno(Integer id) {
        return Usuario.builder()
                .id(id)
                .nome("Aluno Teste")
                .email("aluno" + id + "@teste.com")
                .senha("senha")
                .tipo(TipoUsuario.ALUNO)
                .ativo(true)
                .dataCadastro(LocalDateTime.now())
                .build();
    }

    public static Usuario usuarioOrientador(Integer id) {
        return Usuario.builder()
                .id(id)
                .nome("Orientador Teste")
                .email("orientador" + id + "@teste.com")
                .senha("senha")
                .tipo(TipoUsuario.ORIENTADOR)
                .ativo(true)
                .dataCadastro(LocalDateTime.now())
                .build();
    }

    public static Usuario usuarioAdmin(Integer id) {
        return Usuario.builder()
                .id(id)
                .nome("Admin Teste")
                .email("admin" + id + "@teste.com")
                .senha("senha")
                .tipo(TipoUsuario.ADMIN)
                .ativo(true)
                .dataCadastro(LocalDateTime.now())
                .build();
    }

    public static Aluno aluno(Integer id, Usuario usuario) {
        return Aluno.builder()
                .id(id)
                .usuario(usuario)
                .ra("RA" + id)
                .build();
    }

    public static Orientador orientador(Integer id, Usuario usuario) {
        return Orientador.builder()
                .id(id)
                .usuario(usuario)
                .departamento("Computacao")
                .titulacao("Doutor")
                .build();
    }

    public static Projeto projetoComOrientador(Integer id, Orientador orientador) {
        return Projeto.builder()
                .id(id)
                .titulo("Projeto " + id)
                .descricao("Descricao")
                .requisitos("Java")
                .vagas(1)
                .status(StatusProjeto.ABERTO)
                .orientador(orientador)
                .dataCriacao(LocalDateTime.now())
                .build();
    }

    public static Projeto projetoComAlunoCriador(Integer id, Aluno aluno) {
        return Projeto.builder()
                .id(id)
                .titulo("Projeto " + id)
                .descricao("Descricao")
                .requisitos("Java")
                .vagas(1)
                .status(StatusProjeto.ABERTO)
                .alunoCriador(aluno)
                .dataCriacao(LocalDateTime.now())
                .build();
    }

    public static Inscricao inscricaoAprovada(Integer id, Aluno aluno, Projeto projeto) {
        return Inscricao.builder()
                .id(id)
                .aluno(aluno)
                .projeto(projeto)
                .status(StatusInscricao.APROVADO)
                .dataInscricao(LocalDateTime.now())
                .build();
    }

    public static Documento documento(Integer id, Usuario usuario, String caminho) {
        return Documento.builder()
                .id(id)
                .usuario(usuario)
                .tipo(TipoDocumento.CURRICULO)
                .caminho(caminho)
                .dataEnvio(LocalDateTime.now())
                .build();
    }

    public static Feedback feedback(Integer id, Projeto projeto, Usuario avaliador) {
        return Feedback.builder()
                .id(id)
                .projeto(projeto)
                .avaliador(avaliador)
                .nota(5)
                .comentario("Muito bom")
                .dataFeedback(LocalDateTime.now())
                .build();
    }

    public static Progresso progresso(Integer id, Projeto projeto, Usuario autor) {
        return Progresso.builder()
                .id(id)
                .projeto(projeto)
                .autor(autor)
                .descricao("Atualizacao")
                .dataRegistro(LocalDateTime.now())
                .build();
    }

    public static EtapaProgresso etapaProgresso(Integer id, Projeto projeto, Usuario concluidaPor, Integer ordem, Integer peso, EtapaProgressoStatus status) {
        return EtapaProgresso.builder()
                .id(id)
                .projeto(projeto)
                .titulo("Etapa " + ordem)
                .descricao("Descricao da etapa")
                .peso(peso)
                .ordem(ordem)
                .status(status)
                .concluidaPor(concluidaPor)
                .concluidaEm(LocalDateTime.now())
                .criadaEm(LocalDateTime.now())
                .build();
    }

    public static Progresso progressoComEtapa(Integer id, Projeto projeto, Usuario autor, EtapaProgresso etapa) {
        return Progresso.builder()
                .id(id)
                .projeto(projeto)
                .autor(autor)
                .titulo("Atualizacao " + id)
                .descricao("Atualizacao")
                .categoria("progress")
                .etapa(etapa)
                .stepContribution(50)
                .dataRegistro(LocalDateTime.now())
                .build();
    }

    public static Notificacao notificacao(Integer id, Usuario usuario) {
        return Notificacao.builder()
                .id(id)
                .usuario(usuario)
                .mensagem("Nova notificacao")
                .tipo(TipoNotificacao.MENSAGEM_RECEBIDA)
                .lida(false)
                .dataCriacao(LocalDateTime.now())
                .build();
    }

    public static Conversa conversa(Integer id, Projeto projeto) {
        return Conversa.builder()
                .id(id)
                .projeto(projeto)
                .dataCriacao(OffsetDateTime.now())
                .build();
    }

    public static Mensagem mensagem(Integer id, Conversa conversa, Usuario remetente) {
        return Mensagem.builder()
                .id(id)
                .conversa(conversa)
                .remetente(remetente)
                .conteudo("Mensagem de teste")
                .dataEnvio(OffsetDateTime.now())
                .build();
    }
}
