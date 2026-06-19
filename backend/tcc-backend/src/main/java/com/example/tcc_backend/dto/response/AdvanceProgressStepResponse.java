package com.example.tcc_backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdvanceProgressStepResponse {
    private ProgressStepResponse step;
    private Integer overallPercent;
}
