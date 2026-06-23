"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, User, FolderOpen, Loader2 } from "lucide-react";
import { userService } from "../services/userService";
import { projectService } from "../services/projectService";

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function SearchModal({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ users: [], projects: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();
  const navigate = (path) => router.push(path);
  const debouncedQuery = useDebounce(query);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ users: [], projects: [] });
      return;
    }

    setLoading(true);
    const q = debouncedQuery.trim().toLowerCase();

    Promise.all([
      userService.list().catch(() => []),
      projectService.findByBusca(debouncedQuery).catch(() => []),
    ]).then(([usersRaw, projectsRaw]) => {

      // Normaliza usuários - aceita array direto ou { content: [] }
      const usersList = Array.isArray(usersRaw)
        ? usersRaw
        : usersRaw?.content ?? usersRaw?.data ?? [];

      const users = Array.from(
        new Map(usersList.map(u => [u.id, u])).values()
      )
      .filter((u) =>
        u?.nome?.toLowerCase().includes(q) ||
        u?.email?.toLowerCase().includes(q)
      )
      .slice(0, 6);

      // Normaliza projetos
      const projectsList = Array.isArray(projectsRaw)
        ? projectsRaw
        : projectsRaw?.content ?? projectsRaw?.data ?? [];

      const uniqueProjects = Array.from(
        new Map(projectsList.map(p => [p.id, p])).values()
      );

      const projects = uniqueProjects.slice(0, 6);

      setResults({ users, projects });
    }).finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleUser = (user) => {
    onClose();
    navigate(`/app/users/${user.id}`);
  };

  const handleProject = (project) => {
    onClose();
    navigate(`/app/projects/${project.id}`);
  };

  const hasResults = results.users.length > 0 || results.projects.length > 0;
  const showEmpty = !loading && debouncedQuery.trim() && !hasResults;

  return (
    <div className="search-modal__overlay" onClick={onClose}>
      <div className="search-modal__painel" role="dialog" aria-modal="true" aria-label="Busca global" onClick={(e) => e.stopPropagation()}>

        <div className="search-modal__input-wrapper">
          <Search size={16} className="search-modal__icone-busca" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuários e projetos..."
            className="search-modal__input"
            aria-label="Buscar usuários e projetos"
          />
          {loading && <Loader2 size={16} className="search-modal__spinner" aria-hidden="true" />}
          <button className="search-modal__fechar" type="button" aria-label="Fechar busca" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {(hasResults || showEmpty || debouncedQuery.trim()) && (
          <div className="search-modal__resultados">

            {results.users.length > 0 && (
              <div className="search-modal__secao">
                <p className="search-modal__secao-titulo">Usuários</p>
                {results.users.map((u) => (
                  <button
                    key={u.id}
                    className="search-modal__item"
                    onClick={() => handleUser(u)}
                  >
                    <div className="search-modal__item-avatar" aria-hidden="true">
                      {getInitials(u.nome)}
                    </div>
                    <div className="search-modal__item-info">
                      <p className="search-modal__item-nome">{u.nome}</p>
                      <p className="search-modal__item-meta">{u.email}</p>
                    </div>
                    <User size={14} className="search-modal__item-icone" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}

            {results.projects.length > 0 && (
              <div className="search-modal__secao">
                <p className="search-modal__secao-titulo">Projetos</p>
                {results.projects.map((p) => (
                  <button
                    key={p.id}
                    className="search-modal__item"
                    onClick={() => handleProject(p)}
                  >
                    <div className="search-modal__item-avatar search-modal__item-avatar--projeto" aria-hidden="true">
                      <FolderOpen size={14} aria-hidden="true" />
                    </div>
                    <div className="search-modal__item-info">
                      <p className="search-modal__item-nome">{p.titulo ?? p.title ?? "Projeto"}</p>
                      <p className="search-modal__item-meta">{p.area ?? p.areaPesquisa ?? "-"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showEmpty && (
              <div className="search-modal__vazio">
                <p>Nenhum resultado para &quot;<strong>{debouncedQuery}</strong>&quot;</p>
              </div>
            )}

            {loading && (
              <div className="search-modal__vazio">
                <p>Buscando...</p>
              </div>
            )}
          </div>
        )}

        {!debouncedQuery.trim() && (
          <div className="search-modal__dica">
            <p>Digite para buscar usuários e projetos</p>
          </div>
        )}
      </div>
    </div>
  );
}



