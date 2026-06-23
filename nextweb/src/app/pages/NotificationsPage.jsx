"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Check,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { notificationService } from "../services/notificationService";
import { mapNotification } from "../utils/adapters";
import { formatNotificationType } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import "./NotificationsPage.css";

const typeConfig = {
  INSCRICAO_APROVADA: { icon: CheckCircle, iconeAreaClass: "notificacao-item__icone-area--sucesso", iconColor: "var(--cor-sucesso)" },
  INSCRICAO_RECEBIDA: { icon: Info, iconeAreaClass: "notificacao-item__icone-area--info", iconColor: "var(--cor-primaria)" },
  MENSAGEM_RECEBIDA: { icon: Bell, iconeAreaClass: "notificacao-item__icone-area--info", iconColor: "var(--cor-primaria)" },
  PROGRESSO_REGISTRADO: { icon: AlertCircle, iconeAreaClass: "notificacao-item__icone-area--atencao", iconColor: "var(--cor-laranja)" },
  INSCRICAO_REJEITADA: { icon: XCircle, iconeAreaClass: "notificacao-item__icone-area--erro", iconColor: "var(--cor-erro)" },
};

function getChatTargetFromUrl(actionUrl) {
  if (!actionUrl) return null;
  try {
    const url = new URL(actionUrl, window.location.origin);
    const conversationPathMatch = url.pathname.match(/(?:\/app)?\/conversas\/(\d+)/);
    const conversationId =
      url.searchParams.get("conversationId") ??
      url.searchParams.get("conversaId") ??
      url.searchParams.get("conversa") ??
      conversationPathMatch?.[1] ??
      null;
    const messageId =
      url.searchParams.get("messageId") ??
      url.searchParams.get("mensagemId") ??
      url.searchParams.get("mensagem") ??
      null;
    if (url.pathname === "/app/chat" || url.pathname === "/conversas" || conversationId || messageId) {
      return { conversationId, messageId };
    }
  } catch {
    return null;
  }
  return null;
}

