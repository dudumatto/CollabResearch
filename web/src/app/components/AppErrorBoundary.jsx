import { Component, useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import "./AppErrorBoundary.css";

const CHUNK_RELOAD_KEY = "collabresearch:chunk-reload-attempted";
const CHUNK_RELOAD_TTL_MS = 60_000;

function isChunkLoadError(error) {
  const message = String(error?.message ?? error ?? "");
  return /failed to fetch dynamically imported module|importing a module script failed|chunkloaderror|loading chunk/i.test(message);
}

function markReloadAttempt() {
  try {
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures. The manual reload action remains available.
  }
}

function recentlyAttemptedReload() {
  try {
    const value = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
    return value > 0 && Date.now() - value < CHUNK_RELOAD_TTL_MS;
  } catch {
    return false;
  }
}

export function recoverFromChunkLoadError(error) {
  if (typeof window === "undefined" || !isChunkLoadError(error) || recentlyAttemptedReload()) {
    return false;
  }

  markReloadAttempt();
  window.location.reload();
  return true;
}

function AppErrorFallback({ title = "Não foi possível carregar esta tela", description }) {
  const refresh = () => window.location.reload();
  const goHome = () => window.location.assign("/");

  return (
    <main className="app-error" role="alert">
      <section className="app-error__card">
        <span className="app-error__eyebrow">CollabResearch</span>
        <h1>{title}</h1>
        <p>
          {description ??
            "Atualizamos a aplicação e seu navegador ainda estava tentando abrir arquivos antigos. Recarregue a página para buscar a versão mais recente."}
        </p>
        <div className="app-error__actions">
          <button type="button" className="app-error__button app-error__button--primary" onClick={refresh}>
            Recarregar página
          </button>
          <button type="button" className="app-error__button" onClick={goHome}>
            Ir para o início
          </button>
        </div>
      </section>
    </main>
  );
}

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    recoverFromChunkLoadError(error);
  }

  render() {
    if (this.state.error) {
      return <AppErrorFallback />;
    }

    return this.props.children;
  }
}

export function RouteErrorFallback() {
  const error = useRouteError();

  useEffect(() => {
    recoverFromChunkLoadError(error);
  }, [error]);

  if (isRouteErrorResponse(error)) {
    return (
      <AppErrorFallback
        title={error.status === 404 ? "Página não encontrada" : "Não foi possível carregar esta tela"}
        description={error.statusText || error.data?.message}
      />
    );
  }

  return <AppErrorFallback />;
}
