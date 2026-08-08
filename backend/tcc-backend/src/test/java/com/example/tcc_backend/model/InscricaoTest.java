package com.example.tcc_backend.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InscricaoTest {

    @Test
    void prePersistDevePreservarStatusExplicito() {
        Inscricao inscricao = Inscricao.builder()
                .status(StatusInscricao.APROVADO)
                .build();

        inscricao.prePersist();

        assertThat(inscricao.getStatus()).isEqualTo(StatusInscricao.APROVADO);
        assertThat(inscricao.getDataInscricao()).isNotNull();
    }

    @Test
    void prePersistDeveUsarPendenteQuandoStatusForNulo() {
        Inscricao inscricao = Inscricao.builder().build();

        inscricao.prePersist();

        assertThat(inscricao.getStatus()).isEqualTo(StatusInscricao.PENDENTE);
    }
}
