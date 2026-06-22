"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { Badge, IconButton } from "./ui";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { notificationService } from "../services/notificationService";
import { SearchModal } from "./SearchModal";

const navGroups = [
  {
    label: "Geral",
    items: [{ path: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Explorar",
    items: [
      { path: "/app/projects", label: "Projetos", icon: FolderOpen },
      { path: "/app/applications", label: "Inscrições", icon: FileText, roles: ["ALUNO"] },
    ],
  },
  {
    label: "Acompanhar",
    items: [
      { path: "/app/chat", label: "Mensagens", icon: MessageSquare },
      { path: "/app/progress", label: "Progresso", icon: TrendingUp },
      { path: "/app/feedback", label: "Feedback", icon: Star },
      { path: "/app/notifications", label: "Notificações", icon: Bell },
    ],
  },
  {
    label: "Conta",
    items: [{ path: "/app/profile", label: "Meu Perfil", icon: User }],
  },
];

function isActivePath(pathname, item) {
  return item.exact ? pathname === item.path : pathname.startsWith(item.path);
}

function formatRole(role) {
  if (role === "ORIENTADOR") return "Orientador";
  if (role === "ALUNO") return "Aluno";
  return "Perfil acadêmico";
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  const { data, reload } = useAsyncData(
    () => notificationService.listMine(),
    [],
    { initialData: [] },
  );

  useEffect(() => {
    const atualizar = () => reload();
    window.addEventListener("notificationsUpdated", atualizar);
    return () => window.removeEventListener("notificationsUpdated", atualizar);
  }, [reload]);

  // Ctrl+K: duplicado com Topbar.jsx. Ambos chamam preventDefault +
  // setSearchOpen(true). O segundo dispatch é redundante mas inofensivo
  // (React batch). Mantido para robustez se um desmontar isoladamente.
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

  const openSearch = () => {
    setMobileOpen(false);
    setSearchOpen(true);
  };

  const SidebarContent = ({ forceExpanded = false } = {}) => {
    const isCollapsed = forceExpanded ? false : collapsed;

    return (
      <div className="barra-lateral__conteudo-interno">
        <div className={`barra-lateral__cabecalho ${isCollapsed ? "barra-lateral__cabecalho--centralizado" : ""}`}>
          <div className="barra-lateral__logo" aria-hidden="true">
            <FlaskConical size={18} className="barra-lateral__logo-icone" />
          </div>
          {!isCollapsed && (
            <div className="barra-lateral__info-app">
              <p className="barra-lateral__nome-app">CollabResearch</p>
              <p className="barra-lateral__subtitulo-app">Iniciação Científica</p>
            </div>
          )}
        </div>

        <div className="barra-lateral__pesquisa">
          <button
            className={`barra-lateral__botao-pesquisa ${isCollapsed ? "barra-lateral__botao-pesquisa--recolhido" : ""}`}
            onClick={openSearch}
            title="Buscar (Ctrl+K)"
            aria-label="Abrir busca global"
            type="button"
          >
            <Search size={15} className="barra-lateral__pesquisa-icone" aria-hidden="true" />
            {!isCollapsed && (
              <>
                <span className="barra-lateral__pesquisa-placeholder">Buscar...</span>
                <span className="barra-lateral__pesquisa-atalho" aria-hidden="true">CTRL+K</span>
              </>
            )}
          </button>
        </div>

        <nav className="barra-lateral__navegacao" aria-label="Navegação principal">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.roles || item.roles.includes(user?.tipo),
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="barra-lateral__grupo-nav">
                {!isCollapsed && <p className="barra-lateral__grupo-label">{group.label}</p>}
                <div className="barra-lateral__grupo-lista">
                  {visibleItems.map((item) => {
                    const isActive = isActivePath(pathname, item);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={[
                          "barra-lateral__item-nav",
                          isActive ? "barra-lateral__item-nav--ativo" : "",
                          isCollapsed ? "barra-lateral__item-nav--centralizado" : "",
                        ].filter(Boolean).join(" ")}
                        {...(isCollapsed ? { "data-tooltip": item.label } : {})}
                      >
                        {isActive && <span className="barra-lateral__indicador-ativo" aria-hidden="true" />}
                        <item.icon
                          size={18}
                          aria-hidden="true"
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
                        {!isCollapsed && item.path === "/app/notifications" && unreadCount > 0 && (
                          <Badge tone="danger" size="sm" className="barra-lateral__contador">
                            {unreadCount}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="barra-lateral__rodape">
          {!isCollapsed && (
            <div className="barra-lateral__perfil-resumo" aria-label={`Perfil atual: ${formatRole(user?.tipo)}`}>
              <span className="barra-lateral__perfil-avatar" aria-hidden="true">
                {user?.nome?.[0]?.toUpperCase() ?? "C"}
              </span>
              <div className="barra-lateral__perfil-texto">
                <p className="barra-lateral__perfil-nome">{user?.nome?.split(" ")[0] ?? "Usuário"}</p>
                <p className="barra-lateral__perfil-papel">{formatRole(user?.tipo)}</p>
              </div>
            </div>
          )}

          {(() => {
            const isActive = pathname === "/app/configuracoes";
            return (
              <Link
                href="/app/configuracoes"
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "barra-lateral__item-configuracoes",
                  isActive ? "barra-lateral__item-nav--ativo" : "",
                  isCollapsed ? "barra-lateral__item-nav--centralizado" : "",
                ].filter(Boolean).join(" ")}
                {...(isCollapsed ? { "data-tooltip": "Configurações" } : {})}
              >
                {isActive && <span className="barra-lateral__indicador-ativo" aria-hidden="true" />}
                <Settings
                  size={18}
                  aria-hidden="true"
                  className={isActive ? "barra-lateral__icone-nav barra-lateral__icone-nav--ativo" : "barra-lateral__icone-nav"}
                />
                {!isCollapsed && (
                  <span className={isActive ? "barra-lateral__rotulo-nav barra-lateral__rotulo-nav--ativo" : "barra-lateral__rotulo-nav"}>
                    Configurações
                  </span>
                )}
              </Link>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <>
      <aside className={`barra-lateral ${collapsed ? "barra-lateral--recolhida" : ""}`} aria-label="Navegação lateral">
        <IconButton
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          size="sm"
          variant="secondary"
          onClick={() => setCollapsed(!collapsed)}
          className="barra-lateral__botao-recolher"
        >
          <ChevronLeft
            size={14}
            className={`barra-lateral__icone-recolher ${collapsed ? "barra-lateral__icone-recolher--invertido" : ""}`}
            aria-hidden="true"
          />
        </IconButton>
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
            aria-label="Navegação lateral mobile"
          >
            <SidebarContent forceExpanded />
          </motion.aside>
        )}
      </AnimatePresence>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
