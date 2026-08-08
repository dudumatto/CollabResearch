import { createBrowserRouter, Navigate, useLocation, useParams } from "react-router";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { features } from "./config/features";
import { useAuth } from "./hooks/useAuth";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectApplicationsPage from "./pages/ProjectApplicationsPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ChatPage from "./pages/ChatPage";
import ProgressPage from "./pages/ProgressPage";
import FeedbackPage from "./pages/FeedbackPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import CreateProjectPage from "./pages/CreateProjectPage";
import EditProjectPage from "./pages/EditProjectPage";
import UserProfilePage from "./pages/UserProfilePage";
import AdvisorDashboardPage from "./pages/AdvisorDashboardPage";
import AdvisorProjectsPage from "./pages/AdvisorProjectsPage";
import AdvisorApplicationsPage from "./pages/AdvisorApplicationsPage";
import AdvisorAdviseesPage from "./pages/AdvisorAdviseesPage";
import AdvisorAdviseeDetailPage from "./pages/AdvisorAdviseeDetailPage";
import AdvisorProgressPage from "./pages/AdvisorProgressPage";
import AdvisorDeliveriesPage from "./pages/AdvisorDeliveriesPage";
import AdvisorEvaluationsPage from "./pages/AdvisorEvaluationsPage";
import AdvisorProfilePage from "./pages/AdvisorProfilePage";

function useIsAdvisor() {
  const { user } = useAuth();
  return Boolean(features.advisorWorkspaceV2 && user?.tipo === "ORIENTADOR");
}

function RoleAware({ advisor: AdvisorComponent, student: StudentComponent }) {
  const isAdvisor = useIsAdvisor();
  return isAdvisor ? <AdvisorComponent /> : <StudentComponent />;
}

function AdvisorOnly({ children }) {
  const isAdvisor = useIsAdvisor();
  if (!isAdvisor) return <Navigate replace to="/app" />;
  return children;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
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
      { path: "projects/:id/applications", Component: ProjectApplicationsPage },
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
        element: (
          <AdvisorOnly>
            <AdvisorEvaluationsPage />
          </AdvisorOnly>
        ),
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
      { path: "feedback", Component: FeedbackPage },
      {
        path: "profile",
        element: <RoleAware advisor={AdvisorProfilePage} student={ProfilePage} />,
      },
      { path: "documents", Component: ProfilePage },
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
