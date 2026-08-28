import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./providers/AuthProvider";
import { ThemeProvider } from "./providers/ThemeProvider";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppErrorBoundary>
          <Suspense fallback={<div className="app-route-loading" aria-label="Carregando página" />}>
            <RouterProvider router={router} />
          </Suspense>
        </AppErrorBoundary>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}
