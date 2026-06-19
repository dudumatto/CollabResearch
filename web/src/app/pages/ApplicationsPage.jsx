import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  MessageSquare,
  Calendar,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { applicationService } from "../services/applicationService";
import { mapApplication } from "../utils/adapters";
import { formatApplicationStatus } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import "./ApplicationsPage.css";
import "./ProjectDetailPage.css";

const statusConfig = {
  APROVADO: {
    icon: CheckCircle,
    iconeClass: "inscricao-card__icone-status--aprovado",
    iconeColor: "var(--cor-sucesso)",
    etiquetaClass: "inscricao-card__etiqueta-status--aprovado",
    expandidaClass: "inscricao-card__conteudo-expandido--aprovado",
    textoMotivacaoClass: "inscricao-card__texto-motivacao--aprovado",
  },
  PENDENTE: {
    icon: Clock,
    iconeClass: "inscricao-card__icone-status--pendente",
    iconeColor: "var(--cor-atencao)",
    etiquetaClass: "inscricao-card__etiqueta-status--pendente",
    expandidaClass: "inscricao-card__conteudo-expandido--pendente",
    textoMotivacaoClass: "inscricao-card__texto-motivacao--pendente",
  },
  REJEITADO: {
    icon: XCircle,
    iconeClass: "inscricao-card__icone-status--rejeitado",
    iconeColor: "var(--cor-erro)",
    etiquetaClass: "inscricao-card__etiqueta-status--rejeitado",
    expandidaClass: "inscricao-card__conteudo-expandido--rejeitado",
    textoMotivacaoClass: "inscricao-card__texto-motivacao--rejeitado",
  },
};

function ApplicationsSkeleton() {
  const Sk = ({ w = "100%", h = 14, r = "0.5rem" }) => (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
  );
  return (
    <div className="pagina-inscricoes">
      <div className="pagina-inscricoes__grade-resumos">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", padding: "var(--espaco-5)", border: "1px solid var(--cor-borda-clara)", display: "flex", flexDirection: "column", gap: 8 }}>
            <Sk w="40%" h={26} />
            <Sk w="65%" h={13} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: "var(--espaco-4)", marginTop: "var(--espaco-2)" }}>
        {[1, 2, 3, 4].map((i) => <Sk key={i} w={90} h={32} r="var(--raio-completo)" />)}
      </div>
      <div className="pagina-inscricoes__lista">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", border: "1px solid var(--cor-borda-clara)", padding: "var(--espaco-4)", display: "flex", alignItems: "center", gap: 14 }}>
            <Sk w={40} h={40} r="50%" />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Sk w="45%" h={15} />
                <Sk w={72} h={22} r="var(--raio-completo)" />
              </div>
              <Sk w="35%" h={12} />
              <div style={{ display: "flex", gap: 12 }}>
                <Sk w={110} h={11} />
                <Sk w={110} h={11} />
              </div>
            </div>
            <Sk w={16} h={16} />
          </div>
        ))}
      </div>
    </div>
  );
}

