package com.example.tcc_backend.security;

import com.example.tcc_backend.model.Projeto;
import com.example.tcc_backend.model.StatusInscricao;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectAccessPolicyTest {

    @Mock
    private InscricaoRepository inscricaoRepository;

    private ProjectAccessPolicy policy;
    private Projeto projeto;

    @BeforeEach
    void setUp() {
        policy = new ProjectAccessPolicy(inscricaoRepository);
        projeto = TestDataFactory.projetoComOrientador(
                10,
                TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2))
        );
        projeto.setAlunoCriador(TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)));
    }

    @Test
    void deveClassificarTodosOsRelacionamentos() {
        Usuario membro = TestDataFactory.usuarioAluno(3);
        when(inscricaoRepository.existsByProjetoIdAndAlunoUsuarioIdAndStatus(10, 3, StatusInscricao.APROVADO))
                .thenReturn(true);

        assertThat(policy.relationship(projeto, TestDataFactory.usuarioOrientador(2)))
                .isEqualTo(ProjectAccessPolicy.Relationship.RESPONSIBLE_ADVISOR);
        assertThat(policy.relationship(projeto, TestDataFactory.usuarioAluno(1)))
                .isEqualTo(ProjectAccessPolicy.Relationship.STUDENT_CREATOR);
        assertThat(policy.relationship(projeto, membro))
                .isEqualTo(ProjectAccessPolicy.Relationship.APPROVED_MEMBER);
        assertThat(policy.relationship(projeto, TestDataFactory.usuarioAluno(9)))
                .isEqualTo(ProjectAccessPolicy.Relationship.EXTERNAL);
        assertThat(policy.relationship(projeto, TestDataFactory.usuarioAdmin(8)))
                .isEqualTo(ProjectAccessPolicy.Relationship.ADMIN_AUDITOR);
    }

    @Test
    void equipeDeveSerVisivelParaVinculadosEAdminMasNaoExterno() {
        Usuario membro = TestDataFactory.usuarioAluno(3);
        when(inscricaoRepository.existsByProjetoIdAndAlunoUsuarioIdAndStatus(10, 3, StatusInscricao.APROVADO))
                .thenReturn(true);

        assertThatCode(() -> policy.requireCanViewTeam(projeto, membro)).doesNotThrowAnyException();
        assertThatCode(() -> policy.requireCanViewTeam(projeto, TestDataFactory.usuarioAdmin(8))).doesNotThrowAnyException();
        assertThatThrownBy(() -> policy.requireCanViewTeam(projeto, TestDataFactory.usuarioAluno(9)))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void inscricoesDoProjetoDevemSerVisiveisSomenteParaOrientadorResponsavelEAdmin() {
        assertThatCode(() -> policy.requireCanViewApplications(projeto, TestDataFactory.usuarioOrientador(2)))
                .doesNotThrowAnyException();
        assertThatCode(() -> policy.requireCanViewApplications(projeto, TestDataFactory.usuarioAdmin(8)))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> policy.requireCanViewApplications(projeto, TestDataFactory.usuarioOrientador(9)))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> policy.requireCanViewApplications(projeto, TestDataFactory.usuarioAluno(1)))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void acaoAcademicaDeveSerExclusivaDoOrientadorResponsavel() {
        assertThatCode(() -> policy.requireResponsibleAdvisor(projeto, TestDataFactory.usuarioOrientador(2)))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> policy.requireResponsibleAdvisor(projeto, TestDataFactory.usuarioAluno(2)))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> policy.requireResponsibleAdvisor(projeto, TestDataFactory.usuarioOrientador(9)))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> policy.requireResponsibleAdvisor(projeto, TestDataFactory.usuarioAdmin(8)))
                .isInstanceOf(ResponseStatusException.class);
    }
}
