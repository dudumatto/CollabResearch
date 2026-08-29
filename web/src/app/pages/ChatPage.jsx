import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Search, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { conversationService } from "../services/conversationService";
import { chatRealtimeService } from "../services/chatRealtimeService";
import { projectService } from "../services/projectService";
import { StatusView } from "../components/StatusView";
import { getUserPhotoUrl, mapProject } from "../utils/adapters";
import "./ChatPage.css";
import { useLocation, useNavigate } from "react-router";

function getInitials(name) {
  if (!name) return "PR";
  return name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function ChatAvatar({ name, src, className }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className={className}>
      {src && !failed ? <img src={src} alt={`Foto de perfil de ${name}`} onError={() => setFailed(true)} /> : <span>{getInitials(name)}</span>}
    </div>
  );
}

function getMessagePhotoUrl(message, currentUser, mine, conversation) {
  const senderPhoto =
    message?.remetenteFotoPerfilUrl ||
    message?.remetente?.fotoPerfilUrl ||
    message?.remetente?.avatarUrl ||
    message?.remetente?.usuario?.fotoPerfilUrl ||
    message?.remetenteProfilePhotoUrl ||
    message?.remetenteImagemPerfilUrl ||
    message?.remetenteFotoUrl ||
    message?.remetenteAvatarUrl ||
    message?.senderPhotoUrl ||
    message?.senderAvatarUrl ||
    message?.authorPhotoUrl ||
    message?.authorAvatarUrl ||
    message?.fotoPerfilUrl ||
    message?.avatarUrl ||
    getUserPhotoUrl(message?.remetente) ||
    getUserPhotoUrl(message?.sender) ||
    getUserPhotoUrl(message?.autor) ||
    getUserPhotoUrl(message?.usuario) ||
    getUserPhotoUrl(message?.user);

  if (senderPhoto) return senderPhoto;
  if (mine) return getUserPhotoUrl(currentUser);

  return conversation?.tipo === "PRIVADA"
    ? getUserPhotoUrl(conversation)
    : "";
}

