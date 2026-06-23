"use client";

import { Bell, Search, Menu, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Badge, IconButton } from "./ui";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { notificationService } from "../services/notificationService";
import { formatUserType } from "../utils/formatters";
import { mapNotification } from "../utils/adapters";
import { SearchModal } from "./SearchModal";

function getInitials(name) {
  if (!name) return "IC";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Topbar({ onMenuClick, title, subtitle }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const router = useRouter();
  const navigate = (path) => router.push(path);
  const { user, logout } = useAuth();
  const { data, reload } = useAsyncData(
    async () => {
      const result = await notificationService.listMine();
      return Array.isArray(result)
        ? result.map(mapNotification)
        : [];
    },
    [],
    { initialData: [] },
  );

  const notifications = Array.isArray(data) ? data : [];
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      reload();
    };

    window.addEventListener("notifications-updated", handleNotificationsUpdated);

    return () => {
      window.removeEventListener("notifications-updated", handleNotificationsUpdated);
    };
  }, [reload]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  return (
    <header className="barra-topo">
      <div className="barra-topo__secao-esquerda">
        <IconButton
          aria-label="Abrir menu lateral"
          title="Abrir menu"
          size="md"
          variant="ghost"
          onClick={onMenuClick}
          className="barra-topo__botao-menu"
        >
          <Menu size={20} className="barra-topo__botao-menu-icone" aria-hidden="true" />
        </IconButton>

        <div className="barra-topo__area-titulo">
          <p className="barra-topo__eyebrow">CollabResearch</p>
          <h1 className="barra-topo__titulo">{title}</h1>
          {subtitle && <p className="barra-topo__subtitulo">{subtitle}</p>}
        </div>
      </div>

      <div className="barra-topo__secao-direita">
        <button
          className="barra-topo__busca"
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Abrir busca global"
        >
          <Search size={15} aria-hidden="true" />
          <span>Buscar...</span>
          <span className="barra-topo__atalho-busca" aria-hidden="true">CTRL+K</span>
        </button>

        {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

        <IconButton
          aria-label={unreadCount > 0 ? `Ver notificações, ${unreadCount} não lidas` : "Ver notificações"}
          title="Notificações"
          size="md"
          variant="ghost"
          onClick={() => navigate("/app/notifications")}
          className="barra-topo__botao-notificacoes"
        >
          <Bell size={18} className="barra-topo__icone-notificacoes" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge tone="danger" size="sm" className="barra-topo__contador-notificacoes">
              {unreadCount}
            </Badge>
          )}
        </IconButton>

        <div className="barra-topo__area-perfil" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="barra-topo__botao-perfil"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
            aria-label="Abrir menu de perfil"
          >
            <div className="barra-topo__avatar" aria-hidden="true">
              <span className="barra-topo__iniciais-avatar">{getInitials(user?.nome)}</span>
            </div>
            <div className="barra-topo__info-perfil">
              <p className="barra-topo__nome-perfil">{user?.nome?.split(" ")[0] ?? "Usuário"}</p>
              <p className="barra-topo__tipo-perfil">{formatUserType(user?.tipo)}</p>
            </div>
            <ChevronDown
              size={14}
              className={`barra-topo__icone-dropdown ${dropdownOpen ? "barra-topo__icone-dropdown--aberto" : ""}`}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.18 }}
                className="barra-topo__menu-dropdown"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { navigate("/app/profile"); setDropdownOpen(false); }}
                  className="barra-topo__item-menu"
                >
                  Meu Perfil
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { navigate("/app/configuracoes"); setDropdownOpen(false); }}
                  className="barra-topo__item-menu"
                >
                  Configurações
                </button>
                <hr className="barra-topo__divisor-menu" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="barra-topo__item-menu barra-topo__item-menu--sair"
                >
                  Sair
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
