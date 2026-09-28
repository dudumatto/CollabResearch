import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Search, Pencil, Trash2, ArrowLeft, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { conversationService } from "../services/conversationService";
import { chatRealtimeService } from "../services/chatRealtimeService";
import { StatusView } from "../components/StatusView";
import { getUserPhotoUrl } from "../utils/adapters";
import "./ChatPage.css";
import { useLocation, useNavigate } from "react-router";
import { List, useDynamicRowHeight, useListRef } from "react-window";

function getInitials(name) {
  if (!name) return "PR";
  return name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

const ChatAvatar = memo(function ChatAvatar({ name, src, className }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className={className}>
      {src && !failed ? <img src={src} alt={`Foto de perfil de ${name}`} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <span>{getInitials(name)}</span>}
    </div>
  );
});

const ConversationItem = memo(function ConversationItem({ conversation, selected, unread, onSelect }) {
  const conversationType = conversation.tipo === "PRIVADA" ? "privada" : "grupo";

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(conversation)}
      className={`conversa-item ${selected ? "conversa-item--selecionada" : ""} ${unread ? "conversa-item--nao-lida" : ""}`}
    >
      <ChatAvatar name={conversation?.titulo} src={conversation?.fotoPerfilUrl} className="conversa-item__avatar" />
      <div className="conversa-item__info">
        <div className="conversa-item__header">
          <p className="conversa-item__nome">{conversation?.titulo ?? "Conversa"}</p>
          <span className={`conversa-item__badge conversa-item__badge--${conversationType}`}>
            {conversationType === "privada" ? "Direto" : "Grupo"}
          </span>
        </div>
        <div className="conversa-item__rodape">
          <p className="conversa-item__preview">{conversation?.ultimaMensagem ?? "Nenhuma mensagem ainda"}</p>
          {conversation?.ultimaMensagemHorario && (
            <span className="conversa-item__horario">{formatarHora(conversation.ultimaMensagemHorario)}</span>
          )}
          {unread && <span className="conversa-item__ping" aria-label="Nova mensagem" title="Nova mensagem" />}
        </div>
      </div>
    </motion.button>
  );
});

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

