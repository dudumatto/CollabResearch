package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.AcademicEvaluation;
import com.example.tcc_backend.model.AcademicEvaluationAcknowledgement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvaliacaoAcademicaResponse {

    private Long id;
    private Integer projetoId;
    private Integer etapaId;
    private String etapaTitulo;
    private Integer alunoId;
    private String alunoNome;
    private Integer orientadorId;
    private String orientadorNome;
    private Integer participacao;
    private Integer qualidadeTecnica;
    private Integer cumprimentoDePrazos;
    private Integer comunicacao;
    private String comentarioOrientador;
    private BigDecimal media;
    private boolean cienciaRegistrada;
    private String comentarioAluno;
    private OffsetDateTime dataCiencia;
    private OffsetDateTime criadaEm;
    private OffsetDateTime atualizadaEm;

    public static AvaliacaoAcademicaResponse fromEntity(AcademicEvaluation avaliacao,
                                                        AcademicEvaluationAcknowledgement ciencia) {
        return AvaliacaoAcademicaResponse.builder()
                .id(avaliacao.getId())
                .projetoId(avaliacao.getProjeto() != null ? avaliacao.getProjeto().getId() : null)
                .etapaId(avaliacao.getEtapa() != null ? avaliacao.getEtapa().getId() : null)
                .etapaTitulo(avaliacao.getEtapa() != null ? avaliacao.getEtapa().getTitulo() : null)
                .alunoId(avaliacao.getAluno() != null ? avaliacao.getAluno().getId() : null)
                .alunoNome(avaliacao.getAluno() != null && avaliacao.getAluno().getUsuario() != null
                        ? avaliacao.getAluno().getUsuario().getNome() : null)
                .orientadorId(avaliacao.getOrientador() != null ? avaliacao.getOrientador().getId() : null)
                .orientadorNome(avaliacao.getOrientador() != null && avaliacao.getOrientador().getUsuario() != null
                        ? avaliacao.getOrientador().getUsuario().getNome() : null)
                .participacao(avaliacao.getParticipacao())
                .qualidadeTecnica(avaliacao.getQualidadeTecnica())
                .cumprimentoDePrazos(avaliacao.getCumprimentoDePrazos())
                .comunicacao(avaliacao.getComunicacao())
                .comentarioOrientador(avaliacao.getComentarioOrientador())
                .media(avaliacao.getMedia())
                .cienciaRegistrada(ciencia != null)
                .comentarioAluno(ciencia != null ? ciencia.getComentarioAluno() : null)
                .dataCiencia(ciencia != null ? ciencia.getDataCiencia() : null)
                .criadaEm(avaliacao.getCriadaEm())
                .atualizadaEm(avaliacao.getAtualizadaEm())
                .build();
    }
}
