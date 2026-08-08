package com.example.tcc_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeadlineNotificationResult {

    private long etapasProcessadas;
    private long notificacoesCriadas;
    private long duplicadosIgnorados;
}
