import { useCallback, useMemo, useState } from "react";
import { NavLink } from "react-router";
import { FolderOpen, SquaresFour, ChatCircleText, Bell, User, FileText, TrendUp, CaretLeft, Gear, Users, ClipboardText, GraduationCap, CalendarCheck, SignOut } from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../providers/NotificationsProvider";
import { getInitials } from "../utils/formatters";
import { prefetchRoute } from "../routes";
import { LogoutConfirmModal } from "./LogoutConfirmModal";
import "./Sidebar.css";

// Itens agrupados por categoria. A primeira seção não tem rótulo (fica logo
// abaixo da marca); as demais abrem com uma divisória + rótulo da categoria.
const studentSections = [
  {
    items: [
      { path: "/app", label: "Dashboard", icon: SquaresFour, exact: true },
      { path: "/app/projects", label: "Projetos", icon: FolderOpen },
    ],
  },
  {
    label: "Pesquisa",
    items: [
      { path: "/app/applications", label: "Inscrições", icon: FileText },
      { path: "/app/progress", label: "Minhas etapas", icon: TrendUp },
      { path: "/app/avaliacoes", label: "Minhas avaliações", icon: Users },
      { path: "/app/deadlines", label: "Calendário", icon: CalendarCheck },
      { path: "/app/chat", label: "Conversas", icon: ChatCircleText },
    ],
  },
  {
    label: "Conta",
    items: [
      { path: "/app/notifications", label: "Notificações", icon: Bell },
      { path: "/app/profile", label: "Meu perfil", icon: User },
    ],
  },
];

