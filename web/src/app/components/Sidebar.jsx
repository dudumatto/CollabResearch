import { useCallback, useMemo } from "react";
import { NavLink } from "react-router";
import {
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  Bell,
  User,
  FileText,
  TrendingUp,
  ChevronLeft,
  Settings,
  Users,
  ClipboardCheck,
  GraduationCap,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../providers/NotificationsProvider";
import { getInitials } from "../utils/formatters";
import { prefetchRoute } from "../routes";
import "./Sidebar.css";

const studentItems = [
  { path: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/app/projects", label: "Projetos", icon: FolderOpen },
  { path: "/app/applications", label: "Inscrições", icon: FileText },
  { path: "/app/progress", label: "Minhas etapas", icon: TrendingUp },
  { path: "/app/avaliacoes", label: "Minhas avaliações", icon: Users },
  { path: "/app/deadlines", label: "Calendário", icon: CalendarClock },
  { path: "/app/chat", label: "Conversas", icon: MessageSquare },
  { path: "/app/notifications", label: "Notificações", icon: Bell },
  { path: "/app/profile", label: "Meu perfil", icon: User },
];

const advisorItems = [
  { path: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/app/projects", label: "Projetos", icon: FolderOpen },
  { path: "/app/applications", label: "Inscrições", icon: FileText },
  { path: "/app/advisees", label: "Alunos", icon: GraduationCap },
  { path: "/app/deliveries", label: "Entregas", icon: ClipboardCheck },
  { path: "/app/progress", label: "Progresso", icon: TrendingUp },
  { path: "/app/deadlines", label: "Calendário", icon: CalendarClock },
  { path: "/app/avaliacoes", label: "Avaliações", icon: Users },
  { path: "/app/chat", label: "Conversas", icon: MessageSquare },
  { path: "/app/notifications", label: "Notificações", icon: Bell },
  { path: "/app/profile", label: "Meu perfil", icon: User },
];

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((item) => !item.read).length;
  const isAdvisor = user?.tipo === "ORIENTADOR";
  const items = useMemo(
    () => (isAdvisor ? advisorItems : studentItems).filter(
      (item) => !item.roles || item.roles.includes(user?.tipo),
    ),
    [isAdvisor, user?.tipo],
  );

  const SidebarContent = useCallback(({ forceExpanded = false } = {}) => {
    const isCollapsed = forceExpanded ? false : collapsed;

    return (
      <div className="barra-lateral__conteudo-interno">
        <div
          className={`barra-lateral__cabecalho ${
            isCollapsed ? "barra-lateral__cabecalho--centralizado" : ""
          }`}
        >
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
          <div className="barra-lateral__setor-itens">
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setMobileOpen(false)}
                onMouseEnter={() => prefetchRoute(item.path, user?.tipo)}
                onFocus={() => prefetchRoute(item.path, user?.tipo)}
                className={({ isActive }) =>
                  [
                    "barra-lateral__item-nav",
                    isActive ? "barra-lateral__item-nav--ativo" : "",
                    isCollapsed ? "barra-lateral__item-nav--centralizado" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={18}
                      className={
                        isActive
                          ? "barra-lateral__icone-nav barra-lateral__icone-nav--ativo"
                          : "barra-lateral__icone-nav"
                      }
                    />
                    <span
                      className={
                        isActive
                          ? "barra-lateral__rotulo-nav barra-lateral__rotulo-nav--ativo"
                          : "barra-lateral__rotulo-nav"
                      }
                    >
                      {item.label}
                    </span>
                    {item.path === "/app/notifications" && unreadCount > 0 && (
                      <span className="barra-lateral__contador">{unreadCount}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
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
                isCollapsed ? "barra-lateral__item-nav--centralizado" : "",
              ].filter(Boolean).join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Settings
                  size={18}
                  className={isActive ? "barra-lateral__icone-nav barra-lateral__icone-nav--ativo" : "barra-lateral__icone-nav"}
                />
                <span className={isActive ? "barra-lateral__rotulo-nav barra-lateral__rotulo-nav--ativo" : "barra-lateral__rotulo-nav"}>
                  Configurações
                </span>
              </>
            )}
          </NavLink>

          <div className="barra-lateral__divisor barra-lateral__divisor--rodape" aria-hidden="true" />

          <NavLink
            to="/app/profile"
            onClick={() => setMobileOpen(false)}
            onMouseEnter={() => prefetchRoute("/app/profile", user?.tipo)}
            onFocus={() => prefetchRoute("/app/profile", user?.tipo)}
            className={`barra-lateral__perfil ${isCollapsed ? "barra-lateral__perfil--centralizado" : ""}`}
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
    );
  }, [items, collapsed, setMobileOpen, unreadCount, user, isAdvisor]);

  return (
    <>
      <aside
        className={`barra-lateral ${collapsed ? "barra-lateral--recolhida" : ""}`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="barra-lateral__botao-recolher"
        >
          <ChevronLeft
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
          <SidebarContent forceExpanded />
        </aside>
      )}
    </>
  );
}
