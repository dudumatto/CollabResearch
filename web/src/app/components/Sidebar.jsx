import { NavLink } from "react-router";
import { useEffect, useState } from "react";
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
  FlaskConical,
  Settings,
  Search,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { notificationService } from "../services/notificationService";
import { SearchModal } from "./SearchModal";
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

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

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

  // Atalho de teclado Ctrl+K / Cmd+K
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

  const notifications = Array.isArray(data) ? data : [];
  const unreadCount = notifications.filter((item) => !item.lida).length;
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.tipo)
  );

  const SidebarContent = () => (
    <div className="barra-lateral__conteudo-interno">
      <div
        className={`barra-lateral__cabecalho ${
          collapsed ? "barra-lateral__cabecalho--centralizado" : ""
        }`}
      >
        <div className="barra-lateral__logo">
          <FlaskConical size={18} className="barra-lateral__logo-icone" />
        </div>
        {!collapsed && (
          <div>
            <p className="barra-lateral__nome-app">CollabResearch</p>
            <p className="barra-lateral__subtitulo-app">Iniciacao Cientifica</p>
          </div>
        )}
      </div>

      {/* Área de pesquisa */}
      <div className="barra-lateral__pesquisa">
        <button
          className={`barra-lateral__botao-pesquisa ${
            collapsed ? "barra-lateral__botao-pesquisa--recolhido" : ""
          }`}
          onClick={() => {
            setMobileOpen(false);
            setSearchOpen(true);
          }}
          title="Buscar (Ctrl+K)"
        >
          <Search size={15} className="barra-lateral__pesquisa-icone" />
          {!collapsed && (
            <>
              <span className="barra-lateral__pesquisa-placeholder">
                Buscar...
              </span>
              <span className="barra-lateral__pesquisa-atalho">CTRL+K</span>
            </>
          )}
        </button>
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
                collapsed ? "barra-lateral__item-nav--centralizado" : "",
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
                {!collapsed && (
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
                {!collapsed &&
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
                collapsed ? "barra-lateral__item-nav--centralizado" : "",
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
                {!collapsed && (
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
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}