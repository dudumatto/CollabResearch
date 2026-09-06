package com.example.tcc_backend.functional;

import com.example.tcc_backend.model.TipoUsuario;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

public class RegisterRoleEscalationProofTest extends FunctionalTestSupport {

    @Test
    void publicRegisterCanCreateOrientadorAndReachAdvisorEndpoints() throws Exception {
        String email = "orientador-publico-" + UUID.randomUUID().toString().substring(0, 8) + "@teste.com";
        String senha = "Senha123!";

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("nome", "Orientador Público");
        request.put("email", email);
        request.put("senha", senha);
        request.put("tipo", TipoUsuario.ORIENTADOR);
        request.put("departamento", "Computacao");
        request.put("titulacao", "Doutor");

        String requestBody = objectMapper.writeValueAsString(request);
        System.out.println("REQUEST POST /api/auth/register");
        System.out.println(requestBody);

        var registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andReturn();

        String registerBody = registerResult.getResponse().getContentAsString();
        System.out.println("RESPONSE " + registerResult.getResponse().getStatus() + " /api/auth/register");
        System.out.println(registerBody);

        JsonNode registerJson = objectMapper.readTree(registerBody);
        String token = registerJson.get("token").asText();

        var orientadorResult = mockMvc.perform(get("/api/orientador/perfil")
                        .header("Authorization", authHeader(token)))
                .andReturn();

        System.out.println("REQUEST GET /api/orientador/perfil");
        System.out.println("RESPONSE " + orientadorResult.getResponse().getStatus() + " /api/orientador/perfil");
        System.out.println(orientadorResult.getResponse().getContentAsString());

        var adminResult = mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", authHeader(token)))
                .andReturn();

        System.out.println("REQUEST GET /api/admin/dashboard");
        System.out.println("RESPONSE " + adminResult.getResponse().getStatus() + " /api/admin/dashboard");
        System.out.println(adminResult.getResponse().getContentAsString());
    }
}
