import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { Download, FileUp, FolderOpen, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { userService } from "../services/userService";
import { deliveryService } from "../services/deliveryService";
import { etapaService } from "../services/etapaService";
import { api } from "../services/api";
import { mapDeliveryVersion, mapEntrega, mapProject } from "../utils/adapters";
import { formatEntregaStatus } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import "./AdvisorWorkspace.css";

export default function StudentDeliveriesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const queryProjectId = new URLSearchParams(location.search).get("projectId") ?? "";
  const queryStageId = new URLSearchParams(location.search).get("stageId") ?? "";
  const [projectId, setProjectId] = useState(queryProjectId);
  const [form, setForm] = useState({ titulo: "", categoria: "", etapaId: "", arquivo: null });
  const [versions, setVersions] = useState({});
  const [sending, setSending] = useState(false);
  const { data: projects } = useAsyncData(async () => (await userService.getProjects(user.id)).map(mapProject), [user?.id], { initialData: [] });
  useEffect(() => { if (queryProjectId && queryProjectId !== projectId) setProjectId(queryProjectId); }, [queryProjectId, projectId]);
  useEffect(() => { if (queryStageId) setForm((value) => ({ ...value, etapaId: queryStageId })); }, [queryStageId]);
  useEffect(() => { if (!projectId && projects[0]?.id) setProjectId(String(projects[0].id)); }, [projects, projectId]);
  const activeProject = useMemo(() => projects.find((item) => String(item.id) === projectId), [projects, projectId]);
  const { data: deliveries, loading, error, reload } = useAsyncData(async () => projectId ? (await deliveryService.list(projectId)).map(mapEntrega) : [], [projectId], { initialData: [] });
  const { data: stages } = useAsyncData(async () => projectId ? await etapaService.list(projectId) : [], [projectId], { initialData: [] });
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
  if (!projects.length && !projectId) return <StatusView title="Sem projetos vinculados" description="Suas entregas aparecerão quando você participar de um projeto." />;
  return <div className="advisor-pagina"><div className="advisor-card-conteudo"><h2 className="advisor-card-conteudo__titulo">Minhas entregas</h2><p>Envie arquivos, acompanhe a revisão e reenviar apenas quando houver ajustes solicitados.</p><select className="advisor-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>{projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div><form className="advisor-card-conteudo" onSubmit={submit}><h3 className="advisor-card-conteudo__titulo">Nova entrega</h3><input className="advisor-campo__input" placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /><input className="advisor-campo__input" placeholder="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /><select className="advisor-campo__input" value={form.etapaId} onChange={(e) => setForm({ ...form, etapaId: e.target.value })}><option value="">Sem etapa vinculada</option>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.titulo}</option>)}</select><input className="advisor-campo__input" type="file" onChange={(e) => setForm({ ...form, arquivo: e.target.files?.[0] ?? null })} /><button className="advisor-botao advisor-botao--primario" disabled={sending}><FileUp size={16} />{sending ? "Enviando..." : "Enviar entrega"}</button></form>{loading && <StatusView title="Carregando entregas" />}{error && <StatusView title="Falha ao carregar entregas" description={error.message} />}{deliveries.map((delivery) => <div className="advisor-entrega" key={delivery.id}><div className="advisor-entrega__cabecalho"><div><strong className="advisor-entrega__titulo">{delivery.titulo}</strong><p className="advisor-entrega__meta">{delivery.categoria} {delivery.etapaTitulo && `· ${delivery.etapaTitulo}`}</p></div><span className="advisor-etiqueta advisor-etiqueta--cinza">{formatEntregaStatus(delivery.status)}</span></div><div className="advisor-entrega__acoes"><button type="button" className="advisor-botao advisor-botao--secundario" onClick={() => openVersions(delivery)}><FolderOpen size={15} />Versões</button>{delivery.status === "CHANGES_REQUESTED" && Number(delivery.autorId) === Number(user.id) && <label className="advisor-botao advisor-botao--primario"><RotateCcw size={15} />Reenviar<input hidden type="file" onChange={(e) => resubmit(delivery, e.target.files?.[0])} /></label>}</div>{versions[delivery.id]?.map((version) => <div className="advisor-versao" key={version.id}><span className="advisor-versao__info">Versão {version.numeroVersao}: {version.nomeArquivo}{version.revisao?.comentario && ` — ${version.revisao.comentario}`}</span><button type="button" className="advisor-botao advisor-botao--secundario" onClick={() => download(delivery, version)}><Download size={15} />Baixar</button></div>)}</div>)}</div>;
}
