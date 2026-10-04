import { createContext, Suspense, useContext, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import { useAuth } from "../hooks/useAuth";
import { NotificationsProvider } from "../providers/NotificationsProvider";
import "./DashboardLayout.css";

export const SidebarContext = createContext({ collapsed: false });
export const useSidebarContext = () => useContext(SidebarContext);

const pageTitles = {
  "/app": { title: "Dashboard", subtitle: "Bem-vindo de volta" },
  "/app/projects": { title: "Projetos", subtitle: "Explore oportunidades de pesquisa" },
  "/app/applications": { title: "Minhas Inscrições", subtitle: "Acompanhe o status das suas candidaturas" },
  "/app/chat": { title: "Mensagens", subtitle: "Conversas com orientadores" },
  "/app/progress": { title: "Minhas etapas", subtitle: "Acompanhe o andamento da sua pesquisa" },
  "/app/profile": { title: "Meu Perfil", subtitle: "Gerencie suas informações pessoais" },
  "/app/documents": { title: "Documentos", subtitle: "Seus arquivos enviados" },
  "/app/notifications": { title: "Notificações", subtitle: "Suas atualizações recentes" },
  "/app/configuracoes": { title: "Configurações", subtitle: "Preferências da conta" },
  "/app/advisees": { title: "Alunos", subtitle: "Estudantes que você orienta" },
  "/app/deliveries": { title: "Entregas", subtitle: "Arquivos enviados pelos orientandos" },
  "/app/avaliacoes": { title: "Avaliações", subtitle: "Avaliações acadêmicas por etapa" },
};

function pageInfoFor(location, user) {
  if (location.pathname === "/app/projects") return { title: "Projetos", subtitle: "Explore oportunidades de pesquisa" };
  if (location.pathname === "/app/progress" && user?.tipo === "ORIENTADOR") return { title: "Progresso", subtitle: "Gerencie etapas e acompanhe os projetos" };
  if (location.pathname === "/app/deliveries" && user?.tipo === "ORIENTADOR") return { title: "Entregas para revisar", subtitle: "Arquivos enviados pelos alunos" };
  if (location.pathname === "/app/deadlines") return { title: "Calendário", subtitle: "Prazos e datas de entrega dos projetos" };
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

  const isChatPage = location.pathname === "/app/chat";
  const baseInfo = pageInfoFor(location, user);
  // No dashboard a topbar mostra só o título "Dashboard" — o resumo de boas-vindas
  // já vive no banner da própria página, sem repetir como subtítulo aqui.
  const pageInfo = {
    ...baseInfo,
    subtitle: location.pathname === "/app" ? "" : baseInfo.subtitle,
  };

  return (
    <NotificationsProvider>
      <SidebarContext.Provider value={{ collapsed }}>
        <div className="pagina-app">
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          <div className={`pagina-app__principal ${collapsed ? "pagina-app__principal--recolhida" : ""} ${isChatPage ? "pagina-app__principal--chat" : ""}`}>
            <Topbar
              onMenuClick={() => setMobileOpen(true)}
              title={pageInfo.title}
              subtitle={pageInfo.subtitle}
            />
            <main className={`pagina-app__conteudo ${isChatPage ? "pagina-app__conteudo--chat" : ""}`}>
              <div
                key={location.pathname}
                className={`pagina-app__pagina pagina-app__pagina--transicao ${isChatPage ? "pagina-app__pagina--chat" : ""}`}
              >
                <Suspense fallback={<div className="pagina-app__rota-carregando" aria-label="Carregando página" />}>
                  <Outlet />
                </Suspense>
              </div>
            </main>
          </div>
        </div>
      </SidebarContext.Provider>
    </NotificationsProvider>
  );
}


