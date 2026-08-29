package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.UsuarioPreferenciasRequest;
import com.example.tcc_backend.dto.request.UsuarioRequest;
import com.example.tcc_backend.dto.response.DocumentoResponse;
import com.example.tcc_backend.dto.response.InscricaoResponse;
import com.example.tcc_backend.dto.response.PageResponse;
import com.example.tcc_backend.dto.response.ProjetoResponse;
import com.example.tcc_backend.dto.response.UsuarioProfileResponse;
import com.example.tcc_backend.dto.response.UsuarioResponse;
import com.example.tcc_backend.service.DocumentoService;
import com.example.tcc_backend.service.InscricaoService;
import com.example.tcc_backend.service.ProjetoService;
import com.example.tcc_backend.service.UsuarioService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuários", description = "Endpoints relacionados aos usuários do sistema")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final ProjetoService projetoService;
    private final DocumentoService documentoService;
    private final InscricaoService inscricaoService;

    private ProjetoResponse projetoResponse(com.example.tcc_backend.model.Projeto projeto) {
        return ProjetoResponse.fromEntity(projeto, projetoService.contarVagasOcupadas(projeto.getId()), usuarioService::resolverFotoPerfilParaExibicao);
    }

    private InscricaoResponse inscricaoResponse(com.example.tcc_backend.model.Inscricao inscricao) {
        Integer projetoId = inscricao.getProjeto() != null ? inscricao.getProjeto().getId() : null;
        Integer vagasOcupadas = projetoId != null ? projetoService.contarVagasOcupadas(projetoId) : null;
        return InscricaoResponse.fromEntity(inscricao, vagasOcupadas);
    }

    private UsuarioResponse usuarioResponse(com.example.tcc_backend.model.Usuario usuario) {
        return UsuarioResponse.fromEntity(usuario, usuarioService::resolverFotoPerfilParaExibicao);
    }

    @Operation(
            summary = "Listar todos os usuários",
            description = "Retorna uma lista completa de usuários cadastrados no sistema."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @GetMapping
    public ResponseEntity<List<UsuarioResponse>> findAll() {
        return ResponseEntity.ok(
                usuarioService.findAll().stream()
                        .map(this::usuarioResponse)
                        .toList()
        );
    }

    @Operation(
            summary = "Listar usuários com paginação",
            description = "Retorna uma lista paginada de usuários com controle de página, tamanho e ordenação."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista paginada retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos")
    })
    @GetMapping("/pagina")
    public ResponseEntity<PageResponse<UsuarioResponse>> findAllPaginado(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sort,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(
                PageResponse.from(
                        usuarioService.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort)))
                                .map(this::usuarioResponse)
                )
        );
    }

    @Operation(
            summary = "Listar orientadores ativos",
            description = "Retorna os orientadores ativos para selecao em projetos criados por alunos."
    )
    @ApiResponse(responseCode = "200", description = "Orientadores retornados com sucesso")
    @GetMapping("/orientadores")
    public ResponseEntity<List<UsuarioResponse>> findOrientadores() {
        return ResponseEntity.ok(
                usuarioService.findOrientadoresAtivos().stream()
                        .map(this::usuarioResponse)
                        .toList()
        );
    }

    @Operation(
            summary = "Obter perfil do usuário autenticado",
            description = "Retorna os dados do usuário atualmente autenticado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil retornado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado")
    })
    @GetMapping("/me")
    public ResponseEntity<UsuarioProfileResponse> me() {
        return ResponseEntity.ok(usuarioService.me());
    }

    @Operation(
            summary = "Atualizar preferencias do usuario",
            description = "Atualiza as preferencias do usuario autenticado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Preferencias atualizadas com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos")
    })
    @PutMapping("/me/preferencias")
    public ResponseEntity<UsuarioProfileResponse> updatePreferencias(@RequestBody @Valid UsuarioPreferenciasRequest dto) {
        return ResponseEntity.ok(usuarioService.updatePreferencias(dto));
    }

    @Operation(
            summary = "Atualizar foto de perfil",
            description = "Envia uma imagem JPG ou PNG de ate 2 MB para o armazenamento e atualiza a URL no perfil."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Foto atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Imagem invalida"),
            @ApiResponse(responseCode = "413", description = "Imagem muito grande")
    })
    @PostMapping(value = "/me/foto-perfil", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UsuarioProfileResponse> updateFotoPerfil(@RequestPart("arquivo") MultipartFile arquivo) {
        return ResponseEntity.ok(usuarioService.atualizarFotoPerfil(arquivo));
    }

    @Operation(
            summary = "Buscar usuário por ID",
            description = "Retorna um usuário específico com base no ID informado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuário encontrado"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado"),
            @ApiResponse(responseCode = "400", description = "ID inválido")
    })
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(usuarioResponse(usuarioService.findById(id)));
    }

    @Operation(
            summary = "Buscar perfil completo por ID",
            description = "Retorna o perfil completo de um usuário específico."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil retornado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @GetMapping("/{id}/perfil")
    public ResponseEntity<UsuarioProfileResponse> findProfileById(@PathVariable Integer id) {
        return ResponseEntity.ok(usuarioService.findProfileById(id));
    }

    @Operation(
            summary = "Atualizar usuário",
            description = "Atualiza os dados de um usuário existente com base no ID."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuário atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponse> update(@PathVariable Integer id,
                                                  @RequestBody @Valid UsuarioRequest dto) {
        return ResponseEntity.ok(usuarioResponse(usuarioService.update(id, dto)));
    }

    @Operation(
            summary = "Deletar usuário",
            description = "Remove permanentemente um usuário do sistema."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Usuário removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        usuarioService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Listar projetos do usuário",
            description = "Retorna todos os projetos associados a um usuário específico."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Projetos retornados com sucesso"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @GetMapping("/{id}/projetos")
    public ResponseEntity<List<ProjetoResponse>> findProjetosByUsuario(@PathVariable Integer id) {
        return ResponseEntity.ok(usuarioService.findProjetosByUsuario(id)
                .stream().map(this::projetoResponse).toList());
    }

    @Operation(
            summary = "Listar inscrições do usuário",
            description = "Retorna todas as inscrições realizadas por um usuário específico."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inscrições retornadas com sucesso"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @GetMapping("/{id}/inscricoes")
    public ResponseEntity<List<InscricaoResponse>> findInscricoesByUsuario(@PathVariable Integer id) {
        return ResponseEntity.ok(usuarioService.findInscricoesByUsuario(id)
                .stream().map(this::inscricaoResponse).toList());
    }

    @Operation(
            summary = "Listar minhas inscrições",
            description = "Retorna as inscrições do usuário autenticado. Para alunos, lista as inscrições vinculadas ao perfil de aluno; para orientadores e demais perfis, retorna lista vazia."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inscrições retornadas com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado")
    })
    @GetMapping("/minhas-inscricoes")
    public ResponseEntity<List<InscricaoResponse>> findMinhasInscricoes() {
        return ResponseEntity.ok(inscricaoService.findByUsuarioLogado()
                .stream().map(this::inscricaoResponse).toList());
    }

    @Operation(
            summary = "Listar documentos do usuário",
            description = "Retorna todos os documentos associados a um usuário específico."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Documentos retornados com sucesso"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @GetMapping("/{id}/documentos")
    public ResponseEntity<List<DocumentoResponse>> findDocumentosByUsuario(@PathVariable Integer id) {
        return ResponseEntity.ok(
                documentoService.listarPorUsuario(id).stream()
                        .map(DocumentoResponse::fromEntity)
                        .toList()
        );
    }
}
