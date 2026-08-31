import { useEffect, useState } from "react";
import { CheckCircle, ClipboardList, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { userService } from "../services/userService";
import { evaluationService } from "../services/evaluationService";
import { mapAvaliacaoAcademica, mapProject } from "../utils/adapters";
import { formatAvaliacaoNota } from "../utils/formatters";
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

function StudentEvaluationsSkeleton() {
  return (
    <div className="advisor-pagina student-evaluations-page" aria-busy="true" aria-label="Carregando avaliações">
      <div className="advisor-card-conteudo">
        <Sk w="12rem" h={22} />
        <Sk w="min(100%, 24rem)" h={14} style={{ marginTop: 12 }} />
        <Sk w="min(100%, 18rem)" h={42} r="var(--raio-medio)" style={{ marginTop: 18 }} />
      </div>
      <EvaluationsListSkeleton />
    </div>
  );
}

export default function StudentEvaluationsPage() {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState("");
  const [comments, setComments] = useState({});

  const { data: projects, loading: loadingProjects, error: projectsError } = useAsyncData(
    async () => (user?.id ? (await userService.getProjects(user.id)).map(mapProject) : []),
    [user?.id],
    { initialData: [] },
  );

  useEffect(() => {
    if (!projectId && projects[0]?.id) setProjectId(String(projects[0].id));
  }, [projects, projectId]);

  const { data: evaluations, loading, error, reload } = useAsyncData(
    async () => (projectId ? (await evaluationService.list(projectId)).map(mapAvaliacaoAcademica) : []),
    [projectId],
    { initialData: [] },
  );

  const acknowledge = async (evaluation) => {
    try {
      await evaluationService.acknowledge(projectId, evaluation.id, comments[evaluation.id] || "");
      await reload();
      toast.success("Ciência registrada.");
    } catch (err) {
      toast.error(err.message || "Não foi possível registrar a ciência.");
    }
  };

  if (loadingProjects) {
    return <StudentEvaluationsSkeleton />;
  }

  if (projectsError) {
    return <StatusView title="Falha ao carregar projetos" description={projectsError.message} />;
  }

  if (!projects.length && !projectId) {
    return (
      <div className="advisor-pagina student-evaluations-page">
        <div className="advisor-estado-vazio">
          <div className="advisor-estado-vazio__icone"><ClipboardList size={24} /></div>
          <h2 className="advisor-estado-vazio__titulo">Nenhum projeto vinculado</h2>
          <p className="advisor-estado-vazio__descricao">As avaliações aparecerão aqui quando você participar de um projeto aprovado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="advisor-pagina student-evaluations-page">
      <div className="advisor-card-conteudo">
        <h2 className="advisor-card-conteudo__titulo">Minhas avaliações</h2>
        <p>Avaliações acadêmicas são privadas entre você e seu orientador.</p>
        <AppCombobox
          ariaLabel="Selecionar projeto avaliado"
          className="advisor-select"
          value={projectId}
          onChange={setProjectId}
          options={projects.map((item) => ({ value: item.id, label: item.title }))}
        />
      </div>

      {loading && <EvaluationsListSkeleton />}
      {error && <StatusView title="Falha ao carregar avaliações" description={error.message} />}
      {!loading && !error && evaluations.length === 0 && (
        <StatusView title="Nenhuma avaliação registrada" description="As avaliações aparecerão após a conclusão das etapas." />
      )}

      {evaluations.map((item) => (
        <div className="advisor-avaliacao" key={item.id}>
          <div className="advisor-avaliacao__cabecalho">
            <div>
              <strong className="advisor-avaliacao__aluno">{item.etapaTitulo || "Etapa do projeto"}</strong>
              <p className="advisor-avaliacao__etapa">Orientador: {item.orientadorNome || "-"}</p>
            </div>
            <span className="advisor-percentual">Média {formatAvaliacaoNota(item.media)}</span>
          </div>

          <div className="advisor-notas">
            {[
              ["Participação", item.participacao],
              ["Qualidade técnica", item.qualidadeTecnica],
              ["Prazos", item.cumprimentoDePrazos],
              ["Comunicação", item.comunicacao],
            ].map(([label, value]) => (
              <div className="advisor-nota" key={label}>
                <span>{label}</span>
                <strong>{value}/5</strong>
              </div>
            ))}
          </div>

          <div className="advisor-avaliacao__comentario student-evaluations-page__comment">
            <span>Comentário do orientador</span>
            <p>{item.comentarioOrientador || "Nenhum comentário informado pelo orientador."}</p>
          </div>

          {item.cienciaRegistrada ? (
            <div className="advisor-entrega__acoes student-evaluations-page__actions student-evaluations-page__actions--acknowledged">
              <button className="advisor-botao advisor-botao--sucesso" type="button" disabled>
                <CheckCircle size={15} />
                Ciência registrada
              </button>
            </div>
          ) : (
            <div className="advisor-entrega__acoes student-evaluations-page__actions">
              <input
                className="advisor-campo__input"
                placeholder="Comentário opcional"
                value={comments[item.id] || ""}
                maxLength={2000}
                onChange={(e) => setComments({ ...comments, [item.id]: e.target.value })}
              />
              <button className="advisor-botao advisor-botao--primario" onClick={() => acknowledge(item)}>
                <MessageSquare size={15} />
                Registrar ciência
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

