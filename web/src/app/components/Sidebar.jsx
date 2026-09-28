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
import { features } from "../config/features";
import "./Sidebar.css";

const studentSections = [
  {
    label: "Geral",
    items: [{ path: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Pesquisa",
    items: [
      { path: "/app/projects", label: "Meus projetos", icon: FolderOpen },
      { path: "/app/applications", label: "Inscrições", icon: FileText },
      { path: "/app/progress", label: "Minhas etapas", icon: TrendingUp },
      { path: "/app/avaliacoes", label: "Minhas avaliações", icon: Users },
      { path: "/app/deadlines", label: "Calendário", icon: CalendarClock },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { path: "/app/chat", label: "Conversas", icon: MessageSquare },
      { path: "/app/notifications", label: "Notificações", icon: Bell },
    ],
  },
  {
    label: "Conta",
    items: [{ path: "/app/profile", label: "Meu perfil", icon: User }],
  },
];

const advisorSections = [
  {
    label: "Geral",
    items: [{ path: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Orientação",
    items: [
      { path: "/app/projects", label: "Meus projetos", icon: FolderOpen },
      { path: "/app/advisees", label: "Alunos", icon: GraduationCap },
      { path: "/app/applications", label: "Inscrições", icon: FileText },
      { path: "/app/deliveries", label: "Entregas", icon: ClipboardCheck },
      { path: "/app/progress", label: "Progresso", icon: TrendingUp },
      { path: "/app/deadlines", label: "Calendário", icon: CalendarClock },
      { path: "/app/avaliacoes", label: "Avaliações", icon: Users },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { path: "/app/chat", label: "Conversas", icon: MessageSquare },
      { path: "/app/notifications", label: "Notificações", icon: Bell },
    ],
  },
  {
    label: "Conta",
    items: [{ path: "/app/profile", label: "Meu perfil", icon: User }],
  },
];

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((item) => !item.read).length;
  const isAdvisor = user?.tipo === "ORIENTADOR";
  const activeSections = useMemo(
    () => (isAdvisor ? advisorSections : studentSections)
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.roles || item.roles.includes(user?.tipo)),
      }))
      .filter((section) => section.items.length > 0),
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
          </div>
        </div>

        <nav className="barra-lateral__navegacao">
          {activeSections.map((section) => (
            <div key={section.label} className="barra-lateral__setor">
              <div className="barra-lateral__setor-marca" aria-hidden="true" />
              <span className="barra-lateral__setor-rotulo">{section.label}</span>
              <div className="barra-lateral__setor-itens">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={() => setMobileOpen(false)}
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
                        {isActive && <span className="barra-lateral__indicador-ativo" />}
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
            </div>
          ))}
        </nav>

        <div className="barra-lateral__rodape">
          <NavLink
            to="/app/configuracoes"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              [
                "barra-lateral__item-configuracoes",
                isActive ? "barra-lateral__item-nav--ativo" : "",
                isCollapsed ? "barra-lateral__item-nav--centralizado" : "",
              ].filter(Boolean).join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="barra-lateral__indicador-ativo" />}
                <Settings
                  size={18}
                  className={isActive ? "barra-lateral__icone-nav barra-lateral__icone-nav--ativo" : "barra-lateral__icone-nav"}
                />
                <span className={isActive ? "barra-lateral__rotulo-nav barra-lateral__rotulo-nav--ativo" : "barra-lateral__rotulo-nav"}>
                  Configuracoes
                </span>
              </>
            )}
          </NavLink>
        </div>
      </div>
    );
  }, [activeSections, collapsed, setMobileOpen, unreadCount]);

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
