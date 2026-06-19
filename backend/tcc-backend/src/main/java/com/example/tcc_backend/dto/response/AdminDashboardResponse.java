package com.example.tcc_backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminDashboardResponse {
    private long totalUsuarios;
    private long usuariosAtivos;
    private long totalAlunos;
    private long totalOrientadores;
    private long totalAdministradores;
    private long totalProjetos;
    private long projetosAbertos;
    private long inscricoesPendentes;
    private long documentosEmAnalise;
    private List<AuditoriaResponse> atividadesRecentes;
}
