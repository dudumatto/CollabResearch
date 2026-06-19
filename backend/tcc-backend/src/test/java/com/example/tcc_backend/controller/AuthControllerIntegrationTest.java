package com.example.tcc_backend.controller;

import com.example.tcc_backend.dto.request.LoginRequest;
import com.example.tcc_backend.dto.request.RegisterRequest;
import com.example.tcc_backend.dto.response.AuthResponse;
import com.example.tcc_backend.service.AuthService;
import com.example.tcc_backend.support.ControllerTestSupport;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerIntegrationTest {

    @Mock
    private AuthService authService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = ControllerTestSupport.buildMockMvc(new AuthController(authService));
    }

    @Test
    void registerDeveRetornarToken() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setNome("Rodrigo");
        request.setEmail("rodrigo@teste.com");
        request.setSenha("12345678");
        request.setRa("12345");

        when(authService.register(any(RegisterRequest.class))).thenReturn(new AuthResponse("jwt-register"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-register"));
    }

    @Test
    void registerDeveValidarBody() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setNome("");
        request.setEmail("invalido");
        request.setSenha("123");
        request.setRa("");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginDeveRetornarToken() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("rodrigo@teste.com");
        request.setSenha("12345678");

        when(authService.login(any(LoginRequest.class))).thenReturn(new AuthResponse("jwt-login"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-login"));
    }

    @Test
    void logoutDeveRetornarMensagem() throws Exception {
        when(authService.logout(any())).thenReturn("Logout realizado com sucesso");

        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(content().string("Logout realizado com sucesso"));
    }
}
