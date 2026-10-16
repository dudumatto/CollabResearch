import { useEffect, useRef, useState } from "react";
import { CheckCircle, ClipboardText, ChatCircleText, LockSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { userService } from "../services/userService";
import { evaluationService } from "../services/evaluationService";
import { mapAvaliacaoAcademica, mapProject } from "../utils/adapters";
import { formatAvaliacaoNota, formatDate } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import { AppCombobox } from "../components/ui/AppCombobox";
import "./AdvisorWorkspace.css";

function Sk({ w = "100%", h = 14, r = "var(--raio-pequeno)", style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

function EvaluationsListSkeleton() {
  return [0, 1, 2].map((item) => (
    <div className="advisor-avaliacao" key={item}>
      <div className="advisor-avaliacao__cabecalho">
        <div style={{ flex: 1 }}>
          <Sk w="min(100%, 16rem)" h={18} />
          <Sk w="min(100%, 11rem)" h={12} style={{ marginTop: 10 }} />
        </div>
        <Sk w="5.5rem" h={28} r="var(--raio-completo)" />
      </div>

      <div className="advisor-notas">
        {[0, 1, 2, 3].map((nota) => (
          <div className="advisor-nota" key={nota}>
            <Sk w="70%" h={12} />
            <Sk w="2rem" h={18} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>

      <div className="advisor-avaliacao__comentario student-evaluations-page__comment">
        <Sk w="8rem" h={12} />
        <Sk w="100%" h={14} style={{ marginTop: 12 }} />
        <Sk w="68%" h={14} style={{ marginTop: 8 }} />
      </div>
    </div>
  ));
}

export default function StudentEvaluationsPage() {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState("");
  const [comments, setComments] = useState({});
  const hydratedInitialEvaluationsRef = useRef(null);

  const { data, loading: loadingProjects, error: projectsError } = useAsyncData(
    async () => {
      if (!user?.id) return { projects: [], initialProjectId: "", initialEvaluations: [] };

      const projectsResult = await userService.getProjects(user.id).catch(() => []);
      const projects = Array.isArray(projectsResult) ? projectsResult.map(mapProject) : [];
      const initialProjectId = projects[0]?.id ? String(projects[0].id) : "";
      const initialEvaluations = initialProjectId
        ? await evaluationService
            .list(initialProjectId)
            .then((items) => (Array.isArray(items) ? items.map(mapAvaliacaoAcademica) : []))
            .catch(() => [])
        : [];

      return { projects, initialProjectId, initialEvaluations };
    },
    [user?.id],
    { initialData: { projects: [], initialProjectId: "", initialEvaluations: [] } },
  );

  const projects = data?.projects ?? [];
  const initialProjectId = data?.initialProjectId ?? "";
  const effectiveProjectId = projectId || initialProjectId;

  useEffect(() => {
    if (!projectId && initialProjectId) setProjectId(initialProjectId);
  }, [initialProjectId, projectId]);

  const { data: evaluations, loading, error, reload } = useAsyncData(
    async () => {
      if (!effectiveProjectId) return [];

      const currentProjectKey = String(effectiveProjectId);
      if (
        currentProjectKey === String(initialProjectId) &&
        hydratedInitialEvaluationsRef.current !== currentProjectKey &&
        Array.isArray(data?.initialEvaluations)
      ) {
        hydratedInitialEvaluationsRef.current = currentProjectKey;
        return data.initialEvaluations;
      }

      const items = await evaluationService.list(effectiveProjectId);
      return Array.isArray(items) ? items.map(mapAvaliacaoAcademica) : [];
    },
    [effectiveProjectId, initialProjectId, data?.initialEvaluations],
    { initialData: [] },
  );

  const acknowledge = async (evaluation) => {
    try {
      await evaluationService.acknowledge(effectiveProjectId, evaluation.id, comments[evaluation.id] || "");
      await reload();
      toast.success("Ciência registrada.");
    } catch (err) {
      toast.error(err.message || "Não foi possível registrar a ciência.");
    }
  };

  if (projectsError) {
    return <StatusView title="Falha ao carregar projetos" description={projectsError.message} />;
  }

  if (!loadingProjects && !projects.length && !projectId) {
    return (
      <div className="advisor-pagina student-evaluations-page">
        <div className="advisor-estado-vazio">
          <div className="advisor-estado-vazio__icone"><ClipboardText size={24} /></div>
          <h2 className="advisor-estado-vazio__titulo">Nenhum projeto vinculado</h2>
          <p className="advisor-estado-vazio__descricao">As avaliações aparecerão aqui quando você participar de um projeto aprovado.</p>
        </div>
      </div>
    );
  }

  const medias = evaluations.map((item) => Number(item.media)).filter(Number.isFinite);
  const mediaGeral = medias.length ? medias.reduce((sum, value) => sum + value, 0) / medias.length : null;
  const pendentes = evaluations.filter((item) => !item.cienciaRegistrada).length;

  return (
    <div className="advisor-pagina student-page student-evaluations-page">
      <div className="advisor-card-conteudo student-page__header">
        <div className="student-page__header-topo">
          <div>
            <h2 className="advisor-card-conteudo__titulo">Minhas avaliações</h2>
            <p className="student-page__descricao"><LockSimple size={14} /> Avaliações acadêmicas são privadas entre você e seu orientador.</p>
          </div>
          {loadingProjects ? (
            <Sk w="min(100%, 18rem)" h={42} r="var(--raio-medio)" />
          ) : (
          <AppCombobox
            ariaLabel="Selecionar projeto avaliado"
            className="advisor-select student-page__select"
            value={effectiveProjectId}
            onChange={setProjectId}
            options={projects.map((item) => ({ value: item.id, label: item.title }))}
          />
          )}
        </div>
        <div className="student-resumo">
          <div className="student-resumo__item"><strong>{evaluations.length}</strong><span>Avaliações</span></div>
          <div className="student-resumo__item student-resumo__item--verde"><strong>{formatAvaliacaoNota(mediaGeral)}</strong><span>Média geral</span></div>
          <div className="student-resumo__item student-resumo__item--amarelo"><strong>{pendentes}</strong><span>Ciência pendente</span></div>
        </div>
      </div>

      {(loadingProjects || loading) && <EvaluationsListSkeleton />}
      {error && <StatusView title="Falha ao carregar avaliações" description={error.message} />}
      {!loadingProjects && !loading && !error && evaluations.length === 0 && (
        <div className="advisor-estado-vazio">
          <div className="advisor-estado-vazio__icone"><ClipboardText size={24} /></div>
          <h3 className="advisor-estado-vazio__titulo">Nenhuma avaliação registrada</h3>
          <p className="advisor-estado-vazio__descricao">As avaliações aparecerão após a conclusão das etapas.</p>
        </div>
      )}

      {!loading && evaluations.map((item) => (
        <div className={`advisor-avaliacao student-avaliacao${item.cienciaRegistrada ? "" : " student-avaliacao--pendente"}`} key={item.id}>
          <div className="advisor-avaliacao__cabecalho">
            <div>
              <strong className="advisor-avaliacao__aluno">{item.etapaTitulo || "Etapa do projeto"}</strong>
              <p className="advisor-avaliacao__etapa">
                Orientador: {item.orientadorNome || "-"}
                {item.criadaEm && ` · ${formatDate(item.criadaEm)}`}
              </p>
            </div>
            <div className="student-avaliacao__media">
              <strong>{formatAvaliacaoNota(item.media)}</strong>
              <span>média / 5</span>
            </div>
          </div>

          <div className="advisor-notas">
            {[
              ["Participação", item.participacao],
              ["Qualidade técnica", item.qualidadeTecnica],
              ["Prazos", item.cumprimentoDePrazos],
              ["Comunicação", item.comunicacao],
            ].map(([label, value]) => (
              <div className={`advisor-nota student-nota student-nota--${value >= 4 ? "alta" : value >= 3 ? "media" : "baixa"}`} key={label}>
                <span className="advisor-nota__rotulo">{label}</span>
                <strong className="advisor-nota__valor">{value}/5</strong>
                <div className="student-nota__barra" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={5} aria-valuenow={value}>
                  <span style={{ width: `${Math.min(100, (value / 5) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="advisor-avaliacao__comentario student-evaluations-page__comment">
            <span><ChatCircleText size={15} /> Comentário do orientador</span>
            <p>{item.comentarioOrientador || "Nenhum comentário informado pelo orientador."}</p>
          </div>

          {item.cienciaRegistrada ? (
            <div className="student-ciencia student-ciencia--ok">
              <CheckCircle size={18} weight="fill" />
              <div>
                <strong>Ciência registrada{item.dataCiencia && ` em ${formatDate(item.dataCiencia)}`}</strong>
                {item.comentarioAluno && <p>{item.comentarioAluno}</p>}
              </div>
            </div>
          ) : (
            <div className="student-ciencia">
              <label className="advisor-campo">
                <span className="advisor-campo__rotulo">Seu comentário (opcional)</span>
                <textarea
                  className="advisor-campo__input student-ciencia__texto"
                  rows={2}
                  placeholder="Escreva uma resposta ao orientador"
                  value={comments[item.id] || ""}
                  maxLength={2000}
                  onChange={(e) => setComments({ ...comments, [item.id]: e.target.value })}
                />
              </label>
              <button className="advisor-botao advisor-botao--primario" type="button" onClick={() => acknowledge(item)}>
                <CheckCircle size={15} />
                Registrar ciência
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

