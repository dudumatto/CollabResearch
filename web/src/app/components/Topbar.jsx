import { Bell, List, MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useNotifications } from "../providers/NotificationsProvider";
import { prefetchRoute } from "../routes";
import "./Topbar.css";

export function Topbar({ onMenuClick, title, subtitle }) {
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((item) => !item.read).length;
  const [busca, setBusca] = useState("");
  const buscaRef = useRef(null);

  // Atalho CTRL/CMD + K foca a busca, como indicado no modelo da topbar.
  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        buscaRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const termo = busca.trim();
    navigate(termo ? `/app/projects?busca=${encodeURIComponent(termo)}` : "/app/projects");
  };

  return (
    <header className="barra-topo">
      <div className="barra-topo__secao-esquerda">
        <button onClick={onMenuClick} className="barra-topo__botao-menu" aria-label="Abrir menu lateral">
          <List size={20} className="barra-topo__botao-menu-icone" />
        </button>
        <div className="barra-topo__area-titulo">
          <h1 className="barra-topo__titulo">{title}</h1>
          {subtitle && <p className="barra-topo__subtitulo">{subtitle}</p>}
        </div>
      </div>

      <div className="barra-topo__secao-direita">
        <form className="barra-topo__busca" role="search" onSubmit={handleSearch}>
          <MagnifyingGlass size={16} className="barra-topo__busca-icone" aria-hidden="true" />
          <input
            ref={buscaRef}
            type="search"
            className="barra-topo__busca-campo"
            placeholder="Buscar..."
            aria-label="Buscar"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
          <kbd className="barra-topo__busca-atalho" aria-hidden="true">CTRL+K</kbd>
        </form>

        <span className="barra-topo__divisor-acoes" aria-hidden="true" />

        <button
          onClick={() => navigate("/app/notifications")}
          onMouseEnter={() => prefetchRoute("/app/notifications")}
          onFocus={() => prefetchRoute("/app/notifications")}
          className="barra-topo__botao-notificacoes"
          aria-label="Notificações"
        >
          <Bell size={20} className="barra-topo__icone-notificacoes" />
          {unreadCount > 0 && (
            <span className="barra-topo__contador-notificacoes">{unreadCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