const advisorSections = [
  {
    items: [
      { path: "/app", label: "Dashboard", icon: SquaresFour, exact: true },
      { path: "/app/projects", label: "Projetos", icon: FolderOpen },
    ],
  },
  {
    label: "Pesquisa",
    items: [
      { path: "/app/applications", label: "Inscrições", icon: FileText },
      { path: "/app/advisees", label: "Alunos", icon: GraduationCap },
      { path: "/app/deliveries", label: "Entregas", icon: ClipboardText },
      { path: "/app/progress", label: "Progresso", icon: TrendUp },
      { path: "/app/avaliacoes", label: "Avaliações", icon: Users },
      { path: "/app/deadlines", label: "Calendário", icon: CalendarCheck },
      { path: "/app/chat", label: "Conversas", icon: ChatCircleText },
    ],
  },
  {
    label: "Conta",
    items: [
      { path: "/app/notifications", label: "Notificações", icon: Bell },
      { path: "/app/profile", label: "Meu perfil", icon: User },
    ],
  },
];

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((item) => !item.read).length;
  const isAdvisor = user?.tipo === "ORIENTADOR";
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleConfirmLogout = async () => {
    setLogoutConfirmOpen(false);
    await logout();
  };
  const sections = useMemo(() => {
    const base = isAdvisor ? advisorSections : studentSections;
    return base
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.roles || item.roles.includes(user?.tipo)),
      }))
      .filter((section) => section.items.length > 0);
  }, [isAdvisor, user?.tipo]);

  const SidebarContent = useCallback(() => {
    const renderItem = (item) => (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.exact}
        onClick={() => setMobileOpen(false)}
        onMouseEnter={() => prefetchRoute(item.path, user?.tipo)}
        onFocus={() => prefetchRoute(item.path, user?.tipo)}
        className={({ isActive }) =>
          ["barra-lateral__item-nav", isActive ? "barra-lateral__item-nav--ativo" : ""]
            .filter(Boolean)
            .join(" ")
        }
      >
        {({ isActive }) => (
          <>
            <item.icon
              size={18}
              className={isActive ? "barra-lateral__icone-nav barra-lateral__icone-nav--ativo" : "barra-lateral__icone-nav"}
            />
            <span className={isActive ? "barra-lateral__rotulo-nav barra-lateral__rotulo-nav--ativo" : "barra-lateral__rotulo-nav"}>
              {item.label}
            </span>
            {item.path === "/app/notifications" && unreadCount > 0 && (
              <span className="barra-lateral__contador">{unreadCount}</span>
            )}
          </>
        )}
      </NavLink>
    );

    return (
      <div className="barra-lateral__conteudo-interno">
        <div className="barra-lateral__cabecalho">
          <div className="barra-lateral__marca-lockup" aria-label="CollabResearch">
            <img
              className="barra-lateral__marca barra-lateral__marca--completa"
              src="/brand/logo-full.svg"
              width={101}
              height={20}
              alt="CollabResearch"
            />
            <img
              className="barra-lateral__marca barra-lateral__marca--icone"
              src="/brand/logo-icon.svg"
              width={24}
              height={24}
              alt="CollabResearch"
            />
          </div>
        </div>

        <div className="barra-lateral__divisor" aria-hidden="true" />

        <nav className="barra-lateral__navegacao">
          {sections.map((section, index) => (
            <div className="barra-lateral__setor" key={section.label ?? `secao-${index}`}>
              {index > 0 && (
                <div className="barra-lateral__divisor barra-lateral__divisor--secao" aria-hidden="true" />
              )}
              {section.label && (
                <span className="barra-lateral__setor-rotulo">{section.label}</span>
              )}
              <div className="barra-lateral__setor-itens">
                {section.items.map(renderItem)}
              </div>
            </div>
          ))}
        </nav>

        <div className="barra-lateral__rodape">
          <NavLink
            to="/app/configuracoes"
            onClick={() => setMobileOpen(false)}
            onMouseEnter={() => prefetchRoute("/app/configuracoes", user?.tipo)}
            onFocus={() => prefetchRoute("/app/configuracoes", user?.tipo)}
            className={({ isActive }) =>
              [
                "barra-lateral__item-nav",
                isActive ? "barra-lateral__item-nav--ativo" : "",
              ].filter(Boolean).join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Gear
                  size={18}
                  className={isActive ? "barra-lateral__icone-nav barra-lateral__icone-nav--ativo" : "barra-lateral__icone-nav"}
                />
                <span className={isActive ? "barra-lateral__rotulo-nav barra-lateral__rotulo-nav--ativo" : "barra-lateral__rotulo-nav"}>
                  Configurações
                </span>
              </>
            )}
          </NavLink>

          <button
            type="button"
            className="barra-lateral__item-nav barra-lateral__item-nav--sair"
            onClick={() => setLogoutConfirmOpen(true)}
          >
            <SignOut size={18} className="barra-lateral__icone-nav" />
            <span className="barra-lateral__rotulo-nav">Logout</span>
          </button>

          <div className="barra-lateral__divisor barra-lateral__divisor--rodape" aria-hidden="true" />

          <div className="barra-lateral__rodape-conta">
            <NavLink
              to="/app/profile"
              onClick={() => setMobileOpen(false)}
              onMouseEnter={() => prefetchRoute("/app/profile", user?.tipo)}
              onFocus={() => prefetchRoute("/app/profile", user?.tipo)}
              className="barra-lateral__perfil"
            >
              {user?.fotoPerfilUrl || user?.avatarUrl ? (
                <img
                  className="barra-lateral__perfil-avatar barra-lateral__perfil-avatar--foto"
                  src={user?.fotoPerfilUrl ?? user?.avatarUrl}
                  alt=""
                />
              ) : (
                <span className="barra-lateral__perfil-avatar">{getInitials(user?.nome)}</span>
              )}
              <span className="barra-lateral__perfil-info">
                <span className="barra-lateral__perfil-nome">{user?.nome ?? "Usuário"}</span>
                <span className="barra-lateral__perfil-papel">{isAdvisor ? "Orientador(a)" : "Aluno(a)"}</span>
              </span>
            </NavLink>
          </div>
        </div>
      </div>
    );
  }, [sections, setMobileOpen, unreadCount, user, isAdvisor]);

  return (
    <>
      <aside
        className={`barra-lateral ${collapsed ? "barra-lateral--recolhida" : ""}`}
      >
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="barra-lateral__botao-recolher"
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          aria-expanded={!collapsed}
        >
          <CaretLeft
            size={14}
            className={`barra-lateral__icone-recolher ${
              collapsed ? "barra-lateral__icone-recolher--invertido" : ""
            }`}
          />
        </button>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div
          className="sobreposicao-mobile"
          style={{ display: "block" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {mobileOpen && (
        <aside className="barra-lateral-mobile barra-lateral-mobile--entrando">
          <SidebarContent />
        </aside>
      )}

      <LogoutConfirmModal
        open={logoutConfirmOpen}
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </>
  );
}
