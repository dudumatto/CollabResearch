package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.request.AdminAreaRequest;
import com.example.tcc_backend.dto.request.AdminConfiguracaoRequest;
import com.example.tcc_backend.dto.response.AdminAreaResponse;
import com.example.tcc_backend.dto.response.ConfiguracaoResponse;
import com.example.tcc_backend.model.AreaPesquisa;
import com.example.tcc_backend.model.ConfiguracaoSistema;
import com.example.tcc_backend.model.Curso;
import com.example.tcc_backend.repository.AreaPesquisaRepository;
import com.example.tcc_backend.repository.ConfiguracaoSistemaRepository;
import com.example.tcc_backend.repository.CursoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminCatalogService {

    private static final Map<String, String> SETTINGS = Map.of(
            "nomeInstituicao", "Nome exibido da instituicao",
            "emailSuporte", "Email de contato administrativo",
            "permiteNovasInscricoes", "Permite novas inscricoes em oportunidades",
            "diasRetencaoAuditoria", "Periodo de retencao de auditoria em dias"
    );

    private final AreaPesquisaRepository areaRepository;
    private final CursoRepository cursoRepository;
    private final ConfiguracaoSistemaRepository configuracaoRepository;
    private final AdminAccessService accessService;
    private final AdminAuditService auditService;

    public List<AdminAreaResponse> listAreas() {
        accessService.requireAdmin();
        return areaRepository.findAll(Sort.by("nome")).stream().map(AdminAreaResponse::fromEntity).toList();
    }

    @Transactional
    public AdminAreaResponse createArea(AdminAreaRequest dto) {
        accessService.requireAdmin();
        String nome = dto.getNome().trim();
        if (areaRepository.existsByNomeIgnoreCase(nome)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Area ja cadastrada");
        }
        AreaPesquisa area = areaRepository.save(AreaPesquisa.builder()
                .nome(nome)
                .curso(getCurso(dto.getCursoId()))
                .build());
        auditService.record("CRIAR", "AREA", area.getId(), nome);
        return AdminAreaResponse.fromEntity(area);
    }

    @Transactional
    public AdminAreaResponse updateArea(Integer id, AdminAreaRequest dto) {
        accessService.requireAdmin();
        AreaPesquisa area = areaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Area nao encontrada"));
        String nome = dto.getNome().trim();
        if (!area.getNome().equalsIgnoreCase(nome) && areaRepository.existsByNomeIgnoreCase(nome)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Area ja cadastrada");
        }
        area.setNome(nome);
        area.setCurso(getCurso(dto.getCursoId()));
        areaRepository.save(area);
        auditService.record("ATUALIZAR", "AREA", id, nome);
        return AdminAreaResponse.fromEntity(area);
    }

    @Transactional
    public void deleteArea(Integer id) {
        accessService.requireAdmin();
        AreaPesquisa area = areaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Area nao encontrada"));
        areaRepository.delete(area);
        auditService.record("REMOVER", "AREA", id, area.getNome());
    }

    @Transactional
    public List<ConfiguracaoResponse> listSettings() {
        accessService.requireAdmin();
        SETTINGS.forEach((key, description) -> configuracaoRepository.findByChave(key)
                .orElseGet(() -> configuracaoRepository.save(ConfiguracaoSistema.builder()
                        .chave(key)
                        .valor(defaultValue(key))
                        .descricao(description)
                        .build())));
        return configuracaoRepository.findAll(Sort.by("chave")).stream()
                .map(ConfiguracaoResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ConfiguracaoResponse updateSetting(String key, AdminConfiguracaoRequest dto) {
        accessService.requireAdmin();
        if (!SETTINGS.containsKey(key)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Configuracao nao permitida");
        }
        ConfiguracaoSistema setting = configuracaoRepository.findByChave(key)
                .orElseGet(() -> ConfiguracaoSistema.builder().chave(key).build());
        setting.setValor(dto.getValor().trim());
        setting.setDescricao(dto.getDescricao() == null || dto.getDescricao().isBlank()
                ? SETTINGS.get(key)
                : dto.getDescricao().trim());
        configuracaoRepository.save(setting);
        auditService.record("ATUALIZAR", "CONFIGURACAO", setting.getId(), key);
        return ConfiguracaoResponse.fromEntity(setting);
    }

    private Curso getCurso(Integer id) {
        return id == null ? null : cursoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Curso nao encontrado"));
    }

    private String defaultValue(String key) {
        return switch (key) {
            case "nomeInstituicao" -> "CollabResearch";
            case "permiteNovasInscricoes" -> "true";
            case "diasRetencaoAuditoria" -> "365";
            default -> "";
        };
    }
}
