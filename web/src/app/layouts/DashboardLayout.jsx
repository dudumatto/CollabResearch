import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import { useAuth } from "../hooks/useAuth";
import "./DashboardLayout.css";
import { createContext, useContext } from "react";

export const SidebarContext = createContext({ collapsed: false });
export const useSidebarContext = () => useContext(SidebarContext);

const pageTitles = {
  "/app": { title: "Dashboard", subtitle: "Bem-vindo de volta" },
  "/app/projects": { title: "Projetos", subtitle: "Explore oportunidades de pesquisa" },
  "/app/applications": { title: "Minhas Inscrições", subtitle: "Acompanhe o status das suas candidaturas" },
  "/app/chat": { title: "Mensagens", subtitle: "Conversas com orientadores" },
  "/app/progress": { title: "Minhas etapas", subtitle: "Acompanhe o andamento da sua pesquisa" },
  "/app/feedback": { title: "Feedbacks", subtitle: "Avaliações e comentários" },
  "/app/profile": { title: "Meu Perfil", subtitle: "Gerencie suas informações pessoais" },
  "/app/documents": { title: "Documentos", subtitle: "Seus arquivos enviados" },
  "/app/notifications": { title: "Notificações", subtitle: "Suas atualizações recentes" },
  "/app/configuracoes": { title: "Configurações", subtitle: "Preferências da conta" },
  "/app/advisees": { title: "Alunos", subtitle: "Estudantes que você orienta" },
  "/app/deliveries": { title: "Entregas", subtitle: "Arquivos enviados pelos orientandos" },
  "/app/avaliacoes": { title: "Avaliações", subtitle: "Avaliações acadêmicas por etapa" },
};

function pageInfoFor(location, user) {
  if (location.pathname === "/app/projects") return { title: "Meus projetos", subtitle: "Acompanhe seus projetos de pesquisa" };
  if (location.pathname === "/app/progress" && user?.tipo === "ORIENTADOR") return { title: "Progresso", subtitle: "Gerencie etapas e acompanhe os projetos" };
  if (location.pathname === "/app/deliveries" && user?.tipo === "ORIENTADOR") return { title: "Entregas para revisar", subtitle: "Arquivos enviados pelos alunos" };
  if (location.pathname === "/app/deadlines") return { title: "Prazos", subtitle: "Próximos compromissos do projeto" };
  if (location.pathname === "/app/applications" && user?.tipo === "ORIENTADOR") {
    return { title: "Inscrições recebidas", subtitle: "Candidaturas aguardando análise" };
  }

  const exact = pageTitles[location.pathname];
  if (exact) return exact;

  if (location.pathname.startsWith("/app/advisees/")) {
    return { title: "Orientando", subtitle: "Detalhes e histórico do estudante" };
  }

  if (location.pathname.includes("/deliveries")) {
    return { title: "Entregas", subtitle: "Arquivos e revisões" };
  }

  if (location.pathname.includes("/evaluations")) {
    return { title: "Avaliações", subtitle: "Avaliações acadêmicas" };
  }

  return { title: "Iniciação Científica", subtitle: "" };
}

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const baseInfo = pageInfoFor(location, user);
  const pageInfo = {
    ...baseInfo,
    subtitle:
      location.pathname === "/app" && user?.nome
        ? `Bem-vindo de volta, ${user.nome.split(" ")[0]}!`
        : baseInfo.subtitle,
  };

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="pagina-app">
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
          <main className="pagina-app__conteudo">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="pagina-app__pagina"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
