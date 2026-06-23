"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Send, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { conversationService } from "../services/conversationService";
import { chatRealtimeService } from "../services/chatRealtimeService";
import { StatusView } from "../components/StatusView";
import "./ChatPage.css";

function getInitials(name) {
  if (!name) return "PR";
  return name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function formatarHora(data) {
  if (!data) return "";
  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatarDia(data) {
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "";
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
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
        <div className="pagina-chat__estado-vazio">
          <p style={{ color: "var(--cor-texto-mudo)" }}>Carregando...</p>
        </div>
      </div>
    </div>
  );
}

function MessageListSkeleton() {
  const rows = [
    { side: "contato", width: "48%" },
    { side: "usuario", width: "38%" },
    { side: "contato", width: "56%" },
    { side: "usuario", width: "44%" },
  ];
  return (
    <div className="pagina-chat__mensagens pagina-chat__mensagens--skeleton">
      <div className="chat-data-divider chat-data-divider--skeleton">
        <span className="chat-skeleton chat-skeleton--data" />
      </div>
      {rows.map((row, index) => (
        <div className={`mensagem-linha mensagem-linha--${row.side}`} key={`${row.side}-${index}`}>
          <div className="bolha-mensagem bolha-mensagem--skeleton" style={{ width: row.width }}>
            {row.side === "contato" && <div className="chat-skeleton chat-skeleton--nome" />}
            <div className="chat-skeleton chat-skeleton--texto" />
            <div className="chat-skeleton chat-skeleton--texto chat-skeleton--texto-menor" />
            <div className="chat-skeleton chat-skeleton--hora" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const messagesEndRef = useRef(null);
  const enviandoRef = useRef(false);
  const messageRefs = useRef({});

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [targetMessageId, setTargetMessageId] = useState(null);
  const [modalEdicao, setModalEdicao] = useState(null);
  const [editandoTexto, setEditandoTexto] = useState("");
  const [modalExclusao, setModalExclusao] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    conversationService
      .listByUser(user.id)
      .then((result) => {
        if (cancelled) return;
        setConversations(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedConversation?.id) return;
    let cancelled = false;
    setMessages([]);
    setLoadingMessages(true);

    conversationService
      .listMessages(selectedConversation.id)
      .then((res) => {
        if (cancelled) return;
        setMessages(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (cancelled) return;
        setMessages([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingMessages(false);
      });

    return () => { cancelled = true; };
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (targetMessageId) {
      const targetNode = messageRefs.current[String(targetMessageId)];
      if (targetNode) {
        targetNode.scrollIntoView({ behavior: "smooth", block: "center" });
        setTargetMessageId(null);
        return;
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, targetMessageId]);

  useEffect(() => {
    if (!selectedConversation?.id || !user?.id) return undefined;

    const atualizarConversas = () => {
      conversationService
        .listByUser(user.id)
        .then((res) => setConversations(Array.isArray(res) ? res : []))
        .catch(() => {});
    };

    const unsubscribe = chatRealtimeService.subscribeToConversation(
      selectedConversation.id,
      (event) => {
        if (Number(event?.conversaId) !== Number(selectedConversation.id)) return;

        if (event.tipo === "MENSAGEM_CRIADA" && event.mensagem) {
          setMessages((prev) => {
            const exists = prev.some((m) => Number(m.id) === Number(event.mensagem.id));
            if (exists) return prev;

            const withoutTemp = prev.filter((m) => {
              if (!m._temporaria) return true;
              return !(
                m.conteudo === event.mensagem.conteudo &&
                Number(m.remetenteId) === Number(event.mensagem.remetenteId)
              );
            });

            return [...withoutTemp, event.mensagem];
          });
          atualizarConversas();
          return;
        }

        if (event.tipo === "MENSAGEM_EDITADA" && event.mensagem) {
          setMessages((prev) =>
            prev.map((m) =>
              Number(m.id) === Number(event.mensagem.id) ? event.mensagem : m
            )
          );
          atualizarConversas();
          return;
        }

        if (event.tipo === "MENSAGEM_EXCLUIDA") {
          setMessages((prev) =>
            prev.filter((m) => Number(m.id) !== Number(event.mensagemId))
          );
          atualizarConversas();
        }
      }
    );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [selectedConversation?.id, user?.id]);

  useEffect(() => {
    if (conversations.length === 0) return;
    const targetId =
      searchParams.get("conversationId") ??
      searchParams.get("conversaId");
    const targetMsgId =
      searchParams.get("messageId") ??
      searchParams.get("mensagemId");

    if (targetId) {
      const target = conversations.find((c) => Number(c.id) === Number(targetId));
      setSelectedConversation(target ?? conversations[0]);
      setTargetMessageId(targetMsgId ? Number(targetMsgId) : null);
      setShowMobileList(false);
      return;
    }

    if (selectedConversation) return;
    setSelectedConversation(conversations[0]);
  }, [conversations, selectedConversation, searchParams]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const term = search.toLowerCase();
    return conversations.filter((c) =>
      (c.titulo ?? "").toLowerCase().includes(term)
    );
  }, [conversations, search]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation?.id) return;
    if (enviandoRef.current) return;

    const conteudo = newMessage.trim();
    enviandoRef.current = true;
    setSending(true);

    const temp = {
      id: `temp-${Date.now()}`,
      conteudo,
      remetenteId: user?.id,
      remetenteNome: user?.nome,
      dataEnvio: new Date().toISOString(),
      editada: false,
      _temporaria: true,
    };

    setMessages((prev) => [...prev, temp]);
    setNewMessage("");

    try {
      await conversationService.sendMessage(selectedConversation.id, conteudo);
      const [updated, conversasAtualizadas] = await Promise.all([
        conversationService.listMessages(selectedConversation.id),
        conversationService.listByUser(user.id),
      ]);
      setMessages(Array.isArray(updated) ? updated : []);
      setConversations(Array.isArray(conversasAtualizadas) ? conversasAtualizadas : []);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setNewMessage(conteudo);
      toast.error("Erro ao enviar mensagem");
    } finally {
      enviandoRef.current = false;
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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

  const handleSelect = (conversation) => {
    setSelectedConversation(conversation);
    setShowMobileList(false);
  };

  if (loading) return <ChatPageSkeleton />;

  if (error) {
    return (
      <div className="pagina-chat">
        <div className="pagina-chat__area-conversa pagina-chat__area-conversa--visivel">
          <StatusView title="Erro ao carregar conversas" description={error.message || "Não foi possível carregar suas conversas."} />
        </div>
      </div>
    );
  }

  return (
    <div className="pagina-chat">
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
              aria-label="Buscar conversa"
            />
          </div>
        </div>

        <div className="pagina-chat__rolagem-conversas">
          {filtered.length === 0 ? (
            <div className="pagina-chat__estado-vazio">
              <p style={{ color: "var(--cor-texto-mudo)", fontSize: 13 }}>
                {conversations.length === 0 ? "Nenhuma conversa encontrada" : "Nenhum resultado"}
              </p>
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`conversa-item ${selectedConversation?.id === c.id ? "conversa-item--selecionada" : ""}`}
                aria-label={`Abrir conversa ${c?.titulo ?? "Conversa"}${c.tipo === "PRIVADA" ? " (direto)" : " (grupo)"}`}
                aria-current={selectedConversation?.id === c.id ? "true" : undefined}
              >
                <div className="conversa-item__avatar">
                  <span className="conversa-item__iniciais">{getInitials(c?.titulo)}</span>
                </div>
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
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

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
              <div>
                <p className="pagina-chat__nome-contato">{selectedConversation?.titulo ?? "Conversa"}</p>
              </div>
            </div>

              <div className="pagina-chat__mensagens" role="log" aria-label="Mensagens da conversa" aria-live="polite">
              {loadingMessages ? (
                <MessageListSkeleton />
              ) : messages.length === 0 ? (
                <div className="pagina-chat__estado-vazio">
                  <p style={{ color: "var(--cor-texto-mudo)", fontSize: 13 }}>Nenhuma mensagem ainda</p>
                </div>
              ) : (
                <>
                  {messages.map((m, i) => {
                    const mine = Number(m?.remetenteId) === Number(user?.id);

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
                                aria-label="Editar mensagem"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                className="mensagem-acao-btn mensagem-acao-btn--excluir"
                                onClick={() => abrirModalExclusao(m)}
                                title="Excluir mensagem"
                                aria-label="Excluir mensagem"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}

                          <div className="bolha-mensagem">
                            {!mine && m?.remetenteNome && (
                              <span className="mensagem-nome">{m.remetenteNome}</span>
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
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite uma mensagem"
                  className="pagina-chat__input-mensagem"
                  onKeyDown={handleKeyDown}
                  rows={1}
                  aria-label="Digite sua mensagem"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="pagina-chat__botao-enviar"
                  aria-label="Enviar mensagem"
                >
                  <span className="texto-enviar">Enviar Mensagem</span>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="pagina-chat__estado-vazio">
            <p style={{ color: "var(--cor-texto-mudo)" }}>
              {conversations.length === 0 ? "Você ainda não tem nenhuma conversa." : "Selecione uma conversa"}
            </p>
          </div>
        )}
      </div>

      {modalEdicao && (
        <div className="modal-overlay" onClick={fecharModalEdicao}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Editar mensagem">
            <div className="modal__cabecalho">
              <h3 className="modal__titulo">Editar mensagem</h3>
            </div>
            <div className="modal__corpo">
              <label htmlFor="modal-editar-input" className="sr-only">Conteúdo da mensagem</label>
              <input
                id="modal-editar-input"
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

      {modalExclusao && (
        <div className="modal-overlay" onClick={fecharModalExclusao}>
          <div className="modal modal--pequeno" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Excluir mensagem">
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
