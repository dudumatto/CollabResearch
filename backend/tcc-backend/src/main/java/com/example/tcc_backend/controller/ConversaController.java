package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.ConversaRequest;
import com.example.tcc_backend.dto.request.MensagemRequest;
import com.example.tcc_backend.dto.response.ConversaResponse;
import com.example.tcc_backend.dto.response.MensagemResponse;
import com.example.tcc_backend.dto.response.PageResponse;
import com.example.tcc_backend.security.AuthHelper;
import com.example.tcc_backend.service.ConversaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/conversas", "/api/chat/conversations"})
@RequiredArgsConstructor
@Tag(name = "Conversas", description = "Endpoints de mensagens e comunicação entre usuários")
public class ConversaController {

    private final ConversaService conversaService;
    private final AuthHelper authHelper;

    @Operation(summary = "Criar conversa", description = "Cria uma nova conversa vinculada a um projeto.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Conversa criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @PostMapping
    public ResponseEntity<ConversaResponse> criar(@RequestBody @Valid ConversaRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ConversaResponse.fromEntity(
                        conversaService.criar(dto.getProjetoId()),
                        authHelper.getCurrentUser().getId()
                ));
    }

    @Operation(summary = "Abrir ou criar conversa por projeto")
    @PostMapping("/projeto/{projetoId}/abrir")
    public ResponseEntity<ConversaResponse> abrirPorProjeto(@PathVariable Integer projetoId) {
        return ResponseEntity.ok(ConversaResponse.fromEntity(
                conversaService.abrirOuCriarPorProjeto(projetoId),
                authHelper.getCurrentUser().getId()
        ));
    }

    @Operation(summary = "Buscar conversa por projeto")
    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<ConversaResponse> buscarPorProjeto(@PathVariable Integer projetoId) {
        return ResponseEntity.ok(ConversaResponse.fromEntity(
                conversaService.buscarPorProjeto(projetoId),
                authHelper.getCurrentUser().getId()
        ));
    }

    @Operation(summary = "Abrir ou criar conversa privada")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Conversa privada retornada ou criada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @PostMapping("/privada/{outroUsuarioId}")
    public ResponseEntity<ConversaResponse> abrirPrivada(@PathVariable Integer outroUsuarioId) {
        return ResponseEntity.ok(ConversaResponse.fromEntity(
                conversaService.abrirOuCriarPrivada(outroUsuarioId),
                authHelper.getCurrentUser().getId()
        ));
    }

    @Operation(summary = "Listar conversas do usuário (apenas grupo)")
    @GetMapping("/{usuarioId}")
    public ResponseEntity<List<ConversaResponse>> listarConversas(@PathVariable Integer usuarioId) {
        Integer logadoId = authHelper.getCurrentUser().getId();
        return ResponseEntity.ok(
                conversaService.listarConversasDoUsuario(usuarioId)
                        .stream().map(c -> ConversaResponse.fromEntity(c, logadoId)).toList()
        );
    }

    @Operation(summary = "Listar todas as conversas do usuario autenticado")
    @GetMapping
    public ResponseEntity<List<ConversaResponse>> listarMinhasTodas() {
        Integer logadoId = authHelper.getCurrentUser().getId();
        return ResponseEntity.ok(
                conversaService.listarTodasConversasDoUsuario(logadoId)
                        .stream().map(c -> ConversaResponse.fromEntity(c, logadoId)).toList()
        );
    }

    @Operation(summary = "Listar todas as conversas (grupo + privadas)")
    @GetMapping("/{usuarioId}/todas")
    public ResponseEntity<List<ConversaResponse>> listarTodas(@PathVariable Integer usuarioId) {
        Integer logadoId = authHelper.getCurrentUser().getId();
        return ResponseEntity.ok(
                conversaService.listarTodasConversasDoUsuario(usuarioId)
                        .stream().map(c -> ConversaResponse.fromEntity(c, logadoId)).toList()
        );
    }

    @Operation(summary = "Listar conversas paginadas (apenas grupo)")
    @GetMapping("/{usuarioId}/pagina")
    public ResponseEntity<PageResponse<ConversaResponse>> listarConversasPaginadas(
            @PathVariable Integer usuarioId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dataCriacao") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        Integer logadoId = authHelper.getCurrentUser().getId();
        return ResponseEntity.ok(
                PageResponse.from(
                        conversaService.listarConversasDoUsuario(
                                usuarioId,
                                PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort))
                        ).map(c -> ConversaResponse.fromEntity(c, logadoId))
                )
        );
    }

    @Operation(summary = "Listar mensagens de uma conversa")
    @GetMapping({"/{id}/mensagens", "/{id}/messages"})
    public ResponseEntity<List<MensagemResponse>> listarMensagens(@PathVariable Integer id) {
        return ResponseEntity.ok(
                conversaService.listarMensagens(id)
                        .stream().map(MensagemResponse::fromEntity).toList()
        );
    }

    @Operation(summary = "Listar mensagens paginadas")
    @GetMapping({"/{id}/mensagens/pagina", "/{id}/messages/page"})
    public ResponseEntity<PageResponse<MensagemResponse>> listarMensagensPaginadas(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "dataEnvio") String sort,
            @RequestParam(defaultValue = "ASC") String direction) {

        return ResponseEntity.ok(
                PageResponse.from(
                        conversaService.listarMensagens(
                                id,
                                PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort))
                        ).map(MensagemResponse::fromEntity)
                )
        );
    }

    @Operation(summary = "Enviar mensagem")
    @PostMapping({"/{id}/mensagem", "/{id}/messages"})
    public ResponseEntity<MensagemResponse> enviarMensagem(
            @PathVariable Integer id,
            @RequestBody @Valid MensagemRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(MensagemResponse.fromEntity(
                        conversaService.enviarMensagem(id, dto.getConteudo())
                ));
    }

    @Operation(summary = "Editar mensagem", description = "Edita o conteúdo de uma mensagem. Apenas o remetente pode editar.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Mensagem editada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Sem permissão"),
            @ApiResponse(responseCode = "404", description = "Mensagem não encontrada")
    })
    @PutMapping("/mensagem/{mensagemId}")
    public ResponseEntity<MensagemResponse> editarMensagem(
            @PathVariable Integer mensagemId,
            @RequestBody @Valid MensagemRequest dto) {
        return ResponseEntity.ok(
                conversaService.editarMensagem(mensagemId, dto.getConteudo())
        );
    }

    @Operation(summary = "Excluir mensagem", description = "Exclui uma mensagem. Apenas o remetente pode excluir.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Mensagem excluída com sucesso"),
            @ApiResponse(responseCode = "403", description = "Sem permissão"),
            @ApiResponse(responseCode = "404", description = "Mensagem não encontrada")
    })
    @DeleteMapping("/mensagem/{mensagemId}")
    public ResponseEntity<Void> excluirMensagem(@PathVariable Integer mensagemId) {
        conversaService.excluirMensagem(mensagemId);
        return ResponseEntity.noContent().build();
    }
}
