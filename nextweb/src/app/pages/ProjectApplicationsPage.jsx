"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  Users,
  XCircle,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { useAuth } from "../hooks/useAuth";
import { applicationService } from "../services/applicationService";
import { projectService } from "../services/projectService";
import { StatusView } from "../components/StatusView";
import { mapApplication, mapProject } from "../utils/adapters";
import { formatApplicationStatus } from "../utils/formatters";
import "./ApplicationsPage.css";
import "./ProjectDetailPage.css";
import "./ProjectApplicationsPage.css";

const statusConfig = {
  APROVADO: {
    icon: CheckCircle,
    iconeClass: "inscricao-card__icone-status--aprovado",
    iconeColor: "var(--cor-sucesso)",
    etiquetaClass: "inscricao-card__etiqueta-status--aprovado",
  },
  PENDENTE: {
    icon: Clock,
    iconeClass: "inscricao-card__icone-status--pendente",
    iconeColor: "var(--cor-atencao)",
    etiquetaClass: "inscricao-card__etiqueta-status--pendente",
  },
  REJEITADO: {
    icon: XCircle,
    iconeClass: "inscricao-card__icone-status--rejeitado",
    iconeColor: "var(--cor-erro)",
    etiquetaClass: "inscricao-card__etiqueta-status--rejeitado",
  },
};

function mapProjectApplication(raw) {
  const base = mapApplication(raw);
  return {
    ...base,
    motivation: raw.motivacao ?? "",
    advisorFeedback: raw.parecerOrientador ?? "",
    studentName: raw.alunoNome ?? base.user?.nome ?? "Aluno",
  };
}

