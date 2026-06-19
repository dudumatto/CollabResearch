package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.response.AdminDashboardResponse;
import com.example.tcc_backend.dto.response.AdminReportResponse;
import com.example.tcc_backend.dto.response.AuditoriaResponse;
import com.example.tcc_backend.dto.response.PageResponse;
import com.example.tcc_backend.service.AdminAuditService;
import com.example.tcc_backend.service.AdminContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminOverviewController {

    private final AdminContentService contentService;
    private final AdminAuditService auditService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> dashboard() {
        return ResponseEntity.ok(contentService.dashboard());
    }

    @GetMapping("/relatorios/resumo")
    public ResponseEntity<AdminReportResponse> report() {
        return ResponseEntity.ok(contentService.report());
    }

    @GetMapping("/auditoria")
    public ResponseEntity<PageResponse<AuditoriaResponse>> audit(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditService.list(page, size));
    }
}
