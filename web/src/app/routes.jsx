import { lazy } from "react";
import { createBrowserRouter, Navigate, useLocation, useParams, useRouteError } from "react-router";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RouteErrorFallback } from "./components/AppErrorBoundary";
import { useAuth } from "./hooks/useAuth";
import { StatusView } from "./components/StatusView";


const ROUTE_CHUNK_RELOAD_KEY = "collabresearch:route-chunk-reload";

function isRouteChunkError(error) {
  const message = String(error?.message ?? error ?? "");
  return (
    error?.name === "ChunkLoadError" ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("Loading chunk")
  );
}

function lazyRoute(importer) {
  return lazy(async () => {
    try {
      const module = await importer();
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(ROUTE_CHUNK_RELOAD_KEY);
      }
      return module;
    } catch (error) {
      if (typeof window !== "undefined" && isRouteChunkError(error)) {
        const reloadMarker = `${window.location.pathname}${window.location.search}`;
        if (sessionStorage.getItem(ROUTE_CHUNK_RELOAD_KEY) !== reloadMarker) {
          sessionStorage.setItem(ROUTE_CHUNK_RELOAD_KEY, reloadMarker);
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw error;
    }
  });
}

function RouteErrorView() {
  const error = useRouteError();
  const isChunkError = isRouteChunkError(error);

  return (
    <div style={{ padding: "1rem", minHeight: "100vh", background: "var(--cor-fundo)" }}>
      <StatusView
        title={isChunkError ? "Atualização necessária" : "Não foi possível abrir esta página"}
        description={
          isChunkError
            ? "A versão da página no navegador está desatualizada. Recarregue para baixar os arquivos mais recentes."
            : "Recarregue a página e tente novamente."
        }
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              border: 0,
              borderRadius: "0.75rem",
              background: "var(--cor-primaria)",
              color: "var(--cor-branco)",
              cursor: "pointer",
              fontWeight: 700,
              padding: "0.75rem 1rem",
            }}
          >
            Recarregar
          </button>
        }
      />
    </div>
  );
}

const LandingPage = lazyRoute(() => import("./pages/LandingPage"));
const LoginPage = lazyRoute(() => import("./pages/LoginPage"));
const RegisterPage = lazyRoute(() => import("./pages/RegisterPage"));
const DashboardPage = lazyRoute(() => import("./pages/DashboardPage"));
const ProjectsPage = lazyRoute(() => import("./pages/ProjectsPage"));
const ProjectDetailPage = lazyRoute(() => import("./pages/ProjectDetailPage"));
const ProjectApplicationsPage = lazyRoute(() => import("./pages/ProjectApplicationsPage"));
const ApplicationsPage = lazyRoute(() => import("./pages/ApplicationsPage"));
const ChatPage = lazyRoute(() => import("./pages/ChatPage"));
const ProgressPage = lazyRoute(() => import("./pages/ProgressPage"));
const ProfilePage = lazyRoute(() => import("./pages/ProfilePage"));
const NotificationsPage = lazyRoute(() => import("./pages/NotificationsPage"));
const SettingsPage = lazyRoute(() => import("./pages/SettingsPage"));
const CreateProjectPage = lazyRoute(() => import("./pages/CreateProjectPage"));
const EditProjectPage = lazyRoute(() => import("./pages/EditProjectPage"));
const UserProfilePage = lazyRoute(() => import("./pages/UserProfilePage"));
const AdvisorDashboardPage = lazyRoute(() => import("./pages/AdvisorDashboardPage"));
const AdvisorProjectsPage = lazyRoute(() => import("./pages/AdvisorProjectsPage"));
const AdvisorApplicationsPage = lazyRoute(() => import("./pages/AdvisorApplicationsPage"));
const AdvisorAdviseesPage = lazyRoute(() => import("./pages/AdvisorAdviseesPage"));
const AdvisorAdviseeDetailPage = lazyRoute(() => import("./pages/AdvisorAdviseeDetailPage"));
const AdvisorProgressPage = lazyRoute(() => import("./pages/AdvisorProgressPage"));
const AdvisorDeliveriesPage = lazyRoute(() => import("./pages/AdvisorDeliveriesPage"));
const AdvisorEvaluationsPage = lazyRoute(() => import("./pages/AdvisorEvaluationsPage"));
const AdvisorProfilePage = lazyRoute(() => import("./pages/AdvisorProfilePage"));
const StudentEvaluationsPage = lazyRoute(() => import("./pages/StudentEvaluationsPage"));
const StudentDeadlinesPage = lazyRoute(() => import("./pages/StudentDeadlinesPage"));

