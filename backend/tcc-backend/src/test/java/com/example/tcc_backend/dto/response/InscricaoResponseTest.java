package com.example.tcc_backend.dto.response;

import com.example.tcc_backend.model.Inscricao;
import com.example.tcc_backend.model.Projeto;
import com.example.tcc_backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InscricaoResponseTest {

    @Test
    void fromEntityDeveManterVagasOcupadasNoProjetoAninhado() {
        Projeto projeto = TestDataFactory.projetoComOrientador(
                10,
                TestDataFactory.orientador(2, TestDataFactory.usuarioOrientador(2))
        );
        projeto.setVagas(3);
        Inscricao inscricao = TestDataFactory.inscricaoAprovada(
                5,
                TestDataFactory.aluno(1, TestDataFactory.usuarioAluno(1)),
                projeto
        );

        InscricaoResponse response = InscricaoResponse.fromEntity(inscricao, 2);

        assertThat(response.getProjeto()).isNotNull();
        assertThat(response.getProjeto().getVagas()).isEqualTo(3);
        assertThat(response.getProjeto().getVagasOcupadas()).isEqualTo(2);
    }
}
