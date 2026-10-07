import { Bell, List, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useNotifications } from "../providers/NotificationsProvider";
import { userService } from "../services/userService";
import { getInitials, formatUserType } from "../utils/formatters";
import { prefetchRoute } from "../routes";
import "./Topbar.css";

const normalizar = (texto) =>
  (texto ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function Topbar({ onMenuClick, title, subtitle }) {
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((item) => !item.read).length;

  const [busca, setBusca] = useState("");
  const [aberta, setAberta] = useState(false); // dropdown de resultados aberto
  const [mobileAberta, setMobileAberta] = useState(false); // campo expandido em telas estreitas
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const carregadoRef = useRef(false);
  const buscaRef = useRef(null);
  const wrapRef = useRef(null);

  // Carrega a lista de usuarios uma unica vez (sob demanda, ao focar a busca).
  const carregarUsuarios = useCallback(async () => {
    if (carregadoRef.current || carregando) return;
    carregadoRef.current = true;
    setCarregando(true);
    try {
      const dados = await userService.list();
      const lista = Array.isArray(dados) ? dados : dados?.content ?? [];
      setUsuarios(lista);
    } catch {
      carregadoRef.current = false; // permite tentar de novo
    } finally {
      setCarregando(false);
    }
  }, [carregando]);

  // Atalho CTRL/CMD + K foca a busca.
  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMobileAberta(true);
        carregarUsuarios();
        requestAnimationFrame(() => buscaRef.current?.focus());
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [carregarUsuarios]);

  // Fecha o dropdown ao clicar fora.
  useEffect(() => {
    if (!aberta && !mobileAberta) return;
    const handleClickFora = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setAberta(false);
        setMobileAberta(false);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [aberta, mobileAberta]);

  const termo = normalizar(busca.trim());
  const resultados = termo
    ? usuarios
        .filter((u) => {
          // Admins são exclusivos do desktop: não aparecem na busca do web.
          if (String(u.tipo ?? "").toUpperCase() === "ADMIN") return false;
          const alvo = `${normalizar(u.nome)} ${normalizar(u.email)}`;
          return alvo.includes(termo);
        })
        .slice(0, 8)
    : [];

  const irParaPerfil = (id) => {
    setBusca("");
    setAberta(false);
    setMobileAberta(false);
    navigate(`/app/users/${id}`);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (resultados.length > 0) irParaPerfil(resultados[0].id);
  };

  const abrirBuscaMobile = () => {
    setMobileAberta(true);
    carregarUsuarios();
    requestAnimationFrame(() => buscaRef.current?.focus());
  };

  return (
    <header className={`barra-topo ${mobileAberta ? "barra-topo--busca-aberta" : ""}`}>
      <div className="barra-topo__secao-esquerda">
        <button onClick={onMenuClick} className="barra-topo__botao-menu" aria-label="Abrir menu lateral">
          <List size={20} className="barra-topo__botao-menu-icone" />
        </button>
        <div className="barra-topo__area-titulo">
          <h1 className="barra-topo__titulo">{title}</h1>
          {subtitle && <p className="barra-topo__subtitulo">{subtitle}</p>}
        </div>
      </div>

      <div className="barra-topo__secao-direita">
        <div
          ref={wrapRef}
          className={`barra-topo__busca-wrap ${mobileAberta ? "barra-topo__busca-wrap--aberta" : ""}`}
        >
          {/* Em telas estreitas a busca vira só este ícone. */}
          <button
            type="button"
            className="barra-topo__busca-botao"
            aria-label="Buscar perfis"
            onClick={abrirBuscaMobile}
          >
            <MagnifyingGlass size={20} className="barra-topo__busca-icone" aria-hidden="true" />
          </button>

          <form className="barra-topo__busca" role="search" onSubmit={handleSearch}>
            <MagnifyingGlass size={16} className="barra-topo__busca-icone" aria-hidden="true" />
            <input
              ref={buscaRef}
              type="search"
              className="barra-topo__busca-campo"
              placeholder="Buscar perfis..."
              aria-label="Buscar perfis"
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setAberta(true);
              }}
              onFocus={() => {
                carregarUsuarios();
                setAberta(true);
              }}
            />
            {mobileAberta ? (
              <button
                type="button"
                className="barra-topo__busca-fechar"
                aria-label="Fechar busca"
                onClick={() => {
                  setBusca("");
                  setMobileAberta(false);
                  setAberta(false);
                }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            ) : (
              <kbd className="barra-topo__busca-atalho" aria-hidden="true">CTRL+K</kbd>
            )}
          </form>

          {aberta && termo && (
            <div className="barra-topo__resultados" role="listbox">
              {carregando && resultados.length === 0 ? (
                <p className="barra-topo__resultado-vazio">Carregando...</p>
              ) : resultados.length === 0 ? (
                <p className="barra-topo__resultado-vazio">Nenhum perfil encontrado.</p>
              ) : (
                resultados.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    role="option"
                    className="barra-topo__resultado"
                    onClick={() => irParaPerfil(u.id)}
                    onMouseEnter={() => prefetchRoute(`/app/users/${u.id}`)}
                  >
                    {u.fotoPerfilUrl ? (
                      <img className="barra-topo__resultado-avatar" src={u.fotoPerfilUrl} alt="" />
                    ) : (
                      <span className="barra-topo__resultado-avatar barra-topo__resultado-avatar--iniciais">
                        {getInitials(u.nome)}
                      </span>
                    )}
                    <span className="barra-topo__resultado-info">
                      <span className="barra-topo__resultado-nome">{u.nome}</span>
                      <span className="barra-topo__resultado-papel">{formatUserType(u.tipo)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <span className="barra-topo__divisor-acoes" aria-hidden="true" />

        <button
          onClick={() => navigate("/app/notifications")}
          onMouseEnter={() => prefetchRoute("/app/notifications")}
          onFocus={() => prefetchRoute("/app/notifications")}
          className="barra-topo__botao-notificacoes"
          aria-label="Notificações"
        >
          <Bell size={20} className="barra-topo__icone-notificacoes" />
          {unreadCount > 0 && (
            <span className="barra-topo__contador-notificacoes">{unreadCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
