package com.example.tcc_backend.security;

import com.example.tcc_backend.model.Projeto;
import com.example.tcc_backend.model.StatusInscricao;
import com.example.tcc_backend.model.StatusProjeto;
import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.InscricaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@RequiredArgsConstructor
public class ProjectAccessPolicy {

    public enum Relationship {
        RESPONSIBLE_ADVISOR,
        STUDENT_CREATOR,
        APPROVED_MEMBER,
        EXTERNAL,
        ADMIN_AUDITOR
    }

    private final InscricaoRepository inscricaoRepository;

    public Relationship relationship(Projeto projeto, Usuario usuario) {
        if (usuario.getTipo() == TipoUsuario.ADMIN) {
            return Relationship.ADMIN_AUDITOR;
        }
        if (usuario.getTipo() == TipoUsuario.ORIENTADOR
                && projeto.getOrientador() != null
                && projeto.getOrientador().getUsuario().getId().equals(usuario.getId())
                && hasAcceptedAdvisor(projeto)) {
            return Relationship.RESPONSIBLE_ADVISOR;
        }
        if (projeto.getAlunoCriador() != null
                && projeto.getAlunoCriador().getUsuario().getId().equals(usuario.getId())) {
            return Relationship.STUDENT_CREATOR;
        }
        if (inscricaoRepository.existsByProjetoIdAndAlunoUsuarioIdAndStatus(
                projeto.getId(), usuario.getId(), StatusInscricao.APROVADO)) {
            return Relationship.APPROVED_MEMBER;
        }
        return Relationship.EXTERNAL;
    }

    public void requireCanViewTeam(Projeto projeto, Usuario usuario) {
        if (relationship(projeto, usuario) == Relationship.EXTERNAL) {
            throw forbidden("Sem permissao para consultar a equipe deste projeto");
        }
    }

    public void requireCanViewApplications(Projeto projeto, Usuario usuario) {
        Relationship relationship = relationship(projeto, usuario);
        if (relationship != Relationship.RESPONSIBLE_ADVISOR
                && relationship != Relationship.ADMIN_AUDITOR) {
            throw forbidden("Sem permissao para consultar as inscricoes deste projeto");
        }
    }

    public void requireResponsibleAdvisor(Projeto projeto, Usuario usuario) {
        if (relationship(projeto, usuario) != Relationship.RESPONSIBLE_ADVISOR) {
            throw forbidden("Apenas o orientador responsavel pode executar esta acao");
        }
    }

    public void requireCanViewDeliveries(Projeto projeto, Usuario usuario) {
        Relationship relationship = relationship(projeto, usuario);
        if (relationship != Relationship.RESPONSIBLE_ADVISOR
                && relationship != Relationship.STUDENT_CREATOR
                && relationship != Relationship.APPROVED_MEMBER) {
            throw forbidden("Sem permissao para acessar as entregas deste projeto");
        }
    }

    public void requireTeamMember(Projeto projeto, Usuario usuario) {
        Relationship relationship = relationship(projeto, usuario);
        if (relationship != Relationship.RESPONSIBLE_ADVISOR
                && relationship != Relationship.STUDENT_CREATOR
                && relationship != Relationship.APPROVED_MEMBER) {
            throw forbidden("Usuario nao participa do projeto");
        }
    }

    public void requireCanViewEvaluation(Projeto projeto, Usuario usuario, Integer alunoUsuarioId) {
        Relationship relationship = relationship(projeto, usuario);
        boolean eAlunoAvaliado = alunoUsuarioId != null && alunoUsuarioId.equals(usuario.getId());
        if (relationship != Relationship.RESPONSIBLE_ADVISOR
                && relationship != Relationship.ADMIN_AUDITOR
                && !eAlunoAvaliado) {
            throw forbidden("Sem permissao para visualizar a avaliacao");
        }
    }

    public void requireCanRegisterAcknowledge(Projeto projeto, Usuario usuario, Integer alunoUsuarioId) {
        boolean eAlunoAvaliado = alunoUsuarioId != null && alunoUsuarioId.equals(usuario.getId());
        if (!eAlunoAvaliado) {
            throw forbidden("Somente o aluno avaliado pode registrar ciencia da avaliacao");
        }
    }

    private ResponseStatusException forbidden(String message) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }

    private boolean hasAcceptedAdvisor(Projeto projeto) {
        return projeto.getStatus() != StatusProjeto.PENDENTE_ORIENTADOR
                && projeto.getStatus() != StatusProjeto.REJEITADO_ORIENTADOR;
    }
}
