import { Bell, Menu, ChevronDown, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../providers/NotificationsProvider";
import { formatUserType } from "../utils/formatters";
import { prefetchRoute } from "../routes";
import "./Topbar.css";

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
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((item) => !item.read).length;
  const [avatarFailed, setAvatarFailed] = useState(false);
  const avatarUrl = user?.fotoPerfilUrl || user?.avatarUrl || "";

  useEffect(() => setAvatarFailed(false), [avatarUrl]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
        setLogoutConfirmOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutConfirmOpen(false);
    await logout();
  };

  return (
    <>
      <header className="barra-topo">
        <div className="barra-topo__secao-esquerda">
          <button
            onClick={onMenuClick}
            className="barra-topo__botao-menu"
          >
            <Menu size={20} className="barra-topo__botao-menu-icone" />
          </button>
          <div className="barra-topo__area-titulo">
            <h1 className="barra-topo__titulo">{title}</h1>
            {subtitle && <p className="barra-topo__subtitulo">{subtitle}</p>}
          </div>
        </div>

        <div className="barra-topo__secao-direita">
          <button
            onClick={() => navigate("/app/notifications")}
            onMouseEnter={() => prefetchRoute("/app/notifications")}
            onFocus={() => prefetchRoute("/app/notifications")}
            className="barra-topo__botao-notificacoes"
          >
            <Bell size={18} className="barra-topo__icone-notificacoes" />
            {unreadCount > 0 && (
              <span className="barra-topo__contador-notificacoes">{unreadCount}</span>
            )}
          </button>

          <div className="barra-topo__area-perfil" ref={profileMenuRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="barra-topo__botao-perfil"
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
              aria-label="Abrir menu de perfil"
            >
              <div className="barra-topo__avatar">
                {avatarUrl && !avatarFailed ? (
                  <img src={avatarUrl} alt="Foto de perfil" loading="lazy" decoding="async" onError={() => setAvatarFailed(true)} />
                ) : (
                  <span className="barra-topo__iniciais-avatar">{getInitials(user?.nome)}</span>
                )}
              </div>
              <div className="barra-topo__info-perfil">
                <p className="barra-topo__nome-perfil">{user?.nome?.split(" ")[0] ?? "Usuário"}</p>
                <p className="barra-topo__tipo-perfil">{formatUserType(user?.tipo)}</p>
              </div>
              <ChevronDown size={14} className="barra-topo__icone-dropdown" />
            </button>

            {dropdownOpen && (
                <div className="barra-topo__menu-dropdown barra-topo__menu-dropdown--entrando">
                  <button
                    onClick={() => { navigate("/app/profile"); setDropdownOpen(false); }}
            onMouseEnter={() => prefetchRoute("/app/profile", user?.tipo)}
            onFocus={() => prefetchRoute("/app/profile", user?.tipo)}
                    className="barra-topo__item-menu"
                  >
                    Meu Perfil
                  </button>
                  <button
                    onClick={() => { navigate("/app/configuracoes"); setDropdownOpen(false); }}
                    onMouseEnter={() => prefetchRoute("/app/configuracoes")}
                    onFocus={() => prefetchRoute("/app/configuracoes")}
                    className="barra-topo__item-menu"
                  >
                    Configurações
                  </button>
                  <hr className="barra-topo__divisor-menu" />
                  <button
                    onClick={handleLogout}
                    className="barra-topo__item-menu barra-topo__item-menu--sair"
                  >
                    Sair
                  </button>
                </div>
            )}
          </div>
        </div>
      </header>

      {logoutConfirmOpen && (
          <div
            className="barra-topo__logout-overlay"
            role="presentation"
            data-entering="true"
            onClick={(event) => {
              if (event.target === event.currentTarget) setLogoutConfirmOpen(false);
            }}
          >
            <div
              className="barra-topo__logout-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="topbar-logout-title"
              aria-describedby="topbar-logout-description"
              data-entering="true"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="barra-topo__logout-icon" aria-hidden="true">
                <LogOut size={28} />
              </div>
              <h2 id="topbar-logout-title" className="barra-topo__logout-title">Sair da conta?</h2>
              <p id="topbar-logout-description" className="barra-topo__logout-desc">
                Você precisará fazer login novamente para acessar a plataforma.
              </p>
              <div className="barra-topo__logout-actions">
                <button type="button" className="barra-topo__logout-confirm" onClick={handleConfirmLogout}>
                  Confirmar saída
                </button>
                <button type="button" className="barra-topo__logout-cancel" onClick={() => setLogoutConfirmOpen(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
      )}
    </>
  );
}
