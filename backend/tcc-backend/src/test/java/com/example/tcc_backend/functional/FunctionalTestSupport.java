package com.example.tcc_backend.functional;

import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.AlunoRepository;
import com.example.tcc_backend.repository.OrientadorRepository;
import com.example.tcc_backend.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class FunctionalTestSupport {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected JdbcTemplate jdbc;

    @Autowired
    protected UsuarioRepository usuarioRepository;

    @Autowired
    protected AlunoRepository alunoRepository;

    @Autowired
    protected OrientadorRepository orientadorRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    private DatabaseCleanup databaseCleanup;

    @AfterEach
    void cleanupDatabase() {
        if (databaseCleanup == null) {
            databaseCleanup = new DatabaseCleanup(jdbc);
        }
        databaseCleanup.truncateAll();
    }

    protected String authHeader(String token) {
        return "Bearer " + token;
    }

    protected record TestUser(Integer userId, Integer profileId, String email, String password, String token) {}

    // ── Auth helpers ─────────────────────────────────────────────

    protected TestUser registerAluno(String suffix) throws Exception {
        String email = "aluno-" + suffix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@teste.com";
        String senha = "Senha123!";
        String ra = "RA" + UUID.randomUUID().toString().substring(0, 6);

        String body = objectMapper.writeValueAsString(Map.of(
                "nome", "Aluno " + suffix,
                "email", email,
                "senha", senha,
                "tipo", TipoUsuario.ALUNO,
                "ra", ra
        ));

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = json.get("token").asText();
        Integer userId = json.get("usuario").get("id").asInt();

        return new TestUser(userId, null, email, senha, token);
    }

    protected TestUser registerOrientador(String suffix) throws Exception {
        String email = "orientador-" + suffix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@teste.com";
        String senha = "Senha123!";

        String body = objectMapper.writeValueAsString(Map.of(
                "nome", "Orientador " + suffix,
                "email", email,
                "senha", senha,
                "tipo", TipoUsuario.ORIENTADOR,
                "departamento", "Computacao",
                "titulacao", "Doutor"
        ));

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = json.get("token").asText();
        Integer userId = json.get("usuario").get("id").asInt();

        return new TestUser(userId, null, email, senha, token);
    }

    protected TestUser createAdminAndLogin() throws Exception {
        String email = "admin-" + UUID.randomUUID().toString().substring(0, 8) + "@teste.com";
        String senha = "Admin123!";

        Usuario admin = Usuario.builder()
                .nome("Admin Teste")
                .email(email)
                .senha(passwordEncoder.encode(senha))
                .tipo(TipoUsuario.ADMIN)
                .tema("sistema")
                .notificacoesAtivas(true)
                .build();
        usuarioRepository.save(admin);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "senha", senha
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = json.get("token").asText();

        return new TestUser(admin.getId(), null, email, senha, token);
    }

    protected TestUser login(String email, String senha) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "senha", senha
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = json.get("token").asText();
        Integer userId = json.get("usuario").get("id").asInt();

        return new TestUser(userId, null, email, senha, token);
    }

    // ── DB setup helpers ─────────────────────────────────────────

    protected Integer createCurso(String nome) throws Exception {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO curso (nome) VALUES (?)", Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, nome);
            return ps;
        }, keyHolder);
        return keyHolder.getKey().intValue();
    }

    protected Integer createArea(String nome, Integer cursoId) throws Exception {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        if (cursoId != null) {
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO area_pesquisa (nome, id_curso) VALUES (?, ?)", Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, nome);
                ps.setInt(2, cursoId);
                return ps;
            }, keyHolder);
        } else {
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO area_pesquisa (nome) VALUES (?)", Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, nome);
                return ps;
            }, keyHolder);
        }
        return keyHolder.getKey().intValue();
    }

    // ── API helpers ──────────────────────────────────────────────

    protected Integer createProjetoAsOrientador(String token, String titulo, Integer areaId) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "titulo", titulo,
                "descricao", "Descricao do projeto",
                "requisitos", "Java",
                "vagas", 5,
                "areaId", areaId
        ));

        MvcResult result = mockMvc.perform(post("/api/projetos")
                        .header("Authorization", authHeader(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asInt();
    }

    protected Integer inscreverAluno(String token, Integer projetoId) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "projetoId", projetoId,
                "motivacao", "Quero participar deste projeto"
        ));

        MvcResult result = mockMvc.perform(post("/api/inscricoes")
                        .header("Authorization", authHeader(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asInt();
    }

    protected void aprovarInscricao(String token, Integer inscricaoId) throws Exception {
        mockMvc.perform(put("/api/inscricoes/" + inscricaoId + "/aprovar")
                        .header("Authorization", authHeader(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "parecerOrientador", "Aprovado"
                        ))))
                .andExpect(status().isOk());
    }

    protected void rejeitarInscricao(String token, Integer inscricaoId) throws Exception {
        mockMvc.perform(put("/api/inscricoes/" + inscricaoId + "/rejeitar")
                        .header("Authorization", authHeader(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "parecerOrientador", "Rejeitado"
                        ))))
                .andExpect(status().isOk());
    }

    protected Integer criarConversa(String token, Integer projetoId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/conversas")
                        .header("Authorization", authHeader(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("projetoId", projetoId))))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asInt();
    }

    protected Integer enviarMensagem(String token, Integer conversaId, String conteudo) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/conversas/" + conversaId + "/mensagem")
                        .header("Authorization", authHeader(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("conteudo", conteudo))))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asInt();
    }

    protected Integer uploadDocumento(String token, Integer usuarioId, String tipo, String url) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/documentos/upload")
                        .header("Authorization", authHeader(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "usuarioId", usuarioId,
                                "tipo", tipo,
                                "nomeArquivo", "documento-teste.pdf",
                                "url", url
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asInt();
    }

    protected Integer criarProgresso(String token, Integer projetoId, String titulo) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/projetos/" + projetoId + "/progresso")
                        .header("Authorization", authHeader(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "titulo", titulo,
                                "descricao", "Descricao do progresso",
                                "tipo", "ATUALIZACAO"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asInt();
    }
}