function ProjectApplicationsSkeleton() {
  const Sk = ({ w = "100%", h = 14, r = "0.5rem" }) => (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-5)", padding: "var(--espaco-4)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: "var(--espaco-2)" }}>
        <Sk w={32} h={32} r="var(--raio-medio)" />
        <Sk w={200} h={16} />
      </div>
      <div style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", border: "1px solid var(--cor-borda-clara)", padding: "var(--espaco-5)" }}>
        <Sk w="60%" h={18} />
        <Sk w="100%" h={13} />
        <Sk w="75%" h={13} />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {[1, 2, 3].map((i) => <Sk key={i} w={70} h={24} r="var(--raio-completo)" />)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", border: "1px solid var(--cor-borda-clara)", padding: "var(--espaco-4)", display: "flex", alignItems: "center", gap: 14 }}>
            <Sk w={44} h={44} r="50%" />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <Sk w="45%" h={15} />
              <Sk w="35%" h={12} />
              <Sk w="60%" h={11} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectApplicationsPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const { user } = useAuth();

  const [expandedMotivationIds, setExpandedMotivationIds] = useState(() => new Set());
  const [actionModal, setActionModal] = useState(null);
  const [parecerDraft, setParecerDraft] = useState("");
  const [cardActionLoadingId, setCardActionLoadingId] = useState(null);

  const { data, loading, error, setData } = useAsyncData(
    async () => {
      const [projectRaw, appsRaw] = await Promise.all([
        projectService.getById(id),
        applicationService.listByProject(id),
      ]);
      const list = Array.isArray(appsRaw) ? appsRaw : appsRaw?.content ?? [];
      return {
        project: mapProject(projectRaw),
        applications: list.map(mapProjectApplication),
      };
    },
    [id],
    { initialData: { project: null, applications: [] } },
  );

  const project = data?.project;
  const applications = useMemo(() => data?.applications ?? [], [data?.applications]);

  const isAdvisorOwner = useMemo(() => {
    if (!user?.id || !project?.advisorId) return false;
    return user.tipo === "ORIENTADOR" && Number(user.id) === Number(project.advisorId);
  }, [user, project]);

  const toggleMotivation = useCallback((appId) => {
    setExpandedMotivationIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  }, []);

  const updateApplicationStatus = useCallback((applicationId, newStatus, advisorFeedback) => {
    setData((prev) => {
      const base = prev ?? { project: null, applications: [] };
      return {
        ...base,
        applications: (base.applications ?? []).map((application) =>
          application.id === applicationId
            ? { ...application, status: newStatus, advisorFeedback: advisorFeedback || application.advisorFeedback }
            : application,
        ),
      };
    });
  }, [setData]);

  const openActionModal = (type, applicationId) => {
    setActionModal({ type, applicationId });
    setParecerDraft("");
  };

  const closeActionModal = () => {
    setActionModal(null);
    setParecerDraft("");
  };

  const submitActionModal = async () => {
    if (!actionModal) return;
    const { type, applicationId } = actionModal;
    const parecer = parecerDraft.trim();
    setCardActionLoadingId(applicationId);
    try {
      if (type === "approve") {
        await applicationService.approve(applicationId, parecer);
        updateApplicationStatus(applicationId, "APROVADO", parecer);
        toast.success("Inscrição aprovada.");
      } else {
        await applicationService.reject(applicationId, parecer);
        updateApplicationStatus(applicationId, "REJEITADO", parecer);
        toast.success("Inscrição rejeitada.");
      }
      closeActionModal();
    } catch (err) {
      toast.error(err.message || "Não foi possível concluir a ação.");
    } finally {
      setCardActionLoadingId(null);
    }
  };

  const counts = useMemo(
    () => ({
      total: applications.length,
      PENDENTE: applications.filter((a) => a.status === "PENDENTE").length,
      APROVADO: applications.filter((a) => a.status === "APROVADO").length,
      REJEITADO: applications.filter((a) => a.status === "REJEITADO").length,
    }),
    [applications],
  );

  if (loading) return <ProjectApplicationsSkeleton />;

  if (error || !project) {
    return (
      <StatusView
        title="Não foi possível carregar"
        description={error?.message ?? "Projeto não encontrado."}
        action={
          <button type="button" className="pagina-inscricoes-projeto__botao-voltar" onClick={() => router.push("/app/projects")}>
            Voltar aos projetos
          </button>
        }
      />
    );
  }

  if (!isAdvisorOwner) {
    return (
      <StatusView
        title="Acesso negado"
        description="Apenas o orientador responsável por este projeto pode gerenciar as inscrições."
        action={
          <button type="button" className="pagina-inscricoes-projeto__botao-voltar" onClick={() => router.push(`/app/projects/${id}`)}>
            Voltar ao projeto
          </button>
        }
      />
    );
  }

  return (
    <div className="pagina-inscricoes-projeto">
      <div className="pagina-inscricoes-projeto__cabecalho">
        <div>
          <h1 className="pagina-inscricoes-projeto__titulo">Inscrições no projeto</h1>
          <p className="pagina-inscricoes-projeto__subtitulo">{project.title}</p>
        </div>
        <button type="button" className="pagina-inscricoes-projeto__botao-voltar" onClick={() => router.push(`/app/projects/${id}`)}>
          <ArrowLeft size={16} />
          Voltar ao projeto
        </button>
      </div>

      <div className="pagina-inscricoes-projeto__grade-resumos">
        {[
          ["total", "Total"],
          ["PENDENTE", "Pendentes"],
          ["APROVADO", "Aprovadas"],
          ["REJEITADO", "Rejeitadas"],
        ].map(([key, label]) => (
          <div key={key} className="pagina-inscricoes-projeto__resumo">
            <p className="pagina-inscricoes-projeto__resumo-valor">{counts[key] ?? 0}</p>
            <p className="pagina-inscricoes-projeto__resumo-rotulo">{label}</p>
          </div>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="pagina-inscricoes-projeto__vazio">
          <div className="pagina-inscricoes-projeto__vazio-icone">
            <Users size={28} style={{ color: "var(--cor-texto-mudo)" }} />
          </div>
          <h3 className="pagina-inscricoes-projeto__vazio-titulo">Nenhuma inscrição ainda</h3>
          <p className="pagina-inscricoes-projeto__vazio-texto">Quando alunos se inscreverem, eles aparecerão nesta lista.</p>
          <button type="button" className="pagina-inscricoes-projeto__botao-voltar" onClick={() => router.push(`/app/projects/${id}`)}>
            Voltar ao projeto
          </button>
        </div>
      ) : (
        <div className="pagina-inscricoes__lista">
          {applications.map((application) => {
            const cfg = statusConfig[application.status] ?? statusConfig.PENDENTE;
            const motivationOpen = expandedMotivationIds.has(application.id);
            const hasMotivation = Boolean(application.motivation?.trim());

            return (
              <div key={application.id} className="inscricao-card pagina-inscricoes-projeto__card">
                <div className="inscricao-card__cabecalho pagina-inscricoes-projeto__card-cabecalho">
                  <div className="inscricao-card__linha-principal">
                    <div className={`inscricao-card__icone-status ${cfg.iconeClass}`}>
                      <cfg.icon size={20} style={{ color: cfg.iconeColor }} />
                    </div>
                    <div className="inscricao-card__info">
                      <div className="inscricao-card__linha-titulo">
                        <h3 className="inscricao-card__titulo-projeto pagina-inscricoes-projeto__nome-aluno">{application.studentName}</h3>
                        <span className={`inscricao-card__etiqueta-status ${cfg.etiquetaClass}`}>
                          {formatApplicationStatus(application.status)}
                        </span>
                      </div>
                      <div className="inscricao-card__metadados">
                        <span className="inscricao-card__metadado">
                          <Calendar size={12} />
                          Inscrito em{" "}
                          {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString("pt-BR") : "-"}
                        </span>
                      </div>
                      {application.userId != null && (
                        <button
                          type="button"
                          className="pagina-inscricoes-projeto__ver-perfil"
                          onClick={() => router.push(`/app/users/${application.userId}`)}
                        >
                          <UserRound size={13} />
                          Ver perfil do aluno
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pagina-inscricoes-projeto__corpo-card">
                  {hasMotivation && (
                    <div className="pagina-inscricoes-projeto__motivacao">
                      <button
                        type="button"
                        className="pagina-inscricoes-projeto__motivacao-toggle"
                        onClick={() => toggleMotivation(application.id)}
                      >
                        {motivationOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        Carta de motivação
                      </button>
                      {motivationOpen && (
                        <p className="pagina-inscricoes-projeto__motivacao-texto">{application.motivation}</p>
                      )}
                    </div>
                  )}

                  {application.status === "PENDENTE" && (
                    <div className="pagina-inscricoes-projeto__acoes">
                      <button
                        type="button"
                        className="inscricao-card__botao inscricao-card__botao--aprovar"
                        disabled={cardActionLoadingId === application.id}
                        onClick={() => openActionModal("approve", application.id)}
                      >
                        {cardActionLoadingId === application.id ? (
                          <Loader2 size={14} className="girando" />
                        ) : (
                          <>
                            <CheckCircle size={14} /> Aprovar
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="inscricao-card__botao inscricao-card__botao--rejeitar"
                        disabled={cardActionLoadingId === application.id}
                        onClick={() => openActionModal("reject", application.id)}
                      >
                        {cardActionLoadingId === application.id ? (
                          <Loader2 size={14} className="girando" />
                        ) : (
                          <>
                            <XCircle size={14} /> Rejeitar
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {(application.status === "APROVADO" || application.status === "REJEITADO") && application.advisorFeedback?.trim() && (
                    <div className="pagina-inscricoes-projeto__parecer">
                      <h4 className="inscricao-card__rotulo-secao">Parecer do orientador</h4>
                      <p className="inscricao-card__feedback">{application.advisorFeedback}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {actionModal && (
        <div className="modal-inscricao__sobreposicao" role="presentation" onClick={(e) => e.target === e.currentTarget && closeActionModal()}>
          <div className="modal-inscricao__painel pagina-inscricoes-projeto__modal">
            <h3 className="modal-inscricao__titulo">
              {actionModal.type === "approve" ? "Aprovar inscrição" : "Rejeitar inscrição"}
            </h3>
            <p className="modal-inscricao__subtitulo">Parecer para o aluno (opcional, até 500 caracteres)</p>
            <textarea
              className="modal-inscricao__textarea"
              rows={4}
              maxLength={500}
              value={parecerDraft}
              onChange={(e) => setParecerDraft(e.target.value)}
              placeholder="Escreva um parecer opcional..."
            />
            <p className="modal-inscricao__contador">{parecerDraft.length}/500</p>
            <div className="modal-inscricao__rodape">
              <button type="button" className="modal-inscricao__botao-cancelar" onClick={closeActionModal} disabled={cardActionLoadingId != null}>
                Cancelar
              </button>
              <button
                type="button"
                className={`modal-inscricao__botao-enviar ${actionModal.type === "reject" ? "pagina-inscricoes-projeto__modal-confirmar--rejeitar" : ""}`}
                onClick={submitActionModal}
                disabled={cardActionLoadingId != null}
              >
                {cardActionLoadingId != null ? <div className="modal-inscricao__spinner" /> : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