function useIsAdvisor() {
  const { user } = useAuth();
  return user?.tipo === "ORIENTADOR";
}

function RoleAware({ advisor: AdvisorComponent, student: StudentComponent }) {
  const isAdvisor = useIsAdvisor();
  return isAdvisor ? <AdvisorComponent /> : <StudentComponent />;
}

function AdvisorOnly({ children }) {
  return <ProtectedRoute allowedRoles={["ORIENTADOR"]}>{children}</ProtectedRoute>;
}

function StudentOnly({ children }) {
  return <ProtectedRoute allowedRoles={["ALUNO"]}>{children}</ProtectedRoute>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/login",
    Component: LoginPage,
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/register",
    Component: RegisterPage,
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/projetos/:id/inscricoes",
    element: <NavigateToProjectApplications />,
  },
  {
    path: "/projetos/:id",
    element: <NavigateToProject />,
  },
  {
    path: "/projetos",
    element: <Navigate to="/app/projects" replace />,
  },
  {
    path: "/usuarios/me/inscricoes",
    element: <Navigate to="/app/applications" replace />,
  },
  {
    path: "/minhas-inscricoes",
    element: <Navigate to="/app/applications" replace />,
  },
  {
    path: "/inscricoes",
    element: <Navigate to="/app/projects" replace />,
  },
  {
    path: "/meus-projetos",
    element: <Navigate to="/app/projects" replace />,
  },
  {
    path: "/conversas",
    element: <Navigate to="/app/chat" replace />,
  },
  {
    path: "/conversas/:id",
    element: <NavigateToChatConversation />,
  },
  {
    path: "/app",
    errorElement: <RouteErrorView />,
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RoleAware advisor={AdvisorDashboardPage} student={DashboardPage} />,
      },
      {
        path: "projects",
        element: <RoleAware advisor={AdvisorProjectsPage} student={ProjectsPage} />,
      },
      { path: "projects/new", Component: CreateProjectPage },
      { path: "projects/:id/edit", Component: EditProjectPage },
      {
        path: "projects/:id/applications",
        element: <AdvisorOnly><ProjectApplicationsPage /></AdvisorOnly>,
      },
      { path: "projects/:id", Component: ProjectDetailPage },
      {
        path: "projects/:id/deliveries",
        element: (
          <AdvisorOnly>
            <AdvisorDeliveriesPage />
          </AdvisorOnly>
        ),
      },
      {
        path: "projects/:id/evaluations",
        element: (
          <AdvisorOnly>
            <AdvisorEvaluationsPage />
          </AdvisorOnly>
        ),
      },
      {
        path: "applications",
        element: <RoleAware advisor={AdvisorApplicationsPage} student={ApplicationsPage} />,
      },
      { path: "chat", Component: ChatPage },
      {
        path: "progress",
        element: <RoleAware advisor={AdvisorProgressPage} student={ProgressPage} />,
      },
      {
        path: "deliveries",
        element: (
          <AdvisorOnly>
            <AdvisorDeliveriesPage />
          </AdvisorOnly>
        ),
      },
      {
        path: "avaliacoes",
        element: <RoleAware advisor={AdvisorEvaluationsPage} student={StudentEvaluationsPage} />,
      },
      {
        path: "advisees",
        element: (
          <AdvisorOnly>
            <AdvisorAdviseesPage />
          </AdvisorOnly>
        ),
      },
      {
        path: "advisees/:id",
        element: (
          <AdvisorOnly>
            <AdvisorAdviseeDetailPage />
          </AdvisorOnly>
        ),
      },
      {
        path: "deadlines",
        Component: StudentDeadlinesPage,
      },
      {
        path: "profile",
        element: <RoleAware advisor={AdvisorProfilePage} student={ProfilePage} />,
      },
      {
        path: "documents",
        element: <StudentOnly><ProfilePage /></StudentOnly>,
      },
      { path: "notifications", Component: NotificationsPage },
      { path: "configuracoes", Component: SettingsPage },
      { path: "users/:id", Component: UserProfilePage },
    ],
  },
]);

function NavigateToProjectApplications() {
  const { id } = useParams();
  return <Navigate to={`/app/projects/${id}/applications`} replace />;
}

function NavigateToProject() {
  const { id } = useParams();
  return <Navigate to={`/app/projects/${id}`} replace />;
}

function NavigateToChatConversation() {
  const { id } = useParams();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set("conversationId", id);
  return <Navigate to={`/app/chat?${params.toString()}`} replace />;
}


