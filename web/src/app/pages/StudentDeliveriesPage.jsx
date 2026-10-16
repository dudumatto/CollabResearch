import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { Download, FileArrowUp, FolderOpen, ArrowCounterClockwise, ChatCircleText, ClipboardText, FileText, PaperPlaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { userService } from "../services/userService";
import { deliveryService } from "../services/deliveryService";
import { etapaService } from "../services/etapaService";
import { api } from "../services/api";
import { mapDeliveryVersion, mapEntrega, mapProject } from "../utils/adapters";
import { formatDate, formatEntregaStatus, formatFileSize } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import { AppCombobox } from "../components/ui/AppCombobox";
import "./AdvisorWorkspace.css";

const STATUS_TONE = { PENDING_REVIEW: "amarelo", CHANGES_REQUESTED: "vermelho", APPROVED: "verde" };

export default function StudentDeliveriesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const queryProjectId = new URLSearchParams(location.search).get("projectId") ?? "";
  const queryStageId = new URLSearchParams(location.search).get("stageId") ?? "";
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [form, setForm] = useState({ titulo: "", categoria: "", etapaId: "", arquivo: null });
  const [versions, setVersions] = useState({});
  const [sending, setSending] = useState(false);
  const { data: projects, loading: loadingProjects } = useAsyncData(async () => user?.id ? (await userService.getProjects(user.id)).map(mapProject) : [], [user?.id], { initialData: [] });
  useEffect(() => { if (queryStageId) setForm((value) => ({ ...value, etapaId: queryStageId })); }, [queryStageId]);
  // Último projeto aberto: dispara entregas/etapas em paralelo com a busca de projetos,
  // em vez de esperar a lista chegar (cascata). Descartado se não estiver mais na lista.
  const cacheKey = `entregas:projeto:${user?.id}`;
  const [cachedId] = useState(() => { try { return localStorage.getItem(cacheKey) ?? ""; } catch { return ""; } });
  const validCachedId = cachedId && (loadingProjects || projects.some((item) => String(item.id) === cachedId)) ? cachedId : "";
  const projectId = selectedProjectId ?? (queryProjectId || validCachedId || (projects[0]?.id ? String(projects[0].id) : ""));
  const activeProjectId = projectId;
  useEffect(() => {
    if (loadingProjects || !projectId) return;
    try { localStorage.setItem(cacheKey, String(projectId)); } catch { /* sem storage: só perde o atalho */ }
  }, [loadingProjects, projectId, cacheKey]);
  const { data: deliveries, loading, error, reload } = useAsyncData(async ({ signal } = {}) => activeProjectId ? (await deliveryService.list(activeProjectId, { signal })).map(mapEntrega) : [], [activeProjectId], { initialData: [] });
  const { data: stages } = useAsyncData(async ({ signal } = {}) => activeProjectId ? await etapaService.list(activeProjectId, { signal }) : [], [activeProjectId], { initialData: [] });
  const openVersions = async (delivery) => {
    if (versions[delivery.id]) return setVersions((value) => ({ ...value, [delivery.id]: null }));
    try { const raw = await deliveryService.listVersions(projectId, delivery.id); setVersions((value) => ({ ...value, [delivery.id]: raw.map(mapDeliveryVersion) })); }
    catch { toast.error("Não foi possível carregar as versões."); }
  };
  const download = async (delivery, version) => {
    try { const blob = await api.getBlob(deliveryService.downloadUrl(projectId, delivery.id, version.id)); const url = URL.createObjectURL(blob); const link = Object.assign(document.createElement("a"), { href: url, download: version.nomeArquivo }); link.click(); URL.revokeObjectURL(url); }
    catch { toast.error("Não foi possível baixar o arquivo."); }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!form.titulo.trim() || !form.categoria.trim() || !form.arquivo) return toast.error("Informe título, categoria e arquivo.");
    setSending(true); try { await deliveryService.create(projectId, form, form.arquivo); setForm({ titulo: "", categoria: "", etapaId: "", arquivo: null }); event.target.reset(); await reload(); toast.success("Entrega enviada para revisão."); } catch (err) { toast.error(err.message || "Não foi possível enviar a entrega."); } finally { setSending(false); }
  };
  const resubmit = async (delivery, file) => { if (!file) return; try { await deliveryService.resubmit(projectId, delivery.id, file); await reload(); setVersions((value) => ({ ...value, [delivery.id]: null })); toast.success("Nova versão enviada."); } catch (err) { toast.error(err.message || "Não foi possível reenviar."); } };
  if (loadingProjects && !projectId) return <StatusView title="Carregando entregas" />;
  if (!projects.length && !projectId) return <StatusView title="Sem projetos vinculados" description="Suas entregas aparecerão quando você participar de um projeto." />;
  const counts = deliveries.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] ?? 0) + 1 }), {});
  return (
    <div className="advisor-pagina student-page">
      <div className="advisor-card-conteudo student-page__header">
        <div className="student-page__header-topo">
          <div>
            <h2 className="advisor-card-conteudo__titulo">Minhas entregas</h2>
            <p className="student-page__descricao">Envie arquivos, acompanhe a revisão e reenvie apenas quando houver ajustes solicitados.</p>
          </div>
          <AppCombobox ariaLabel="Selecionar projeto para entregas" className="advisor-select student-page__select" value={projectId} onChange={setSelectedProjectId} options={projects.map((item) => ({ value: item.id, label: item.title }))} />
        </div>
        <div className="student-resumo">
          <div className="student-resumo__item"><strong>{deliveries.length}</strong><span>Entregas</span></div>
          {[["PENDING_REVIEW", "Aguardando revisão"], ["CHANGES_REQUESTED", "Ajustes solicitados"], ["APPROVED", "Aprovadas"]].map(([status, label]) => (
            <div className={`student-resumo__item student-resumo__item--${STATUS_TONE[status]}`} key={status}><strong>{counts[status] ?? 0}</strong><span>{label}</span></div>
          ))}
        </div>
      </div>

      <div className="student-entregas">
        <form className="advisor-card-conteudo student-entregas__form" onSubmit={submit}>
          <h3 className="advisor-card-conteudo__titulo">Nova entrega</h3>
          <label className="advisor-campo">
            <span className="advisor-campo__rotulo">Título</span>
            <input className="advisor-campo__input" placeholder="Ex.: Revisão bibliográfica" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </label>
          <label className="advisor-campo">
            <span className="advisor-campo__rotulo">Categoria</span>
            <input className="advisor-campo__input" placeholder="Ex.: Relatório parcial" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
          </label>
          <div className="advisor-campo">
            <span className="advisor-campo__rotulo">Etapa vinculada</span>
            <AppCombobox ariaLabel="Selecionar etapa vinculada" className="app-combobox--advisor-input" value={form.etapaId} onChange={(nextValue) => setForm({ ...form, etapaId: nextValue })} options={[{ value: "", label: "Sem etapa vinculada" }, ...stages.map((stage) => ({ value: stage.id, label: stage.titulo }))]} />
          </div>
          <label className={`student-upload${form.arquivo ? " student-upload--selecionado" : ""}`}>
            <FileArrowUp size={24} />
            <span className="student-upload__nome">{form.arquivo?.name ?? "Selecionar arquivo"}</span>
            <span className="student-upload__dica">{form.arquivo ? formatFileSize(form.arquivo.size) : "Clique para escolher o arquivo da entrega"}</span>
            <input className="student-upload__input" type="file" onChange={(e) => setForm({ ...form, arquivo: e.target.files?.[0] ?? null })} />
          </label>
          <button className="advisor-botao advisor-botao--primario" disabled={sending}><PaperPlaneTilt size={16} />{sending ? "Enviando..." : "Enviar entrega"}</button>
        </form>

        <div className="student-entregas__lista">
          {loading && <StatusView title="Carregando entregas" />}
          {error && <StatusView title="Falha ao carregar entregas" description={error.message} />}
          {!loading && !error && deliveries.length === 0 && (
            <div className="advisor-estado-vazio">
              <div className="advisor-estado-vazio__icone"><ClipboardText size={24} /></div>
              <h3 className="advisor-estado-vazio__titulo">Nenhuma entrega enviada</h3>
              <p className="advisor-estado-vazio__descricao">Use o formulário para enviar sua primeira entrega neste projeto.</p>
            </div>
          )}
          {deliveries.map((delivery) => {
            const tone = STATUS_TONE[delivery.status] ?? "cinza";
            return (
              <div className={`advisor-entrega student-entrega student-entrega--${tone}`} key={delivery.id}>
                <div className="advisor-entrega__cabecalho">
                  <div className="student-entrega__info">
                    <span className="student-entrega__icone"><FileText size={20} /></span>
                    <div>
                      <strong className="advisor-entrega__titulo">{delivery.titulo}</strong>
                      <p className="advisor-entrega__meta">
                        {[delivery.categoria, delivery.etapaTitulo, delivery.atualizadaEm && `Atualizada em ${formatDate(delivery.atualizadaEm)}`, delivery.totalVersoes > 0 && `${delivery.totalVersoes} ${delivery.totalVersoes === 1 ? "versão" : "versões"}`].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <span className={`advisor-etiqueta advisor-etiqueta--${tone}`}>{formatEntregaStatus(delivery.status)}</span>
                </div>
                <div className="advisor-entrega__acoes">
                  <button type="button" className="advisor-botao advisor-botao--secundario" aria-expanded={Boolean(versions[delivery.id])} onClick={() => openVersions(delivery)}><FolderOpen size={15} />{versions[delivery.id] ? "Ocultar versões" : "Ver versões"}</button>
                  {delivery.status === "CHANGES_REQUESTED" && Number(delivery.autorId) === Number(user.id) && <label className="advisor-botao advisor-botao--primario"><ArrowCounterClockwise size={15} />Reenviar<input hidden type="file" onChange={(e) => resubmit(delivery, e.target.files?.[0])} /></label>}
                </div>
                {versions[delivery.id] && (
                  <div className="advisor-versoes student-versoes">
                    {versions[delivery.id].map((version) => (
                      <div className="advisor-versao student-versao" key={version.id}>
                        <span className="student-versao__numero">v{version.numeroVersao}</span>
                        <div className="advisor-versao__info">
                          <p className="advisor-versao__nome">{version.nomeArquivo}</p>
                          <p className="advisor-versao__meta">{[version.enviadaEm && `Enviada em ${formatDate(version.enviadaEm)}`, formatFileSize(version.tamanhoBytes)].filter(Boolean).join(" · ")}</p>
                          {version.revisao?.comentario && <p className="student-versao__revisao"><ChatCircleText size={14} /><span>{version.revisao.revisorNome && <strong>{version.revisao.revisorNome}: </strong>}{version.revisao.comentario}</span></p>}
                        </div>
                        <button type="button" className="advisor-botao advisor-botao--secundario advisor-botao--pequeno" onClick={() => download(delivery, version)}><Download size={15} />Baixar</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
