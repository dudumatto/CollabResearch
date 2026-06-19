package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Feedback;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FeedbackResponse {
    private Integer id;
    private Integer nota;
    private String comentario;
    private LocalDateTime dataFeedback;
    private Integer projetoId;
    private Integer avaliadorId;
    private String avaliadorNome;

    public static FeedbackResponse fromEntity(Feedback feedback) {
        return FeedbackResponse.builder()
                .id(feedback.getId())
                .nota(feedback.getNota())
                .comentario(feedback.getComentario())
                .dataFeedback(feedback.getDataFeedback())
                .projetoId(feedback.getProjeto().getId())
                .avaliadorId(feedback.getAvaliador().getId())
                .avaliadorNome(feedback.getAvaliador().getNome())
                .build();
    }
}