function mapMine(raw) {
  const base = mapApplication(raw);
  return {
    ...base,
    motivation: raw.motivacao ?? "",
    advisorFeedback: raw.parecerOrientador ?? "",
  };
}

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const { data, setData, loading, error } = useAsyncData(
    async () => {
      const result = await applicationService.listMine();
      return Array.isArray(result) ? result.map(mapMine) : [];
    },
    [],
    { initialData: [] },
  );
  const applications = Array.isArray(data) ? data : [];
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const filtered = useMemo(
    () => (filter === "all" ? applications : applications.filter((item) => item.status === filter)),
    [applications, filter],
  );

  const counts = useMemo(
    () => ({
      all: applications.length,
      APROVADO: applications.filter((item) => item.status === "APROVADO").length,
      PENDENTE: applications.filter((item) => item.status === "PENDENTE").length,
      REJEITADO: applications.filter((item) => item.status === "REJEITADO").length,
    }),
    [applications],
  );

  const handleConfirmCancel = async () => {
    if (cancelTargetId == null) return;
    setCancelSubmitting(true);
    try {
      await applicationService.cancel(cancelTargetId);
      setData((prev) => (Array.isArray(prev) ? prev.filter((a) => a.id !== cancelTargetId) : prev));
      toast.success("Inscrição cancelada.");
      setCancelTargetId(null);
      if (expandedId === cancelTargetId) setExpandedId(null);
    } catch (err) {
      toast.error(err.message || "Não foi possível cancelar a inscrição.");
    } finally {
      setCancelSubmitting(false);
    }
  };

  if (loading) return <ApplicationsSkeleton />;

  if (error) {
    return <StatusView title="Falha ao carregar inscrições" description={error.message} />;
  }

  return (
    <div className="pagina-inscricoes">
      <div className="pagina-inscricoes__grade-resumos">
        {[
          ["all", "Total de inscrições"],
          ["APROVADO", "Aprovadas"],
          ["PENDENTE", "Aguardando"],
          ["REJEITADO", "Não aprovadas"],
        ].map(([status, label]) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`resumo-inscricao ${filter === status ? "resumo-inscricao--ativo" : "resumo-inscricao--inativo"}`}
          >
            <p className={`resumo-inscricao__valor ${filter === status ? "resumo-inscricao__valor--ativo" : "resumo-inscricao__valor--inativo"}`}>
              {counts[status]}
            </p>
            <p className={`resumo-inscricao__rotulo ${filter === status ? "resumo-inscricao__rotulo--ativo" : "resumo-inscricao__rotulo--inativo"}`}>
              {label}
            </p>
          </button>
        ))}
      </div>

      <div className="pagina-inscricoes__abas">
        {["all", "APROVADO", "PENDENTE", "REJEITADO"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`pagina-inscricoes__aba ${filter === status ? "pagina-inscricoes__aba--ativa" : "pagina-inscricoes__aba--inativa"}`}
          >
            {status === "all" ? "Todas" : formatApplicationStatus(status)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="pagina-inscricoes__estado-vazio">
          <div className="pagina-inscricoes__icone-vazio">
            <FileText size={24} style={{ color: "var(--cor-texto-mudo)" }} />
          </div>
          <h3 className="pagina-inscricoes__titulo-vazio">
            {applications.length === 0 ? "Nenhuma inscrição encontrada" : "Nenhuma inscrição neste filtro"}
          </h3>
          <p className="pagina-inscricoes__descricao-vazio">
            {applications.length === 0
              ? "Explore projetos abertos e envie sua primeira inscrição com uma carta de motivação."
              : "Tente outro filtro ou volte para ver todas as inscrições."}
          </p>
          <button type="button" onClick={() => navigate("/app/projects")} className="pagina-inscricoes__botao-explorar">
            Explorar projetos
          </button>
        </div>
      ) : (
        <div className="pagina-inscricoes__lista">
          {filtered.map((application) => {
            const cfg = statusConfig[application.status] ?? statusConfig.PENDENTE;
            const isExpanded = expandedId === application.id;
            const projectId = application.project?.id;

            return (
              <div key={application.id} className="inscricao-card">
                <button
                  type="button"
                  className="inscricao-card__cabecalho inscricao-card__cabecalho--botao"
                  onClick={() => setExpandedId(isExpanded ? null : application.id)}
                >
                  <div className="inscricao-card__linha-principal">
                    <div className={`inscricao-card__icone-status ${cfg.iconeClass}`}>
                      <cfg.icon size={20} style={{ color: cfg.iconeColor }} />
                    </div>
                    <div className="inscricao-card__info">
                      <div className="inscricao-card__linha-titulo">
                        <h3 className="inscricao-card__titulo-projeto">{application.project?.title ?? "Projeto"}</h3>
                        <span className={`inscricao-card__etiqueta-status ${cfg.etiquetaClass}`}>
                          {formatApplicationStatus(application.status)}
                        </span>
                      </div>
                      <p className="inscricao-card__orientador">
                        Orientador: {application.project?.advisor?.name ?? "Sem orientador"}
                      </p>
                      <div className="inscricao-card__metadados">
                        <span className="inscricao-card__metadado">
                          <Calendar size={12} />
                          Inscrito em {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString("pt-BR") : "-"}
                        </span>
                        <span className="inscricao-card__metadado">
                          <Clock size={12} />
                          Atualizado em {application.updatedAt ? new Date(application.updatedAt).toLocaleDateString("pt-BR") : "-"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`inscricao-card__icone-expansao ${isExpanded ? "inscricao-card__icone-expansao--expandido" : ""}`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className={`inscricao-card__conteudo-expandido ${cfg.expandidaClass}`}>
                    <div className="inscricao-card__secao-expandida">
                      {application.motivation?.trim() ? (
                        <div>
                          <h4 className="inscricao-card__rotulo-secao">Minha motivação:</h4>
                          <p className={`inscricao-card__texto-motivacao ${cfg.textoMotivacaoClass ?? ""}`}>
                            {application.motivation}
                          </p>
                        </div>
                      ) : null}

                      {application.advisorFeedback?.trim() ? (
                        <div>
                          <h4 className="inscricao-card__rotulo-secao">Parecer do orientador:</h4>
                          <p className="inscricao-card__feedback">{application.advisorFeedback}</p>
                        </div>
                      ) : null}

                      <div className="inscricao-card__botoes-acao">
                        <button
                          type="button"
                          onClick={() => projectId != null && navigate(`/app/projects/${projectId}`)}
                          disabled={projectId == null}
                          className="inscricao-card__botao inscricao-card__botao--neutro"
                        >
                          <ExternalLink size={13} /> Ver projeto
                        </button>
                        <button type="button" onClick={() => navigate("/app/chat")} className="inscricao-card__botao inscricao-card__botao--mensagem">
                          <MessageSquare size={13} /> Enviar mensagem
                        </button>
                        {application.status === "PENDENTE" && (
                          <button
                            type="button"
                            onClick={() => setCancelTargetId(application.id)}
                            className="inscricao-card__botao inscricao-card__botao--cancelar"
                          >
                            <XCircle size={13} /> Cancelar inscrição
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cancelTargetId != null && (
        <div
          className="modal-inscricao__sobreposicao"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !cancelSubmitting) setCancelTargetId(null);
          }}
        >
          <div className="modal-inscricao__painel modal-confirmacao">
            <h3 className="modal-inscricao__titulo">Cancelar inscrição</h3>
            <p className="modal-confirmacao__texto">Tem certeza que deseja cancelar esta inscrição?</p>
            <div className="modal-inscricao__rodape">
              <button
                type="button"
                onClick={() => setCancelTargetId(null)}
                className="modal-inscricao__botao-cancelar"
                disabled={cancelSubmitting}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelSubmitting}
                className="modal-confirmacao__botao-confirmar"
              >
                {cancelSubmitting ? <Loader2 size={15} className="girando" /> : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
