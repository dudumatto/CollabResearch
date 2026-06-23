"use client";

import { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import { useAuth } from "../hooks/useAuth";

export const SidebarContext = createContext({ collapsed: false });
export const useSidebarContext = () => useContext(SidebarContext);

const pageTitles = {
  "/app": { title: "Dashboard", subtitle: "Bem-vindo de volta" },
  "/app/projects": { title: "Projetos", subtitle: "Explore oportunidades de pesquisa" },
  "/app/applications": { title: "Minhas Inscrições", subtitle: "Acompanhe o status das suas candidaturas" },
  "/app/chat": { title: "Mensagens", subtitle: "Conversas com orientadores" },
  "/app/progress": { title: "Progresso do Projeto", subtitle: "Acompanhe o andamento da sua pesquisa" },
  "/app/feedback": { title: "Feedback", subtitle: "Avaliações e comentários" },
  "/app/profile": { title: "Meu Perfil", subtitle: "Gerencie suas informações pessoais" },
  "/app/documents": { title: "Documentos", subtitle: "Seus arquivos enviados" },
  "/app/notifications": { title: "Notificações", subtitle: "Suas atualizações recentes" },
  "/app/configuracoes": { title: "Configurações", subtitle: "Preferências da conta" },
};

export function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const baseInfo = pageTitles[pathname] || { title: "Iniciação Científica", subtitle: "" };
  const pageInfo = {
    ...baseInfo,
    subtitle:
      pathname === "/app" && user?.nome
        ? `Bem-vindo de volta, ${user.nome.split(" ")[0]}`
        : baseInfo.subtitle,
  };

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="pagina-app tema-fixo-claro">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <div className={`pagina-app__principal ${collapsed ? "pagina-app__principal--recolhida" : ""}`}>
          <Topbar
            onMenuClick={() => setMobileOpen(true)}
            title={pageInfo.title}
            subtitle={pageInfo.subtitle}
          />
          <main className="pagina-app__conteudo" aria-label="Conteúdo principal">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="pagina-app__pagina"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
