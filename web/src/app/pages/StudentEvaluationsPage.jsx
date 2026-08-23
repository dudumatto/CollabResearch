import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
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

export default function StudentEvaluationsPage() {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState("");
  const [comments, setComments] = useState({});

  const { data: projects } = useAsyncData(
    async () => (await userService.getProjects(user.id)).map(mapProject),
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

  if (!projects.length && !projectId) {
    return <StatusView title="Sem projetos vinculados" description="Suas avaliações acadêmicas aparecerão aqui." />;
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

      {loading && <StatusView title="Carregando avaliações" />}
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
            <span className="advisor-etiqueta advisor-etiqueta--verde student-evaluations-page__acknowledged">
              Ciência registrada
            </span>
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
