import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Search, X, GraduationCap, Users, ChevronRight, AlertTriangle, FolderOpen } from "lucide-react";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { mapOrientando } from "../utils/adapters";
import { formatOrientandoSituacao } from "../utils/formatters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import "./AdvisorWorkspace.css";

const SITUACOES = [
  { key: "todas", rotulo: "Todos" },
  { key: "EM_ANDAMENTO", rotulo: "Em andamento" },
  { key: "ABERTO", rotulo: "Ativos" },
  { key: "FINALIZADO", rotulo: "Finalizados" },
  { key: "INATIVO", rotulo: "Inativos" },
];

function situacaoPillClass(situacao) {
  if (situacao === "EM_ANDAMENTO") return "advisor-etiqueta--roxo";
  if (situacao === "ABERTO") return "advisor-etiqueta--verde";
  if (situacao === "FINALIZADO") return "advisor-etiqueta--cinza";
  return "advisor-etiqueta--vermelho";
}

function iniciais(nome = "") {
  return String(nome)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function AvatarOrientando({ nome, src }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(src) && !failed;

  return (
    <div
      className="advisor-linha-card__icone"
      style={{ width: "2.75rem", height: "2.75rem", borderRadius: "var(--raio-completo)", background: "var(--gradiente-avatar)", color: "#f6f8f5", fontWeight: 700 }}
    >
      {showPhoto ? <img src={src} alt={`Foto de perfil de ${nome}`} onError={() => setFailed(true)} /> : iniciais(nome)}
    </div>
  );
}
function SkeletonLinha({ linhas = 5 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }}>
      {Array.from({ length: linhas }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--cor-superficie)",
            borderRadius: "var(--raio-grande)",
            border: "1px solid var(--cor-borda-clara)",
            padding: "var(--espaco-4)",
            display: "flex",
            gap: "var(--espaco-4)",
            alignItems: "center",
          }}
        >
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "var(--raio-completo)", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ width: "35%", height: 15 }} />
            <div className="skeleton" style={{ width: "55%", height: 12 }} />
            <div className="skeleton" style={{ width: "70%", height: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdvisorAdviseesPage() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("todas");

  const { data, loading, error } = useAsyncData(
    async () => {
      const raw = await advisorService.orientandos({
        busca: busca || undefined,
        situacao: situacao === "todas" ? undefined : situacao,
      });
      return (Array.isArray(raw) ? raw : []).map(mapOrientando);
    },
    [busca, situacao],
    { initialData: [] },
  );

  const orientandos = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return orientandos;
    return orientandos.filter(
      (o) => o.nome.toLowerCase().includes(termo) || o.ra.toLowerCase().includes(termo) || o.email.toLowerCase().includes(termo),
    );
  }, [orientandos, busca]);

  const normError = error ? normalizeError(error) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina"
    >
      <div className="advisor-hero advisor-hero--sem-sombra" style={{ padding: "var(--espaco-4)" }}>
        <h2 className="advisor-hero__titulo" style={{ fontSize: "var(--tamanho-titulo)" }}>
          Veja vínculos ativos
        </h2>
        <p className="advisor-hero__subtitulo">
          Acompanhe o progresso e as pendências de cada estudante sob sua orientação.
        </p>
      </div>

      <div className="advisor-toolbar">
        <div className="advisor-busca">
          <Search size={16} className="advisor-busca__icone" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="advisor-busca__input"
            placeholder="Buscar por nome, RA ou e-mail..."
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--cor-texto-mudo)",
                cursor: "pointer",
                padding: 4,
                borderRadius: "var(--raio-pequeno)",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="advisor-abas" role="tablist" aria-label="Filtro de situação">
        {SITUACOES.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={situacao === item.key}
            onClick={() => setSituacao(item.key)}
            className={`advisor-abas__botao ${situacao === item.key ? "advisor-abas__botao--ativo" : ""}`}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {loading && <SkeletonLinha linhas={5} />}

      {!loading && normError && (
        <StatusView title="Falha ao carregar orientandos" description={getErrorMessage(normError)} />
      )}

      {!loading && !normError && filtrados.length === 0 && (
        <div className="advisor-estado-vazio">
          <div className="advisor-estado-vazio__icone">
            <Users size={22} />
          </div>
          <h3 className="advisor-estado-vazio__titulo">Nenhum orientando encontrado</h3>
          <p className="advisor-estado-vazio__descricao">
            Quando um aluno tiver a inscrição aprovada em um dos seus projetos, ele aparecerá aqui.
          </p>
        </div>
      )}

      {!loading && !normError && filtrados.length > 0 && (
        <div className="advisor-lista">
          {filtrados.map((orientando, index) => (
            <motion.div
              key={orientando.alunoId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
              className="advisor-linha-card"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/app/advisees/${orientando.alunoId}`)}
            >
              <AvatarOrientando nome={orientando.nome} src={orientando.fotoPerfilUrl || orientando.avatarUrl} />

              <div className="advisor-linha-card__conteudo">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <p className="advisor-linha-card__titulo">{orientando.nome}</p>
                  <span className={`advisor-etiqueta ${situacaoPillClass(orientando.situacao)}`}>
                    {formatOrientandoSituacao(orientando.situacao)}
                  </span>
                  {orientando.pendencias > 0 && (
                    <span className="advisor-etiqueta advisor-etiqueta--vermelho">
                      <AlertTriangle size={12} style={{ marginRight: 4 }} />
                      {orientando.pendencias} pendência{orientando.pendencias > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="advisor-linha-card__meta">
                  {orientando.ra && <span>{orientando.ra} · </span>}
                  {orientando.curso && <span>{orientando.curso}</span>}
                  {orientando.projetos.length > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                      <FolderOpen size={12} /> {orientando.projetos.length} projeto{orientando.projetos.length > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <div className="advisor-barra-progresso" style={{ maxWidth: 220 }}>
                    <div
                      className="advisor-barra-progresso__preenchimento"
                      style={{ width: `${Math.min(100, Math.max(0, orientando.progresso))}%` }}
                    />
                  </div>
                  <span className="advisor-percentual">{orientando.progresso}%</span>
                </div>
              </div>

              <div className="advisor-linha-card__acoes">
                <span className="advisor-etiqueta advisor-etiqueta--cinza">
                  <GraduationCap size={12} style={{ marginRight: 4 }} />
                  {orientando.projetos.length} vínculo{orientando.projetos.length === 1 ? "" : "s"}
                </span>
                <ChevronRight size={16} style={{ color: "var(--cor-texto-mudo)" }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
