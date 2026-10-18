package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Inscricao;
import com.example.tcc_backend.model.StatusInscricao;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.function.Function;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscricaoResponse {

    private Integer id;
    private StatusInscricao status;
    private LocalDateTime dataInscricao;
    private String motivacao;
    private String parecerOrientador;
    private Integer projetoId;
    private String projetoTitulo;
    /** Objeto completo do projeto (clientes que esperam {@code projeto} aninhado). */
    private ProjetoResponse projeto;
    private Integer alunoId;
    private Integer alunoUsuarioId;
    private String alunoNome;
    private String alunoFotoPerfilUrl;
    /** Avaliacao da Lumen AI; preenchida apenas nas respostas voltadas ao orientador. */
    private Integer lumenPontuacao;
    private String lumenJustificativa;
    /** JSON serializado de LumenAvaliacao (nulo em avaliacoes antigas). */
    private String lumenAvaliacao;

    public static InscricaoResponse fromEntityParaOrientador(Inscricao inscricao) {
        return fromEntityParaOrientador(inscricao, Function.identity());
    }

    public static InscricaoResponse fromEntityParaOrientador(Inscricao inscricao, Function<String, String> fotoPerfilResolver) {
        InscricaoResponse response = fromEntity(inscricao, null, fotoPerfilResolver);
        response.setLumenPontuacao(inscricao.getLumenPontuacao());
        response.setLumenJustificativa(inscricao.getLumenJustificativa());
        response.setLumenAvaliacao(inscricao.getLumenAvaliacao());
        return response;
    }

    public static InscricaoResponse fromEntity(Inscricao inscricao) {
        return fromEntity(inscricao, null);
    }

    public static InscricaoResponse fromEntity(Inscricao inscricao, Integer vagasOcupadas) {
        return fromEntity(inscricao, vagasOcupadas, Function.identity());
    }

    public static InscricaoResponse fromEntity(Inscricao inscricao, Integer vagasOcupadas, Function<String, String> fotoPerfilResolver) {
        ProjetoResponse projeto = null;
        if (inscricao.getProjeto() != null) {
            projeto = vagasOcupadas != null
                    ? ProjetoResponse.fromEntity(inscricao.getProjeto(), vagasOcupadas, fotoPerfilResolver)
                    : ProjetoResponse.fromEntity(inscricao.getProjeto(), fotoPerfilResolver);
        }

        return InscricaoResponse.builder()
                .id(inscricao.getId())
                .status(inscricao.getStatus())
                .dataInscricao(inscricao.getDataInscricao())
                .motivacao(inscricao.getMotivacao())
                .parecerOrientador(inscricao.getParecerOrientador())
                .projetoId(inscricao.getProjeto() != null ? inscricao.getProjeto().getId() : null)
                .projetoTitulo(inscricao.getProjeto() != null ? inscricao.getProjeto().getTitulo() : null)
                .projeto(projeto)
                .alunoId(inscricao.getAluno() != null ? inscricao.getAluno().getId() : null)
                .alunoUsuarioId(inscricao.getAluno() != null && inscricao.getAluno().getUsuario() != null ? inscricao.getAluno().getUsuario().getId() : null)
                .alunoNome(inscricao.getAluno() != null && inscricao.getAluno().getUsuario() != null ? inscricao.getAluno().getUsuario().getNome() : null)
                .alunoFotoPerfilUrl(inscricao.getAluno() != null && inscricao.getAluno().getUsuario() != null ? fotoPerfilResolver.apply(inscricao.getAluno().getUsuario().getFotoPerfilUrl()) : null)
                .build();
    }
}