function getConversationTimestamp(conversation) {
  const value =
    conversation?.ultimaMensagemHorario ||
    conversation?.updatedAt ||
    conversation?.dataAtualizacao ||
    conversation?.createdAt ||
    conversation?.dataCriacao ||
    0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function sortConversations(items) {
  return [...(Array.isArray(items) ? items : [])].sort(
    (a, b) => getConversationTimestamp(b) - getConversationTimestamp(a),
  );
}

function applyConversationRealtimeEvent(items, event) {
  if (event?.tipo !== "MENSAGEM_CRIADA" || !event?.mensagem?.conversaId) {
    return sortConversations(items);
  }

  const conversationId = Number(event.mensagem.conversaId);
  const updated = (Array.isArray(items) ? items : []).map((conversation) => {
    if (Number(conversation.id) !== conversationId) return conversation;

    return {
      ...conversation,
      ultimaMensagem: event.mensagem.conteudo,
      ultimaMensagemHorario: event.mensagem.dataEnvio,
      updatedAt: event.mensagem.dataEnvio,
    };
  });

  return sortConversations(updated);
}

function isIncomingMessage(event, currentUserId) {
  if (event?.tipo !== "MENSAGEM_CRIADA" || !event?.mensagem?.conversaId) return false;
  return Number(event.mensagem.remetenteId) !== Number(currentUserId);
}

function isConversationOpen(conversationId, selectedConversation, showMobileList) {
  const selectedId = Number(selectedConversation?.id);
  const mobileListVisible = typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches &&
    showMobileList;

  return Number(conversationId) === selectedId && !mobileListVisible;
}

async function hydrateConversationPhotos(items, currentUser) {
  const conversations = Array.isArray(items) ? items : [];

  const hydrated = await Promise.all(conversations.map(async (conversation) => {
    const explicitPhoto =
      conversation?.fotoPerfilUrl ||
      conversation?.fotoProjetoUrl ||
      conversation?.projectPhotoUrl ||
      conversation?.avatarUrl ||
      conversation?.outroUsuarioFotoPerfilUrl ||
      conversation?.participanteFotoPerfilUrl ||
      conversation?.ultimoRemetenteFotoPerfilUrl ||
      getUserPhotoUrl(conversation?.participant) ||
      getUserPhotoUrl(conversation?.participante) ||
      getUserPhotoUrl(conversation?.outroUsuario) ||
      "";

    if (explicitPhoto) {
      return { ...conversation, fotoPerfilUrl: explicitPhoto };
    }

    if (conversation?.tipo !== "GRUPO" || !conversation?.projetoId) {
      return conversation;
    }

    try {
      const project = mapProject(await projectService.getById(conversation.projetoId));
      const fallbackPhoto =
        project.coverUrl ||
        getUserPhotoUrl(project.advisor) ||
        getUserPhotoUrl(currentUser);

      return fallbackPhoto
        ? { ...conversation, fotoPerfilUrl: fallbackPhoto }
        : conversation;
    } catch {
      const fallbackPhoto = getUserPhotoUrl(currentUser);
      return fallbackPhoto
        ? { ...conversation, fotoPerfilUrl: fallbackPhoto }
        : conversation;
    }
  }));

  return sortConversations(hydrated);
}

function formatarHora(data) {
  if (!data) return "";

  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarDia(data) {
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "";

  const hoje = new Date();

  const isHoje = d.toDateString() === hoje.toDateString();

  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  const isOntem = d.toDateString() === ontem.toDateString();

  if (isHoje) return "Hoje";
  if (isOntem) return "Ontem";

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ChatPageSkeleton() {
  return (
    <div className="pagina-chat" aria-busy="true">
      <div className="pagina-chat__lista-conversas">
        <div className="pagina-chat__cabecalho-lista">
          <div className="chat-skeleton chat-skeleton--titulo" />
          <div className="chat-skeleton chat-skeleton--busca" />
        </div>
        <div className="pagina-chat__rolagem-conversas">
          {[0, 1, 2, 3, 4].map((item) => (
            <div className="conversa-item conversa-item--skeleton" key={item}>
              <div className="chat-skeleton chat-skeleton--avatar" />
              <div className="conversa-item__info">
                <div className="chat-skeleton chat-skeleton--linha-media" />
                <div className="chat-skeleton chat-skeleton--linha-curta" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pagina-chat__area-conversa pagina-chat__area-conversa--visivel">
        <div className="pagina-chat__topo-conversa">
          <div className="chat-skeleton chat-skeleton--topo" />
        </div>
        <MessageListSkeleton />
        <div className="pagina-chat__area-input">
          <div className="pagina-chat__linha-input">
            <div className="chat-skeleton chat-skeleton--input" />
            <div className="chat-skeleton chat-skeleton--botao" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageListSkeleton() {
  return (
    <div className="pagina-chat__mensagens pagina-chat__mensagens--skeleton">
      <MessageSkeletonRows />
    </div>
  );
}

function MessageSkeletonRows() {
  const rows = [
    { side: "contato", width: "48%" },
    { side: "usuario", width: "38%" },
    { side: "contato", width: "56%" },
    { side: "usuario", width: "44%" },
  ];

  return (
    <>
      <div className="chat-data-divider chat-data-divider--skeleton">
        <span className="chat-skeleton chat-skeleton--data" />
      </div>
      {rows.map((row, index) => (
        <div
          className={`mensagem-linha mensagem-linha--${row.side}`}
          key={`${row.side}-${index}`}
        >
          <div className="bolha-mensagem bolha-mensagem--skeleton" style={{ width: row.width }}>
            {row.side === "contato" && <div className="chat-skeleton chat-skeleton--nome" />}
            <div className="chat-skeleton chat-skeleton--texto" />
            <div className="chat-skeleton chat-skeleton--texto chat-skeleton--texto-menor" />
            <div className="chat-skeleton chat-skeleton--hora" />
          </div>
        </div>
      ))}
    </>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const messagesEndRef = useRef(null);
  const enviandoRef = useRef(false);
  const messageRefs = useRef({});
  const selectedConversationRef = useRef(null);
  const showMobileListRef = useRef(true);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [unreadConversationIds, setUnreadConversationIds] = useState(() => new Set());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [abrindoPrivada, setAbrindoPrivada] = useState(null);
  const [targetMessageId, setTargetMessageId] = useState(null);

  const abrirPerfil = (usuarioId) => {
    if (!usuarioId) return;
    navigate(`/app/users/${usuarioId}`);
  };

  // Modal de edição
  const [modalEdicao, setModalEdicao] = useState(null); // { id, conteudo }
  const [editandoTexto, setEditandoTexto] = useState("");

  // Modal de confirmação de exclusão
  const [modalExclusao, setModalExclusao] = useState(null); // { id }

  const loadConversations = async () => {
    try {
      setLoading(true);
      const result = await conversationService.listByUser(user.id);
      setConversations(await hydrateConversationPhotos(result, user));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.id) loadConversations(); }, [user?.id]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    showMobileListRef.current = showMobileList;
  }, [showMobileList]);

  const markConversationAsRead = useCallback((conversationId) => {
    setUnreadConversationIds((prev) => {
      const normalizedId = Number(conversationId);
      if (!prev.has(normalizedId)) return prev;
      const next = new Set(prev);
      next.delete(normalizedId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (conversations.length === 0) return;
    const params = new URLSearchParams(location.search);
    const targetId =
      location.state?.conversationId ??
      params.get("conversationId") ??
      params.get("conversaId");
    const targetMsgId =
      location.state?.messageId ??
      params.get("messageId") ??
      params.get("mensagemId");
    const target = targetId
      ? conversations.find((conversation) => Number(conversation.id) === Number(targetId))
      : null;
    if (targetId) {
      setSelectedConversation(target ?? conversations[0]);
      markConversationAsRead(target?.id ?? conversations[0]?.id);
      setTargetMessageId(targetMsgId ?? null);
      setShowMobileList(false);
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    if (selectedConversation) return;
    setSelectedConversation(conversations[0]);
    markConversationAsRead(conversations[0]?.id);
  }, [
    conversations,
    selectedConversation,
    location.state?.conversationId,
    location.state?.messageId,
    location.search,
    location.pathname,
    navigate,
    markConversationAsRead,
  ]);

  useEffect(() => {
    if (!selectedConversation?.id) return;
    const updated = conversations.find((conversation) => Number(conversation.id) === Number(selectedConversation.id));
    if (updated && updated.fotoPerfilUrl !== selectedConversation.fotoPerfilUrl) {
      setSelectedConversation(updated);
    }
  }, [conversations, selectedConversation?.id, selectedConversation?.fotoPerfilUrl]);

  useEffect(() => {
    if (!selectedConversation?.id) return;
    setMessages([]);
    setLoadingMessages(true);
    conversationService
      .listMessages(selectedConversation.id)
      .then((res) => setMessages(Array.isArray(res) ? res : []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [selectedConversation?.id]);

  const conversationIdsKey = useMemo(
    () => conversations.map((conversation) => conversation.id).filter(Boolean).sort((a, b) => Number(a) - Number(b)).join(","),
    [conversations],
  );

  useEffect(() => {
    if (!conversationIdsKey || !user?.id) return undefined;

    const conversationIds = conversationIdsKey.split(",").map(Number).filter(Number.isFinite);

    return chatRealtimeService.subscribeToConversations(conversationIds, (event) => {
      setConversations((prev) => applyConversationRealtimeEvent(prev, event));
      if (!isIncomingMessage(event, user.id)) return;

      const conversationId = Number(event.mensagem.conversaId);
      if (isConversationOpen(conversationId, selectedConversationRef.current, showMobileListRef.current)) return;

      setUnreadConversationIds((prev) => {
        if (prev.has(conversationId)) return prev;
        return new Set(prev).add(conversationId);
      });
    });
  }, [conversationIdsKey, user?.id]);


  useEffect(() => {
    if (!selectedConversation?.id || !user?.id) return undefined;

    const atualizarConversas = () => {
      conversationService
        .listByUser(user.id)
        .then((res) => hydrateConversationPhotos(res, user))
        .then(setConversations)
        .catch(() => {});
    };

    return chatRealtimeService.subscribeToConversation(selectedConversation.id, (event) => {
      if (Number(event?.conversaId) !== Number(selectedConversation.id)) return;

      if (event.tipo === "MENSAGEM_CRIADA" && event.mensagem) {
        setMessages((prev) => {
          const exists = prev.some((message) => Number(message.id) === Number(event.mensagem.id));
          if (exists) return prev;

          const withoutTemp = prev.filter((message) => {
            if (!message._temporaria) return true;
            return !(
              message.conteudo === event.mensagem.conteudo &&
              Number(message.remetenteId) === Number(event.mensagem.remetenteId)
            );
          });

          return [...withoutTemp, event.mensagem];
        });
        atualizarConversas();
        return;
      }

      if (event.tipo === "MENSAGEM_EDITADA" && event.mensagem) {
        setMessages((prev) =>
          prev.map((message) =>
            Number(message.id) === Number(event.mensagem.id) ? event.mensagem : message
          )
        );
        atualizarConversas();
        return;
      }

      if (event.tipo === "MENSAGEM_EXCLUIDA") {
        setMessages((prev) =>
          prev.filter((message) => Number(message.id) !== Number(event.mensagemId))
        );
        atualizarConversas();
      }
    });
  }, [selectedConversation?.id, user?.id]);

  useEffect(() => {
    if (targetMessageId) {
      const targetNode = messageRefs.current[String(targetMessageId)];
      if (targetNode) {
        targetNode.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, targetMessageId]);

  const filtered = useMemo(() =>
    conversations.filter((c) =>
      (c?.titulo ?? "").toLowerCase().includes(search.toLowerCase())
    ), [conversations, search]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedConversation?.id) return;
    if (enviandoRef.current) return;

    const conteudo = input.trim();
    enviandoRef.current = true;

    const temp = {
      id: `temp-${Date.now()}`,
      conteudo,
      remetenteId: user?.id,
      remetenteNome: user?.nome,
      dataEnvio: new Date().toISOString(),
      editada: false,
      remetenteFotoPerfilUrl: getUserPhotoUrl(user),
      remetenteAvatarUrl: getUserPhotoUrl(user),
      _temporaria: true,
    };

    setMessages((prev) => [...prev, temp]);
    setInput("");

    try {
      await conversationService.sendMessage(selectedConversation.id, conteudo);
      const [updated, conversasAtualizadas] = await Promise.all([
        conversationService.listMessages(selectedConversation.id),
        conversationService.listByUser(user.id),
      ]);
      setMessages(Array.isArray(updated) ? updated : []);
      setConversations(await hydrateConversationPhotos(conversasAtualizadas, user));
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setInput(conteudo);
      toast.error("Erro ao enviar mensagem");
    } finally {
      enviandoRef.current = false;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Edição via modal
  const abrirModalEdicao = (m) => {
    setModalEdicao(m);
    setEditandoTexto(m.conteudo);
  };

  const fecharModalEdicao = () => {
    setModalEdicao(null);
    setEditandoTexto("");
  };

  const confirmarEdicao = async () => {
    if (!editandoTexto.trim() || !modalEdicao) return;
    try {
      const atualizada = await conversationService.editMessage(modalEdicao.id, editandoTexto.trim());
      setMessages((prev) => prev.map((m) => (m.id === modalEdicao.id ? atualizada : m)));
      fecharModalEdicao();
    } catch {
      toast.error("Erro ao editar mensagem");
    }
  };

  // Exclusão via modal de confirmação
  const abrirModalExclusao = (m) => {
    setModalExclusao(m);
  };

  const fecharModalExclusao = () => {
    setModalExclusao(null);
  };

  const confirmarExclusao = async () => {
    if (!modalExclusao) return;
    try {
      await conversationService.deleteMessage(modalExclusao.id);
      setMessages((prev) => prev.filter((m) => m.id !== modalExclusao.id));
      fecharModalExclusao();
    } catch {
      toast.error("Erro ao excluir mensagem");
    }
  };

  const abrirConversaPrivada = async (remetenteId, remetenteNome) => {
    if (remetenteId === user?.id || abrindoPrivada === remetenteId) return;
    try {
      setAbrindoPrivada(remetenteId);
      const [conversa] = await hydrateConversationPhotos(
        [await conversationService.openPrivate(remetenteId)],
        user,
      );
      setConversations((prev) => sortConversations(prev.some((c) => c.id === conversa.id) ? prev : [conversa, ...prev]));
      setSelectedConversation(conversa);
      markConversationAsRead(conversa.id);
      setShowMobileList(false);
    } catch {
      toast.error(`Erro ao abrir conversa com ${remetenteNome}`);
    } finally {
      setAbrindoPrivada(null);
    }
  };

  if (loading) return <ChatPageSkeleton />;
  if (error) return <StatusView title="Erro" description="Falha ao carregar" />;

  return (
    <div className="pagina-chat">

      {/* LISTA */}
      <div className={`pagina-chat__lista-conversas ${showMobileList ? "pagina-chat__lista-conversas--visivel" : ""}`}>
        <div className="pagina-chat__cabecalho-lista">
          <h2 className="pagina-chat__titulo-lista">Mensagens</h2>
          <div className="pagina-chat__busca-conversa">
            <Search size={15} className="pagina-chat__icone-busca" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversa"
              className="pagina-chat__input-busca"
            />
          </div>
        </div>

        <div className="pagina-chat__rolagem-conversas">
          {filtered.map((c) => (
            <motion.button
              key={c.id}
              onClick={() => { setSelectedConversation(c); markConversationAsRead(c.id); setShowMobileList(false); }}
              className={`conversa-item ${selectedConversation?.id === c.id ? "conversa-item--selecionada" : ""} ${unreadConversationIds.has(Number(c.id)) ? "conversa-item--nao-lida" : ""}`}
            >
              <ChatAvatar name={c?.titulo} src={c?.fotoPerfilUrl} className="conversa-item__avatar" />
              <div className="conversa-item__info">
                <div className="conversa-item__header">
                  <p className="conversa-item__nome">{c?.titulo ?? "Conversa"}</p>
                  <span className={`conversa-item__badge ${c.tipo === "PRIVADA" ? "conversa-item__badge--privada" : "conversa-item__badge--grupo"}`}>
                    {c.tipo === "PRIVADA" ? "Direto" : "Grupo"}
                  </span>
                </div>
                <div className="conversa-item__rodape">
                  <p className="conversa-item__preview">{c?.ultimaMensagem ?? "Nenhuma mensagem ainda"}</p>
                  {c?.ultimaMensagemHorario && (
                    <span className="conversa-item__horario">{formatarHora(c.ultimaMensagemHorario)}</span>
                  )}
                  {unreadConversationIds.has(Number(c.id)) && (
                    <span className="conversa-item__ping" aria-label="Nova mensagem" title="Nova mensagem" />
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* CONVERSA */}
      <div className={`pagina-chat__area-conversa ${!showMobileList ? "pagina-chat__area-conversa--visivel" : ""}`}>
        {selectedConversation ? (
          <>
            <div className="pagina-chat__topo-conversa">
              <button
                type="button"
                className="pagina-chat__botao-voltar"
                onClick={() => setShowMobileList(true)}
                aria-label="Voltar para a lista de conversas"
              >
                <ArrowLeft size={16} />
              </button>
              <ChatAvatar name={selectedConversation?.titulo} src={selectedConversation?.fotoPerfilUrl} className="pagina-chat__avatar-contato" />
              <div>
                <p className="pagina-chat__nome-contato">{selectedConversation?.titulo ?? "Conversa"}</p>
              </div>
            </div>

            <div className="pagina-chat__mensagens">
              {loadingMessages ? (
                <MessageSkeletonRows />
              ) : (
                <>
                  {messages.map((m, i) => {
                    const mine = Number(m?.remetenteId) === Number(user?.id);
                    const carregando = abrindoPrivada === m?.remetenteId;

                    const dataAtual = new Date(m.dataEnvio).toDateString();
                    const dataAnterior =
                      i > 0
                        ? new Date(messages[i - 1].dataEnvio).toDateString()
                        : null;

                    const mostrarData = dataAtual !== dataAnterior;

                    return (
                      <div
                        key={m.id ?? i}
                        ref={(node) => {
                          if (m?.id == null) return;
                          const key = String(m.id);
                          if (node) {
                            messageRefs.current[key] = node;
                          } else {
                            delete messageRefs.current[key];
                          }
                        }}
                        className={String(m?.id) === String(targetMessageId) ? "mensagem-alvo" : undefined}
                      >

                        {mostrarData && (
                          <div className="chat-data-divider">
                            <span>{formatarDia(m.dataEnvio)}</span>
                          </div>
                        )}

                        <div
                          className={`mensagem-linha ${
                            mine ? "mensagem-linha--usuario" : "mensagem-linha--contato"
                          } ${m._temporaria ? "mensagem-linha--temporaria" : ""}`}
                        >
                          {mine && !m._temporaria && (
                            <div className="mensagem-acoes">
                              <button
                                className="mensagem-acao-btn"
                                onClick={() => abrirModalEdicao(m)}
                                title="Editar mensagem"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                className="mensagem-acao-btn mensagem-acao-btn--excluir"
                                onClick={() => abrirModalExclusao(m)}
                                title="Excluir mensagem"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}

                          {!mine && (
                            <ChatAvatar
                              name={m?.remetenteNome}
                              src={getMessagePhotoUrl(m, user, mine, selectedConversation)}
                              className="mensagem-avatar"
                            />
                          )}

                          <div className="bolha-mensagem">
                            {!mine && (
                              <button
                                className={`mensagem-nome mensagem-nome--clicavel ${
                                  carregando ? "mensagem-nome--carregando" : ""
                                }`}
                                onClick={() => abrirPerfil(m?.remetenteId)}
                                title={`Enviar mensagem para ${m?.remetenteNome}`}
                                disabled={carregando}
                              >
                                {m?.remetenteNome}
                              </button>
                            )}
                            <div className="mensagem-texto">{m?.conteudo}</div>
                            <div className="mensagem-rodape">
                              {m?.editada && (
                                <span className="mensagem-editada">editada</span>
                              )}
                              <div className="mensagem-hora">
                                {formatarHora(m?.dataEnvio)}
                              </div>
                            </div>
                          </div>

                          {mine && (
                            <ChatAvatar
                              name={user?.nome}
                              src={getMessagePhotoUrl(m, user, mine, selectedConversation)}
                              className="mensagem-avatar mensagem-avatar--usuario"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="pagina-chat__area-input">
              <div className="pagina-chat__linha-input">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite uma mensagem"
                  className="pagina-chat__input-mensagem"
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button onClick={sendMessage} className="pagina-chat__botao-enviar">
                  <span className="texto-enviar">Enviar Mensagem</span>
                  <ArrowUp size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="pagina-chat__estado-vazio">
            <p style={{ color: "#888" }}>
              {conversations.length === 0 ? "Você ainda não tem nenhuma conversa." : "Selecione uma conversa"}
            </p>
          </div>
        )}
      </div>

      {/* MODAL EDIÇÃO */}
      {modalEdicao && (
        <div className="modal-overlay" onClick={fecharModalEdicao}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__cabecalho">
              <h3 className="modal__titulo">Editar mensagem</h3>
            </div>
            <div className="modal__corpo">
              <input
                type="text"
                className="modal__textarea"
                value={editandoTexto}
                onChange={(e) => setEditandoTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); confirmarEdicao(); }
                  if (e.key === "Escape") fecharModalEdicao();
                }}
                autoFocus
                rows={4}
              />
            </div>
            <div className="modal__rodape">
              <button className="modal__btn modal__btn--cancelar" onClick={fecharModalEdicao}>
                Cancelar
              </button>
              <button className="modal__btn modal__btn--confirmar" onClick={confirmarEdicao}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO EXCLUSÃO */}
      {modalExclusao && (
        <div className="modal-overlay" onClick={fecharModalExclusao}>
          <div className="modal modal--pequeno" onClick={(e) => e.stopPropagation()}>
            <div className="modal__cabecalho">
              <h3 className="modal__titulo">Excluir mensagem</h3>
            </div>
            <div className="modal__corpo">
              <p className="modal__texto">Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.</p>
            </div>
            <div className="modal__rodape">
              <button className="modal__btn modal__btn--cancelar" onClick={fecharModalExclusao}>
                Cancelar
              </button>
              <button className="modal__btn modal__btn--excluir" onClick={confirmarExclusao}>
                <Trash2 size={14} /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