function hydrateConversationPhotos(items, currentUser) {
  const conversations = Array.isArray(items) ? items : [];

  const hydrated = conversations.map((conversation) => {
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

    const fallbackPhoto = getUserPhotoUrl(currentUser);
    return fallbackPhoto ? { ...conversation, fotoPerfilUrl: fallbackPhoto } : conversation;
  });

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

const MessageRow = memo(function MessageRow({ message, showDate, highlighted, mine, loadingPrivate, user, conversation, onEdit, onDelete, onOpenProfile }) {
  return (
    <div className={highlighted ? "mensagem-alvo" : undefined}>
      {showDate && <div className="chat-data-divider"><span>{formatarDia(message.dataEnvio)}</span></div>}
      <div className={`mensagem-linha ${mine ? "mensagem-linha--usuario" : "mensagem-linha--contato"} ${message._temporaria ? "mensagem-linha--temporaria" : ""}`}>
        {mine && !message._temporaria && <div className="mensagem-acoes">
          <button type="button" className="mensagem-acoes__gatilho" aria-label="Ações da mensagem" title="Ações da mensagem"><MoreVertical size={18} /></button>
          <div className="mensagem-acoes__menu" role="menu" aria-label="Ações da mensagem">
            <button type="button" className="mensagem-acao-btn" onClick={() => onEdit(message)} title="Editar mensagem" aria-label="Editar mensagem" role="menuitem"><Pencil size={20} /></button>
            <button type="button" className="mensagem-acao-btn mensagem-acao-btn--excluir" onClick={() => onDelete(message)} title="Excluir mensagem" aria-label="Excluir mensagem" role="menuitem"><Trash2 size={20} /></button>
          </div>
        </div>}
        {!mine && <ChatAvatar name={message?.remetenteNome} src={getMessagePhotoUrl(message, user, mine, conversation)} className="mensagem-avatar" />}
        <div className="bolha-mensagem">
          {!mine && <button className={`mensagem-nome mensagem-nome--clicavel ${loadingPrivate ? "mensagem-nome--carregando" : ""}`} onClick={() => onOpenProfile(message?.remetenteId)} title={`Enviar mensagem para ${message?.remetenteNome}`} disabled={loadingPrivate}>{message?.remetenteNome}</button>}
          <div className="mensagem-texto">{message?.conteudo}</div>
          <div className="mensagem-rodape">{message?.editada && <span className="mensagem-editada">editada</span>}<div className="mensagem-hora">{formatarHora(message?.dataEnvio)}</div></div>
        </div>
        {mine && <ChatAvatar name={user?.nome} src={getMessagePhotoUrl(message, user, mine, conversation)} className="mensagem-avatar mensagem-avatar--usuario" />}
      </div>
    </div>
  );
});

const VirtualMessageRow = memo(function VirtualMessageRow({
  ariaAttributes, index, style, messages, firstMessageIndex, allMessages,
  targetMessageId, user, conversation, loadingPrivateId,
  onEdit, onDelete, onOpenProfile, messageRefs,
}) {
  const message = messages[index];
  if (!message) return null;
  const absoluteIndex = firstMessageIndex + index;
  const mine = Number(message?.remetenteId) === Number(user?.id);
  const previousMessage = absoluteIndex > 0 ? allMessages[absoluteIndex - 1] : null;
  const showDate = !previousMessage || new Date(message.dataEnvio).toDateString() !== new Date(previousMessage.dataEnvio).toDateString();
  const messageId = String(message?.id ?? absoluteIndex);

  return (
    <div
      {...ariaAttributes}
      style={{ ...style, paddingBottom: 10, boxSizing: "border-box" }}
      data-message-id={messageId}
      ref={(node) => {
        if (message?.id == null) return;
        if (node) messageRefs.current[messageId] = node;
        else delete messageRefs.current[messageId];
      }}
    >
      <MessageRow
        message={message}
        showDate={showDate}
        highlighted={String(message?.id) === String(targetMessageId)}
        mine={mine}
        loadingPrivate={loadingPrivateId === message?.remetenteId}
        user={user}
        conversation={conversation}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpenProfile={onOpenProfile}
      />
    </div>
  );
});

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

  const messagesContainerRef = useRef(null);
  const messageListRef = useListRef();
  const pendingScrollAnchorRef = useRef(null);
  const preserveScrollOnNextRenderRef = useRef(false);
  const targetScrollHandledRef = useRef(false);
  const enviandoRef = useRef(false);
  const loadingOlderMessagesRef = useRef(false);
  const messagesRequestIdRef = useRef(0);
  const loadedConversationIdRef = useRef(null);
  const messageRefs = useRef({});
  const selectedConversationRef = useRef(null);
  const showMobileListRef = useRef(true);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [unreadConversationIds, setUnreadConversationIds] = useState(() => new Set());
  const [messages, setMessages] = useState([]);
  const [messagePage, setMessagePage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [abrindoPrivada, setAbrindoPrivada] = useState(null);
  const [targetMessageId, setTargetMessageId] = useState(null);

  const abrirPerfil = useCallback((usuarioId) => {
    if (!usuarioId) return;
    navigate(`/app/users/${usuarioId}`);
  }, [navigate]);

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
    const conversationId = selectedConversation.id;
    const conversationChanged = Number(loadedConversationIdRef.current) !== Number(conversationId);
    if (!conversationChanged && !targetMessageId) return;
    loadedConversationIdRef.current = conversationId;
    const requestId = ++messagesRequestIdRef.current;
    let cancelled = false;
    pendingScrollAnchorRef.current = null;
    preserveScrollOnNextRenderRef.current = false;
    loadingOlderMessagesRef.current = false;
    setLoadingOlderMessages(false);
    setMessages([]);
    setMessagePage(0);
    setHasMoreMessages(false);
    setLoadingMessages(true);
    const initialMessages = targetMessageId
      ? conversationService.listMessages(conversationId).then((result) => ({ content: result, last: true }))
      : conversationService.listMessagesPage(conversationId);
    initialMessages
      .then((page) => {
        if (cancelled || requestId !== messagesRequestIdRef.current) return;
        const content = Array.isArray(page?.content) ? page.content : [];
        setMessages(targetMessageId ? content : [...content].reverse());
        setMessagePage(Number(page?.page ?? 0));
        setHasMoreMessages(!targetMessageId && !page?.last && content.length > 0);
      })
      .catch(() => {
        if (!cancelled && requestId === messagesRequestIdRef.current) setMessages([]);
      })
      .finally(() => {
        if (!cancelled && requestId === messagesRequestIdRef.current) setLoadingMessages(false);
      });
    return () => { cancelled = true; };
  }, [selectedConversation?.id, targetMessageId]);

  const conversationIdsKey = useMemo(
    () => conversations.map((conversation) => conversation.id).filter(Boolean).sort((a, b) => Number(a) - Number(b)).join(","),
    [conversations],
  );

  useEffect(() => {
    if (!conversationIdsKey || !user?.id) return undefined;

    const conversationIds = conversationIdsKey.split(",").map(Number).filter(Number.isFinite);

    return chatRealtimeService.subscribeToConversations(conversationIds, (event) => {
      setConversations((prev) => applyConversationRealtimeEvent(prev, event));

      const eventConversationId = Number(event?.conversaId ?? event?.mensagem?.conversaId);
      if (eventConversationId === Number(selectedConversationRef.current?.id)) {
        if (event.tipo === "MENSAGEM_CRIADA" && event.mensagem) {
          setMessages((prev) => {
            if (prev.some((message) => Number(message.id) === Number(event.mensagem.id))) {
              return prev;
            }

            const withoutTemp = prev.filter((message) => !(
              message._temporaria &&
              message.conteudo === event.mensagem.conteudo &&
              Number(message.remetenteId) === Number(event.mensagem.remetenteId)
            ));
            return [...withoutTemp, event.mensagem];
          });
        } else if (event.tipo === "MENSAGEM_EDITADA" && event.mensagem) {
          setMessages((prev) => prev.map((message) =>
            Number(message.id) === Number(event.mensagem.id) ? event.mensagem : message,
          ));
        } else if (event.tipo === "MENSAGEM_EXCLUIDA") {
          setMessages((prev) => prev.filter(
            (message) => Number(message.id) !== Number(event.mensagemId),
          ));
        }
      }

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
    targetScrollHandledRef.current = false;
  }, [targetMessageId]);

  useEffect(() => {
    if (targetMessageId) {
      const targetNode = messageRefs.current[String(targetMessageId)];
      if (targetNode && !targetScrollHandledRef.current) {
        targetNode.scrollIntoView({ behavior: "smooth", block: "center" });
        targetScrollHandledRef.current = true;
        return;
      }
      const targetIndex = visibleMessages.findIndex((message) => String(message?.id) === String(targetMessageId));
      if (targetIndex >= 0 && !targetScrollHandledRef.current) {
        messageListRef.current?.scrollToRow({ index: targetIndex, align: "center" });
        requestAnimationFrame(() => {
          const node = messageRefs.current[String(targetMessageId)];
          node?.scrollIntoView({ behavior: "smooth", block: "center" });
          if (node) targetScrollHandledRef.current = true;
        });
        return;
      }
    }

    if (preserveScrollOnNextRenderRef.current) {
      preserveScrollOnNextRenderRef.current = false;
      return;
    }

    if (visibleMessages.length > 0) {
      messageListRef.current?.scrollToRow({
        index: visibleMessages.length - 1,
        align: "end",
        behavior: "smooth",
      });
    }
  }, [visibleMessages, targetMessageId, loadingMessages]);

  const filtered = useMemo(() =>
    conversations.filter((c) =>
      (c?.titulo ?? "").toLowerCase().includes(search.toLowerCase())
    ), [conversations, search]);

  const firstVisibleMessageIndex = useMemo(() => {
    if (!targetMessageId) return 0;
    const targetIndex = messages.findIndex((message) => String(message?.id) === String(targetMessageId));
    if (targetIndex < 0) return 0;
    return Math.max(0, Math.min(targetIndex - 30, messages.length - 100));
  }, [messages, targetMessageId]);
  const visibleMessages = useMemo(
    () => targetMessageId
      ? messages.slice(firstVisibleMessageIndex, firstVisibleMessageIndex + 100)
      : messages,
    [messages, firstVisibleMessageIndex, targetMessageId],
  );
  const messageRowHeight = useDynamicRowHeight({
    defaultRowHeight: 84,
    key: `${selectedConversation?.id ?? "none"}:${firstVisibleMessageIndex}`,
  });

  useLayoutEffect(() => {
    messagesContainerRef.current = messageListRef.current?.element ?? null;
  });

  const loadOlderMessages = async () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const containerTop = container.getBoundingClientRect().top;
    const firstVisibleRow = [...container.querySelectorAll("[data-message-id]")]
      .find((row) => row.getBoundingClientRect().bottom > containerTop);
    pendingScrollAnchorRef.current = firstVisibleRow ? {
      messageId: firstVisibleRow.dataset.messageId,
      offsetTop: firstVisibleRow.getBoundingClientRect().top - containerTop,
    } : null;
    preserveScrollOnNextRenderRef.current = true;
    if (targetMessageId && firstVisibleMessageIndex > 0) {
      setTargetMessageId(null);
      return;
    }
    if (!hasMoreMessages || loadingOlderMessagesRef.current) {
      preserveScrollOnNextRenderRef.current = false;
      return;
    }

    loadingOlderMessagesRef.current = true;
    setLoadingOlderMessages(true);
    const requestId = messagesRequestIdRef.current;
    const conversationId = selectedConversation.id;
    try {
      const page = await conversationService.listMessagesPage(conversationId, messagePage + 1);
      if (requestId !== messagesRequestIdRef.current
          || Number(selectedConversationRef.current?.id) !== Number(conversationId)) return;
      const olderMessages = Array.isArray(page?.content) ? [...page.content].reverse() : [];
      setMessages((current) => {
        const currentIds = new Set(current.map((message) => String(message?.id)));
        return [...olderMessages.filter((message) => !currentIds.has(String(message?.id))), ...current];
      });
      setMessagePage(Number(page?.page ?? messagePage + 1));
      setHasMoreMessages(!page?.last && olderMessages.length > 0);
    } catch {
      if (requestId !== messagesRequestIdRef.current) return;
      pendingScrollAnchorRef.current = null;
      preserveScrollOnNextRenderRef.current = false;
      toast.error("Não foi possível carregar mensagens anteriores.");
    } finally {
      if (requestId === messagesRequestIdRef.current) {
        loadingOlderMessagesRef.current = false;
        setLoadingOlderMessages(false);
      }
    }
  };

  useLayoutEffect(() => {
    const anchor = pendingScrollAnchorRef.current;
    const container = messagesContainerRef.current;
    if (!anchor || !container) return;
    const rowIndex = visibleMessages.findIndex((message) => String(message?.id) === anchor.messageId);
    if (rowIndex < 0) return;
    messageListRef.current?.scrollToRow({ index: rowIndex, align: "start" });
    requestAnimationFrame(() => {
      const row = messageRefs.current[anchor.messageId];
      const scrollElement = messageListRef.current?.element;
      if (!row || !scrollElement) return;
      const actualOffset = row.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top;
      scrollElement.scrollTop += actualOffset - anchor.offsetTop;
    });
    pendingScrollAnchorRef.current = null;
  }, [firstVisibleMessageIndex, visibleMessages]);

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
      const sentMessage = await conversationService.sendMessage(selectedConversation.id, conteudo);
      if (sentMessage?.id != null) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((message) => !(
            message.id === temp.id ||
            (message._temporaria && message.conteudo === conteudo && Number(message.remetenteId) === Number(user?.id))
          ));
          const existingIndex = withoutTemp.findIndex(
            (message) => Number(message.id) === Number(sentMessage.id),
          );
          if (existingIndex >= 0) {
            return withoutTemp.map((message, index) => index === existingIndex ? sentMessage : message);
          }
          return [...withoutTemp, sentMessage];
        });
        setConversations((prev) => sortConversations(prev.map((conversation) => (
          Number(conversation.id) === Number(selectedConversation.id)
            ? {
                ...conversation,
                ultimaMensagem: sentMessage.conteudo,
                ultimaMensagemHorario: sentMessage.dataEnvio,
                updatedAt: sentMessage.dataEnvio,
              }
            : conversation
        ))));
      } else {
        const page = await conversationService.listMessagesPage(selectedConversation.id);
        const latest = Array.isArray(page?.content) ? [...page.content].reverse() : [];
        setMessages(latest);
        setMessagePage(Number(page?.page ?? 0));
        setHasMoreMessages(!page?.last && latest.length > 0);
      }
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

  const handleConversationSelect = useCallback((conversation) => {
    setTargetMessageId(null);
    setSelectedConversation(conversation);
    markConversationAsRead(conversation.id);
    setShowMobileList(false);
  }, [markConversationAsRead]);

  // Edição via modal
  const abrirModalEdicao = useCallback((m) => {
    setModalEdicao(m);
    setEditandoTexto(m.conteudo);
  }, []);

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
  const abrirModalExclusao = useCallback((m) => {
    setModalExclusao(m);
  }, []);

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

  const messageRowProps = useMemo(() => ({
    messages: visibleMessages,
    allMessages: messages,
    firstMessageIndex: firstVisibleMessageIndex,
    targetMessageId,
    user,
    conversation: selectedConversation,
    loadingPrivateId: abrindoPrivada,
    onEdit: abrirModalEdicao,
    onDelete: abrirModalExclusao,
    onOpenProfile: abrirPerfil,
    messageRefs,
  }), [visibleMessages, messages, firstVisibleMessageIndex, targetMessageId, user, selectedConversation, abrindoPrivada, abrirModalEdicao, abrirModalExclusao, abrirPerfil]);
  const messageRowKey = useCallback((index, data) => (
    String(data.messages[index]?.id ?? data.firstMessageIndex + index)
  ), []);

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
          {filtered.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              selected={selectedConversation?.id === conversation.id}
              unread={unreadConversationIds.has(Number(conversation.id))}
              onSelect={handleConversationSelect}
            />
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
                  {(firstVisibleMessageIndex > 0 || hasMoreMessages) && (
                    <button
                      type="button"
                      className="pagina-chat__carregar-anteriores"
                      onClick={loadOlderMessages}
                      disabled={loadingOlderMessages}
                      aria-label="Carregar mensagens anteriores"
                    >
                      {loadingOlderMessages ? "Carregando mensagens..." : "Carregar mensagens anteriores"}
                    </button>
                  )}
                  <List
                    className="pagina-chat__lista-virtualizada"
                    listRef={messageListRef}
                    rowComponent={VirtualMessageRow}
                    rowCount={visibleMessages.length}
                    rowHeight={messageRowHeight}
                    rowProps={messageRowProps}
                    rowKey={messageRowKey}
                    overscanCount={8}
                    defaultHeight={480}
                    style={{ flex: 1, minHeight: 0, width: "100%" }}
                  />
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
