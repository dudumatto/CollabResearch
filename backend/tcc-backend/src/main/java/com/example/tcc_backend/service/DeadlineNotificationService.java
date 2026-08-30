package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.response.DeadlineNotificationResult;
import com.example.tcc_backend.model.AlertaPrazo;
import com.example.tcc_backend.model.DeadlineNotificationLog;
import com.example.tcc_backend.model.EtapaProgresso;
import com.example.tcc_backend.model.EtapaProgressoStatus;
import com.example.tcc_backend.model.Inscricao;
import com.example.tcc_backend.model.StatusInscricao;
import com.example.tcc_backend.model.TipoNotificacao;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.DeadlineNotificationLogRepository;
import com.example.tcc_backend.repository.EtapaProgressoRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DeadlineNotificationService {

    private static final long DIAS_ALERTA_7 = 7;
    private static final long DIAS_ALERTA_3 = 3;
    private static final long DIAS_ALERTA_1 = 1;

    private final EtapaProgressoRepository etapaProgressoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final DeadlineNotificationLogRepository logRepository;
    private final NotificacaoService notificacaoService;

    @Transactional
    public DeadlineNotificationResult processarAlertasDePrazo() {
        LocalDate hoje = LocalDate.now(ZoneOffset.UTC);
        List<EtapaProgresso> etapas = etapaProgressoRepository.findByPrazoIsNotNull().stream()
                .filter(etapa -> etapa.getStatus() != EtapaProgressoStatus.DONE
                        && etapa.getStatus() != EtapaProgressoStatus.REJECTED)
                .toList();

        long notificacoesCriadas = 0;
        long duplicadosIgnorados = 0;

        for (EtapaProgresso etapa : etapas) {
            AlertaPrazo alerta = identificarAlerta(etapa, hoje);
            if (alerta == null) {
                continue;
            }

            for (Usuario destinatario : destinatariosDaEtapa(etapa)) {
                LocalDate dataReferencia = hoje;
                if (logRepository.existsByEtapaIdAndUsuarioIdAndTipoAndDataReferencia(
                        etapa.getId().longValue(), destinatario.getId(), alerta, dataReferencia)) {
                    duplicadosIgnorados++;
                    continue;
                }

                if (Boolean.FALSE.equals(destinatario.getNotificacoesAtivas())) {
                    continue;
                }

                notificacaoService.criarNotificacao(
                        destinatario.getId(),
                        montarMensagem(etapa, alerta),
                        alerta == AlertaPrazo.OVERDUE ? TipoNotificacao.PRAZO_ATRASADO : TipoNotificacao.PRAZO_PROXIMO,
                        "progress_step",
                        etapa.getId(),
                        "/app/projects",
                        null);

                logRepository.save(DeadlineNotificationLog.builder()
                        .etapa(etapa)
                        .usuario(destinatario)
                        .tipo(alerta)
                        .dataReferencia(dataReferencia)
                        .build());

                notificacoesCriadas++;
            }
        }

        return DeadlineNotificationResult.builder()
                .etapasProcessadas(etapas.size())
                .notificacoesCriadas(notificacoesCriadas)
                .duplicadosIgnorados(duplicadosIgnorados)
                .build();
    }

    private AlertaPrazo identificarAlerta(EtapaProgresso etapa, LocalDate hoje) {
        if (etapa.getPrazo() == null) {
            return null;
        }
        LocalDate prazo = etapa.getPrazo().atZoneSameInstant(ZoneOffset.UTC).toLocalDate();
        long diasFaltantes = prazo.toEpochDay() - hoje.toEpochDay();

        if (diasFaltantes == DIAS_ALERTA_7) {
            return AlertaPrazo.DAYS_7;
        }
        if (diasFaltantes == DIAS_ALERTA_3) {
            return AlertaPrazo.DAYS_3;
        }
        if (diasFaltantes == DIAS_ALERTA_1) {
            return AlertaPrazo.DAYS_1;
        }
        if (diasFaltantes < 0) {
            return AlertaPrazo.OVERDUE;
        }
        return null;
    }

    private Set<Usuario> destinatariosDaEtapa(EtapaProgresso etapa) {
        Set<Usuario> destinatarios = new LinkedHashSet<>();

        if (etapa.getProjeto() != null
                && etapa.getProjeto().getOrientador() != null
                && etapa.getProjeto().getOrientador().getUsuario() != null) {
            destinatarios.add(etapa.getProjeto().getOrientador().getUsuario());
        }

        List<Inscricao> inscricoesAprovadas = inscricaoRepository
                .findByProjetoIdAndStatus(etapa.getProjeto().getId(), StatusInscricao.APROVADO);
        for (Inscricao inscricao : inscricoesAprovadas) {
            if (inscricao.getAluno() != null && inscricao.getAluno().getUsuario() != null) {
                destinatarios.add(inscricao.getAluno().getUsuario());
            }
        }

        if (etapa.getProjeto() != null
                && etapa.getProjeto().getAlunoCriador() != null
                && etapa.getProjeto().getAlunoCriador().getUsuario() != null) {
            destinatarios.add(etapa.getProjeto().getAlunoCriador().getUsuario());
        }

        return destinatarios;
    }

    private String montarMensagem(EtapaProgresso etapa, AlertaPrazo alerta) {
        String titulo = etapa.getTitulo();
        if (alerta == AlertaPrazo.OVERDUE) {
            return "Prazo vencido para a etapa \"" + titulo + "\"";
        }
        long dias = switch (alerta) {
            case DAYS_7 -> 7;
            case DAYS_3 -> 3;
            case DAYS_1 -> 1;
            default -> 0;
        };
        return "Faltam " + dias + " dia(s) para o prazo da etapa \"" + titulo + "\"";
    }
}
