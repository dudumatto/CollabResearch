package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.response.AuditoriaResponse;
import com.example.tcc_backend.dto.response.PageResponse;
import com.example.tcc_backend.model.AuditoriaEvento;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.AuditoriaEventoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminAuditService {

    private final AuditoriaEventoRepository auditoriaEventoRepository;
    private final AdminAccessService accessService;

    public void record(String acao, String recurso, Integer recursoId, String descricao) {
        Usuario admin = accessService.requireAdmin();
        auditoriaEventoRepository.save(AuditoriaEvento.builder()
                .admin(admin)
                .acao(acao)
                .recurso(recurso)
                .recursoId(recursoId)
                .descricao(descricao)
                .build());
    }

    public PageResponse<AuditoriaResponse> list(int page, int size) {
        accessService.requireAdmin();
        validatePage(page, size);
        return PageResponse.from(
                auditoriaEventoRepository.findAll(
                        PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "dataEvento"))
                ).map(AuditoriaResponse::fromEntity)
        );
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paginacao invalida");
        }
    }
}
