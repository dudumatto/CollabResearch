import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { MagnifyingGlass, X, GraduationCap, Users, CaretRight, Warning, FolderOpen } from "@phosphor-icons/react";
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
  if (situacao === "EM_ANDAMENTO") return "advisor-etiqueta--amarelo";
  if (situacao === "ABERTO") return "advisor-etiqueta--verde";
  if (situacao === "FINALIZADO") return "advisor-etiqueta--vermelho";
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
  const comPendencias = orientandos.filter((o) => o.pendencias > 0).length;
  const progressoMedio = orientandos.length ? Math.round(orientandos.reduce((sum, o) => sum + o.progresso, 0) / orientandos.length) : 0;
  const totalProjetos = new Set(orientandos.flatMap((o) => o.projetos.map((p) => p.projetoId))).size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina student-page"
    >
      <div className="advisor-card-conteudo student-page__header">
        <div className="student-page__header-topo">
          <div>
            <h2 className="advisor-card-conteudo__titulo">Meus orientandos</h2>
            <p className="student-page__descricao">Acompanhe o progresso e as pendências de cada estudante sob sua orientação.</p>
          </div>
        <div className="advisor-busca student-page__select">
          <MagnifyingGlass size={16} className="advisor-busca__icone" />
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
        <div className="student-resumo">
          <div className="student-resumo__item"><strong>{orientandos.length}</strong><span>Orientandos</span></div>
          <div className="student-resumo__item"><strong>{totalProjetos}</strong><span>Projetos</span></div>
          <div className="student-resumo__item student-resumo__item--verde"><strong>{progressoMedio}%</strong><span>Progresso médio</span></div>
          <div className="student-resumo__item student-resumo__item--vermelho"><strong>{comPendencias}</strong><span>Com pendências</span></div>
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
        <div className="advisee-grade">
          {filtrados.map((orientando, index) => (
            <motion.button
              type="button"
              key={orientando.alunoId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
              className={`advisee-card${orientando.pendencias > 0 ? " advisee-card--pendente" : ""}`}
              onClick={() => navigate(`/app/advisees/${orientando.alunoId}`)}
            >
              <div className="advisee-card__topo">
                <AvatarOrientando nome={orientando.nome} src={orientando.fotoPerfilUrl || orientando.avatarUrl} />
                <div className="advisor-linha-card__conteudo">
                  <p className="advisor-linha-card__titulo advisee-card__nome">{orientando.nome}</p>
                  <p className="advisor-linha-card__meta">{[orientando.ra, orientando.curso].filter(Boolean).join(" · ") || orientando.email}</p>
                </div>
                <span className={`advisor-etiqueta ${situacaoPillClass(orientando.situacao)}`}>
                  {formatOrientandoSituacao(orientando.situacao)}
                </span>
              </div>

              {orientando.projetos.length > 0 && (
                <div className="advisee-card__projetos">
                  {orientando.projetos.slice(0, 2).map((p) => (
                    <span className="advisee-card__projeto" key={p.projetoId} title={p.projetoTitulo}>
                      <FolderOpen size={12} /><span>{p.projetoTitulo}</span>
                    </span>
                  ))}
                  {orientando.projetos.length > 2 && <span className="advisee-card__projeto">+{orientando.projetos.length - 2}</span>}
                </div>
              )}

              <div className="advisee-card__progresso">
                <div className="advisee-card__progresso-rotulo">
                  <span>Progresso</span>
                  <span className="advisor-percentual">{orientando.progresso}%</span>
                </div>
                <div className="advisor-barra-progresso" role="progressbar" aria-label={`Progresso de ${orientando.nome}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={orientando.progresso}>
                  <div
                    className="advisor-barra-progresso__preenchimento"
                    style={{ width: `${Math.min(100, Math.max(0, orientando.progresso))}%` }}
                  />
                </div>
              </div>

              <div className="advisee-card__rodape">
                {orientando.pendencias > 0 ? (
                  <span className="advisee-card__pendencias">
                    <Warning size={14} weight="fill" />
                    {orientando.pendencias} pendência{orientando.pendencias > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="advisee-card__ok"><GraduationCap size={14} /> Sem pendências</span>
                )}
                <span className="advisee-card__link">Ver detalhes <CaretRight size={14} /></span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
