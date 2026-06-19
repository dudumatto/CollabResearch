package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.ChangePasswordRequest;
import com.example.tcc_backend.dto.request.LoginRequest;
import com.example.tcc_backend.dto.request.RegisterRequest;
import com.example.tcc_backend.dto.response.AuthResponse;
import com.example.tcc_backend.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação", description = "Endpoints de autenticação e controle de acesso")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @Operation(summary = "Registrar usuário", description = "Cria uma nova conta no sistema.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuário registrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest dto) {
        return ResponseEntity.ok(service.register(dto));
    }

    @Operation(summary = "Login", description = "Autentica o usuário e retorna token de acesso.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Credenciais inválidas")
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest dto) {
        return ResponseEntity.ok(service.login(dto));
    }

    @Operation(summary = "Alterar senha", description = "Permite ao usuário alterar sua senha.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Senha alterada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos")
    })
    @PutMapping("/senha")
    public ResponseEntity<Void> changePassword(@RequestBody @Valid ChangePasswordRequest dto) {
        service.changePassword(dto);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Logout", description = "Encerra a sessão do usuário.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Logout realizado com sucesso")
    })
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.logout(authorization));
    }
}
