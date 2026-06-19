import { api } from "./api";

export const WS_DESTINATIONS = {
  enviarMensagem:  (id) => `/app/conversa/${id}/mensagem`,
  editarMensagem:  (id) => `/app/conversa/${id}/editar`,
  excluirMensagem: (id) => `/app/conversa/${id}/excluir`,
};

export const WS_TOPICS = {
  mensagens:    (id) => `/topic/conversa/${id}`,
  atualizacoes: (id) => `/topic/conversa/${id}/atualiza`,
  notificacoes: ()   => `/user/queue/notificacoes`,
};

export const conversationService = {
  listByUser(userId) {
    return api.get(`/api/conversas/${userId}/todas`);
  },

  openPrivate(outroUsuarioId) {
    return api.post(`/api/conversas/privada/${outroUsuarioId}`);
  },

  listMessages(conversationId) {
    return api.get(`/api/conversas/${conversationId}/mensagens`);
  },
  abrirOuCriarPorProjeto(projetoId) {
    return api.post(`/api/conversas/projeto/${projetoId}/abrir`);
  },
  // Fallback HTTP
  sendMessage(conversationId, conteudo) {
    return api.post(`/api/conversas/${conversationId}/mensagem`, { conteudo });
  },

  editMessage(mensagemId, conteudo) {
    return api.put(`/api/conversas/mensagem/${mensagemId}`, { conteudo });
  },
  
  deleteMessage(mensagemId) {
    return api.delete(`/api/conversas/mensagem/${mensagemId}`);
  },
};