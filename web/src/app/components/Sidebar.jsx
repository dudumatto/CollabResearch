import { NavLink } from "react-router";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  MessageSquare,
  TrendingUp,
  Star,
  User,
  Bell,
  ChevronLeft,
  Settings,
  Users,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { notificationService } from "../services/notificationService";
import { features } from "../config/features";
import "./Sidebar.css";

const navItems = [
  { path: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/app/projects", label: "Projetos", icon: FolderOpen },
  { path: "/app/applications", label: "Inscricoes", icon: FileText, roles: ["ALUNO"] },
  { path: "/app/chat", label: "Mensagens", icon: MessageSquare },
  { path: "/app/progress", label: "Progresso", icon: TrendingUp },
  { path: "/app/feedback", label: "Feedback", icon: Star },
  { path: "/app/notifications", label: "Notificacoes", icon: Bell },
  { path: "/app/profile", label: "Meu Perfil", icon: User },
];

const advisorNavItems = [
  { path: "/app", label: "Visao geral", icon: LayoutDashboard, exact: true },
  { path: "/app/projects", label: "Meus projetos", icon: FolderOpen },
  { path: "/app/applications", label: "Inscricoes recebidas", icon: FileText },
  { path: "/app/advisees", label: "Orientandos", icon: GraduationCap },
  { path: "/app/progress", label: "Progresso", icon: TrendingUp },
  { path: "/app/deliveries", label: "Entregas", icon: ClipboardCheck },
  { path: "/app/avaliacoes", label: "Avaliacoes", icon: Users },
  { path: "/app/chat", label: "Mensagens", icon: MessageSquare },
  { path: "/app/notifications", label: "Notificacoes", icon: Bell },
  { path: "/app/profile", label: "Meu Perfil", icon: User },
];

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user } = useAuth();

  const { data, reload } = useAsyncData(
    () => notificationService.listMine(),
    [],
    { initialData: [] }
  );

  useEffect(() => {
    const atualizar = () => reload();
    window.addEventListener("notificationsUpdated", atualizar);
    return () => window.removeEventListener("notificationsUpdated", atualizar);
  }, [reload]);

  const notifications = Array.isArray(data) ? data : [];
  const unreadCount = notifications.filter((item) => !item.lida).length;
  const isAdvisor = features.advisorWorkspaceV2 && user?.tipo === "ORIENTADOR";
  const activeNavItems = isAdvisor ? advisorNavItems : navItems;
  const visibleNavItems = activeNavItems.filter(
    (item) => !item.roles || item.roles.includes(user?.tipo)
  );

  const SidebarContent = ({ forceExpanded = false } = {}) => {
    const isCollapsed = forceExpanded ? false : collapsed;

    return (
      <div className="barra-lateral__conteudo-interno">
        <div
          className={`barra-lateral__cabecalho ${
            isCollapsed ? "barra-lateral__cabecalho--centralizado" : ""
          }`}
        >
          <img
            className={
              isCollapsed
                ? "barra-lateral__marca barra-lateral__marca--icone"
                : "barra-lateral__marca barra-lateral__marca--completa"
            }
            src={isCollapsed ? "/brand/logo-icon.svg" : "/brand/logo-full.svg"}
            width={isCollapsed ? 28 : 101}
            height={isCollapsed ? 28 : 20}
            alt="Collab"
          />
        </div>

        <nav className="barra-lateral__navegacao">
          {visibleNavItems.map((item) => (
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
                  {!isCollapsed && (
                    <span
                      className={
                        isActive
                          ? "barra-lateral__rotulo-nav barra-lateral__rotulo-nav--ativo"
                          : "barra-lateral__rotulo-nav"
                      }
                    >
                      {item.label}
                    </span>
                  )}
                  {!isCollapsed &&
                    item.path === "/app/notifications" &&
                    unreadCount > 0 && (
                      <span className="barra-lateral__contador">{unreadCount}</span>
                    )}
                </>
              )}
            </NavLink>
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
                {!isCollapsed && (
                  <span className={isActive ? "barra-lateral__rotulo-nav barra-lateral__rotulo-nav--ativo" : "barra-lateral__rotulo-nav"}>
                    Configuracoes
                  </span>
                )}
              </>
            )}
          </NavLink>
        </div>
      </div>
    );
  };

  return (
    <>
      <aside
        className={`barra-lateral ${collapsed ? "barra-lateral--recolhida" : ""}`}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setCollapsed(!collapsed)}
          className="barra-lateral__botao-recolher"
        >
          <ChevronLeft
            size={14}
            className={`barra-lateral__icone-recolher ${
              collapsed ? "barra-lateral__icone-recolher--invertido" : ""
            }`}
          />
        </motion.button>
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="sobreposicao-mobile"
            style={{ display: "block" }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="barra-lateral-mobile"
          >
            <SidebarContent forceExpanded />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
