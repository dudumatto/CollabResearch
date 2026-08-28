import { lazy } from "react";
import { createBrowserRouter, Navigate, useLocation, useParams } from "react-router";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RouteErrorFallback } from "./components/AppErrorBoundary";
import { features } from "./config/features";
import { useAuth } from "./hooks/useAuth";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const ProjectApplicationsPage = lazy(() => import("./pages/ProjectApplicationsPage"));
const ApplicationsPage = lazy(() => import("./pages/ApplicationsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const ProgressPage = lazy(() => import("./pages/ProgressPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const CreateProjectPage = lazy(() => import("./pages/CreateProjectPage"));
const EditProjectPage = lazy(() => import("./pages/EditProjectPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const AdvisorDashboardPage = lazy(() => import("./pages/AdvisorDashboardPage"));
const AdvisorProjectsPage = lazy(() => import("./pages/AdvisorProjectsPage"));
const AdvisorApplicationsPage = lazy(() => import("./pages/AdvisorApplicationsPage"));
const AdvisorAdviseesPage = lazy(() => import("./pages/AdvisorAdviseesPage"));
const AdvisorAdviseeDetailPage = lazy(() => import("./pages/AdvisorAdviseeDetailPage"));
const AdvisorProgressPage = lazy(() => import("./pages/AdvisorProgressPage"));
const AdvisorDeliveriesPage = lazy(() => import("./pages/AdvisorDeliveriesPage"));
const AdvisorEvaluationsPage = lazy(() => import("./pages/AdvisorEvaluationsPage"));
const AdvisorProfilePage = lazy(() => import("./pages/AdvisorProfilePage"));
const StudentDeliveriesPage = lazy(() => import("./pages/StudentDeliveriesPage"));
const StudentEvaluationsPage = lazy(() => import("./pages/StudentEvaluationsPage"));
const StudentDeadlinesPage = lazy(() => import("./pages/StudentDeadlinesPage"));

function useIsAdvisor() {
  const { user } = useAuth();
  return Boolean(features.advisorWorkspaceV2 && user?.tipo === "ORIENTADOR");
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
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorFallback />,
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
        element: <RoleAware advisor={AdvisorDeliveriesPage} student={StudentDeliveriesPage} />,
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
