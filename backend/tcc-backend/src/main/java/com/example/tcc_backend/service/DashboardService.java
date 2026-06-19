package com.example.tcc_backend.service;

import com.example.tcc_backend.dto.response.DashboardResponse;
import com.example.tcc_backend.model.TipoUsuario;
import com.example.tcc_backend.model.Usuario;
import com.example.tcc_backend.repository.ConversaRepository;
import com.example.tcc_backend.repository.DocumentoRepository;
import com.example.tcc_backend.repository.InscricaoRepository;
import com.example.tcc_backend.repository.NotificacaoRepository;
import com.example.tcc_backend.repository.ProjetoRepository;
import com.example.tcc_backend.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AuthHelper authHelper;
    private final ProjetoRepository projetoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final NotificacaoRepository notificacaoRepository;
    private final ConversaRepository conversaRepository;
    private final DocumentoRepository documentoRepository;

    public DashboardResponse getDashboard() {
        Usuario usuario = authHelper.getCurrentUser();

        long minhasInscricoes = usuario.getTipo() == TipoUsuario.ALUNO
                ? inscricaoRepository.findByAlunoUsuarioId(usuario.getId()).size()
                : inscricaoRepository.findByProjetoOrientadorUsuarioId(usuario.getId()).size();

        return DashboardResponse.builder()
                .usuarioId(usuario.getId())
                .nomeUsuario(usuario.getNome())
                .tipoUsuario(usuario.getTipo().name())
                .totalProjetos(projetoRepository.count())
                .meusProjetos(usuario.getTipo() == TipoUsuario.ALUNO
                        ? projetoRepository.findRelacionadosAoUsuario(usuario.getId()).size()
                        : projetoRepository.findByOrientadorUsuarioIdOrAlunoCriadorUsuarioId(usuario.getId(), usuario.getId()).size())
                .minhasInscricoes(minhasInscricoes)
                .inscricoesPendentes(inscricaoRepository.countByProjetoOrientadorUsuarioIdAndStatus(usuario.getId(), com.example.tcc_backend.model.StatusInscricao.PENDENTE))
                .notificacoesNaoLidas(notificacaoRepository.countByUsuarioIdAndLidaFalse(usuario.getId()))
                .conversasAtivas(conversaRepository.findByProjetoOrientadorUsuarioIdOrProjetoAlunoCriadorUsuarioId(usuario.getId(), usuario.getId()).size())
                .documentosEnviados(documentoRepository.countByUsuarioId(usuario.getId()))
                .build();
    }
}
