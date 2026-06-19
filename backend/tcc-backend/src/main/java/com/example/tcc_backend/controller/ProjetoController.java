package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.ProjetoRequest;
import com.example.tcc_backend.dto.request.RecrutarColaboradorRequest;
import com.example.tcc_backend.dto.response.InscricaoResponse;
import com.example.tcc_backend.dto.response.PageResponse;
import com.example.tcc_backend.dto.response.ProjetoResponse;
import com.example.tcc_backend.dto.response.UsuarioResponse;
import com.example.tcc_backend.model.StatusProjeto;
import com.example.tcc_backend.service.ProjetoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import java.util.List;

@RestController
@RequestMapping({"/api/projetos", "/api/projects"})
@RequiredArgsConstructor
@Tag(name = "Projetos", description = "Endpoints relacionados à gestão de projetos")
public class ProjetoController {

    private final ProjetoService projetoService;

    @Operation(
            summary = "Listar projetos",
            description = "Retorna uma lista de projetos com possibilidade de filtros por status, área, curso ou busca textual."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos")
    })
    @GetMapping
    public ResponseEntity<List<ProjetoResponse>> findAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer areaId,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String curso,
            @RequestParam(required = false) String course,
            @RequestParam(required = false) String busca) {
        String cursoFiltro = curso != null ? curso : course;

        return ResponseEntity.ok(
                projetoService.findAll(status, areaId, area, cursoFiltro, busca)
                        .stream()
                        .map(ProjetoResponse::fromEntity)
                        .toList()
        );
    }

    @Operation(
            summary = "Listar projetos com paginação",
            description = "Retorna projetos paginados com suporte a filtros e opção de listar apenas projetos do usuário autenticado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista paginada retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos")
    })
    @GetMapping("/pagina")
    public ResponseEntity<PageResponse<ProjetoResponse>> findAllPaginado(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer areaId,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String curso,
            @RequestParam(required = false) String course,
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "false") Boolean meusProjetos,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dataCriacao") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort));
        String cursoFiltro = curso != null ? curso : course;
        String buscaFiltro = busca != null ? busca : search;

        if (Boolean.TRUE.equals(meusProjetos)) {
            return ResponseEntity.ok(PageResponse.from(projetoService.findMeusProjetos(pageable).map(ProjetoResponse::fromEntity)));
        }

        return ResponseEntity.ok(PageResponse.from(
                projetoService.findAll(status, areaId, area, cursoFiltro, buscaFiltro, pageable)
                        .map(ProjetoResponse::fromEntity)
        ));
    }

    @Operation(
            summary = "Buscar projeto por ID",
            description = "Retorna os dados completos de um projeto específico."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Projeto encontrado"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ProjetoResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(ProjetoResponse.fromEntity(projetoService.findById(id)));
    }

    @Operation(
            summary = "Criar projeto",
            description = "Cria um novo projeto no sistema."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Projeto criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @PostMapping
    public ResponseEntity<ProjetoResponse> create(@RequestBody @Valid ProjetoRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ProjetoResponse.fromEntity(projetoService.create(dto)));
    }

    @Operation(
            summary = "Atualizar projeto",
            description = "Atualiza os dados de um projeto existente."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Projeto atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ProjetoResponse> update(@PathVariable Integer id,
                                                  @RequestBody @Valid ProjetoRequest dto) {
        return ResponseEntity.ok(ProjetoResponse.fromEntity(projetoService.update(id, dto)));
    }

    @Operation(
            summary = "Aceitar orientacao",
            description = "Permite que o orientador solicitado aceite um projeto criado por aluno."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Projeto aceito com sucesso"),
            @ApiResponse(responseCode = "403", description = "Usuario nao e o orientador solicitado"),
            @ApiResponse(responseCode = "404", description = "Projeto nao encontrado")
    })
    @PutMapping("/{id}/aceitar-orientacao")
    public ResponseEntity<ProjetoResponse> aceitarOrientacao(@PathVariable Integer id) {
        return ResponseEntity.ok(ProjetoResponse.fromEntity(projetoService.aceitarOrientacao(id)));
    }

    @Operation(
            summary = "Rejeitar orientacao",
            description = "Permite que o orientador solicitado recuse um projeto criado por aluno."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Projeto recusado com sucesso"),
            @ApiResponse(responseCode = "403", description = "Usuario nao e o orientador solicitado"),
            @ApiResponse(responseCode = "404", description = "Projeto nao encontrado")
    })
    @PutMapping("/{id}/rejeitar-orientacao")
    public ResponseEntity<ProjetoResponse> rejeitarOrientacao(@PathVariable Integer id) {
        return ResponseEntity.ok(ProjetoResponse.fromEntity(projetoService.rejeitarOrientacao(id)));
    }

    @Operation(
            summary = "Deletar projeto",
            description = "Remove um projeto do sistema."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Projeto removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        projetoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Recrutar colaborador",
            description = "Adiciona um usuário como colaborador em um projeto."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Colaborador adicionado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Projeto ou usuário não encontrado")
    })
    @PostMapping("/{id}/recrutar")
    public ResponseEntity<InscricaoResponse> recrutar(@PathVariable Integer id,
                                                      @RequestBody @Valid RecrutarColaboradorRequest dto) {
        return ResponseEntity.ok(
                InscricaoResponse.fromEntity(projetoService.recrutar(id, dto.getUsuarioId()))
        );
    }

    @Operation(
            summary = "Listar colaboradores do projeto",
            description = "Retorna todos os usuários associados como colaboradores de um projeto."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Colaboradores retornados com sucesso"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    @GetMapping("/{id}/colaboradores")
    public ResponseEntity<List<UsuarioResponse>> listarColaboradores(@PathVariable Integer id) {
        return ResponseEntity.ok(
                projetoService.listarColaboradores(id).stream()
                        .map(UsuarioResponse::fromEntity)
                        .toList()
        );
    }

    @Operation(
            summary = "Remover colaborador",
            description = "Remove um usuário da lista de colaboradores de um projeto."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Colaborador removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Projeto ou usuário não encontrado")
    })
    @DeleteMapping("/{id}/colaboradores/{usuarioId}")
    public ResponseEntity<Void> removerColaborador(@PathVariable Integer id,
                                                   @PathVariable Integer usuarioId) {
        projetoService.removerColaborador(id, usuarioId);
        return ResponseEntity.noContent().build();
    }
}