function NotificationsSkeleton() {
  const Sk = ({ w = "100%", h = 14, r = "0.5rem", className = "", style }) => (
    <div className={`skeleton ${className}`.trim()} style={{ width: w, height: h, borderRadius: r, ...style }} />
  );
  return (
    <div className="pagina-notificacoes pagina-notificacoes--skeleton" aria-busy="true">
      <div className="pagina-notificacoes__acoes">
        <div className="pagina-notificacoes__contagem">
          <Sk w={20} h={20} r="50%" />
          <Sk w={160} h={15} />
        </div>
      </div>
      <div className="pagina-notificacoes__lista">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="notificacao-item notificacao-item--skeleton">
            <Sk w={40} h={40} r="var(--raio-grande)" />
            <div className="notificacao-item__conteudo">
              <Sk w={i % 2 === 0 ? "48%" : "58%"} h={15} />
              <Sk w="84%" h={13} style={{ marginTop: 8 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Agora mesmo";
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} dias atrás`;
  return date.toLocaleDateString("pt-BR");
}

export default function NotificationsPage() {
  const router = useRouter();
  const { data, loading, error, setData, reload } = useAsyncData(
    async () => {
      const result = await notificationService.listMine();
      return Array.isArray(result) ? result.map(mapNotification) : [];
    },
    [],
    { initialData: [] },
  );
  const initialNotifications = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const [filter, setFilter] = useState("all");

  const unreadCount = useMemo(
    () => initialNotifications.filter((item) => !item.read).length,
    [initialNotifications],
  );

  const filtered = useMemo(
    () => (filter === "all" ? initialNotifications : initialNotifications.filter((item) => item.type === filter)),
    [filter, initialNotifications],
  );

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      await reload();
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      toast.error(err.message || "Não foi possível marcar como lida.");
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await reload();
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      toast.error(err.message || "Não foi possível marcar todas como lidas.");
    }
  };

  const removeLocally = (id) => {
    setData((prev) => (Array.isArray(prev) ? prev.filter((item) => item.id !== id) : prev));
  };

  const clearAll = () => {
    setData([]);
  };

  const handleOpenNotification = async (notification) => {
    const urlTarget = getChatTargetFromUrl(notification.actionUrl);
    const conversationId = notification.conversationId ?? urlTarget?.conversationId ?? null;
    const messageId = notification.messageId ?? urlTarget?.messageId ?? null;

    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
        setData((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
        );
        window.dispatchEvent(new Event("notifications-updated"));
      } catch (err) {
        toast.error(err.message || "Não foi possível marcar como lida.");
        return;
      }
    }

    if (notification.type === "MENSAGEM_RECEBIDA") {
      if (conversationId) {
        const params = new URLSearchParams({ conversationId: String(conversationId) });
        if (messageId) params.set("messageId", String(messageId));
        router.push(`/app/chat?${params.toString()}`);
        return;
      }
      if (notification.actionUrl && notification.actionUrl !== "/app/notifications") {
        router.push(notification.actionUrl);
        return;
      }
      toast.error("Não foi possível identificar a conversa dessa notificação.");
      return;
    }

    if (notification.actionUrl && notification.actionUrl !== "/app/notifications") {
      router.push(notification.actionUrl);
    }
  };

  if (loading) return <NotificationsSkeleton />;

  if (error) {
    return <StatusView title="Falha ao carregar notificações" description={error.message} />;
  }

  const filters = ["all", ...new Set(initialNotifications.map((item) => item.type))];

  return (
    <div className="pagina-notificacoes">
      <div className="pagina-notificacoes__acoes">
        <div className="pagina-notificacoes__contagem">
          <Bell size={18} className="pagina-notificacoes__icone-contagem" />
          <span className="pagina-notificacoes__texto-contagem">
            {unreadCount > 0 ? `${unreadCount} não lidas` : "Nenhuma nova notificação"}
          </span>
        </div>
        <div className="pagina-notificacoes__botoes-acao">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="pagina-notificacoes__botao-marcar-lidas">
              <CheckCheck size={14} /> Marcar todas como lidas
            </button>
          )}
          <button onClick={clearAll} className="pagina-notificacoes__botao-limpar">
            <Trash2 size={14} /> Limpar vista local
          </button>
        </div>
      </div>

      <div className="pagina-notificacoes__filtros-tipo">
        {filters.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`pagina-notificacoes__chip-filtro ${filter === type ? "pagina-notificacoes__chip-filtro--ativo" : "pagina-notificacoes__chip-filtro--inativo"}`}
          >
            {type === "all" ? "Todas" : formatNotificationType(type)}
            <span className="pagina-notificacoes__chip-contagem">
              {type === "all" ? initialNotifications.length : initialNotifications.filter((item) => item.type === type).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="pagina-notificacoes__estado-vazio">
          <div className="pagina-notificacoes__icone-vazio">
            <Bell size={24} style={{ color: "var(--cor-texto-mudo)" }} />
          </div>
          <h3 className="pagina-notificacoes__titulo-vazio">Nenhuma notificação</h3>
          <p className="pagina-notificacoes__descricao-vazio">Você está em dia. Não há notificações para exibir.</p>
        </div>
      ) : (
        <div className="pagina-notificacoes__lista">
          {filtered.map((notification) => {
            const cfg = typeConfig[notification.type] ?? typeConfig.INSCRICAO_RECEBIDA;
            const Icon = cfg.icon;
            return (
              <div
                key={notification.id}
                className={`notificacao-item ${notification.read ? "notificacao-item--lida" : ""}`}
                onClick={() => handleOpenNotification(notification)}
                style={{ cursor: "pointer" }}
              >
                {!notification.read && <div className="notificacao-item__indicador-nao-lida" />}
                <div className={`notificacao-item__icone-area ${cfg.iconeAreaClass}`}>
                  <Icon size={18} style={{ color: cfg.iconColor }} />
                </div>
                <div className="notificacao-item__conteudo">
                  <div className="notificacao-item__linha-topo">
                    <p className={`notificacao-item__titulo ${notification.read ? "notificacao-item__titulo--lida" : ""}`}>{notification.title}</p>
                    <span className={`notificacao-item__tempo ${notification.read ? "notificacao-item__tempo--lida" : ""}`}>{timeAgo(notification.createdAt)}</span>
                  </div>
                  <p className={`notificacao-item__mensagem ${notification.read ? "notificacao-item__mensagem--lida" : ""}`}>{notification.message}</p>
                </div>
                <div className="notificacao-item__acoes">
                  {!notification.read && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="notificacao-item__botao-acao notificacao-item__botao-acao--confirmar"
                      title="Marcar como lida"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      removeLocally(notification.id);
                    }}
                    className="notificacao-item__botao-acao notificacao-item__botao-acao--excluir"
                    title="Ocultar da lista"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
