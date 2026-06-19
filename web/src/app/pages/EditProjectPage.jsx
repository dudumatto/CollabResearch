import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { areaService } from "../services/areaService";
import { projectService } from "../services/projectService";
import { StatusView } from "../components/StatusView";
import { validateProjectDates } from "../utils/projectFormValidation";
import "./CreateProjectPage.css";

export default function EditProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [areas, setAreas] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([projectService.getById(id), areaService.list()])
      .then(([raw, areaPayload]) => {
        setAreas(Array.isArray(areaPayload) ? areaPayload : []);
        setForm({
          titulo: raw.titulo ?? "",
          descricao: raw.descricao ?? "",
          requisitos: raw.requisitos ?? "",
          tecnologias: raw.tecnologias ?? "",
          areaId: String(raw.areaId ?? ""),
          vagas: String(raw.vagas ?? ""),
          dataInicio: raw.dataInicio ?? "",
          dataFim: raw.dataFim ?? "",
          dataLimiteInscricao: raw.dataLimiteInscricao ?? "",
        });
        // Se o projeto tem areaNome, injeta nas opções caso não esteja
        if (raw.areaId && raw.areaNome) {
          setAreas((prev) => {
            const exists = prev.some((a) => a.id === raw.areaId);
            return exists ? prev : [...prev, { id: raw.areaId, nome: raw.areaNome }];
          });
        }
      })
      .catch((err) => setFetchError(err.message ?? "Não foi possível carregar o projeto."))
      .finally(() => setFetchLoading(false));
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.titulo.trim()) { setError("O título é obrigatório."); return; }
    if (!form.areaId) { setError("Selecione uma área."); return; }
    if (!areas.some((area) => String(area.id) === form.areaId)) { setError("Selecione uma área cadastrada."); return; }
    if (!form.vagas || Number(form.vagas) < 1) { setError("Informe o numero de vagas."); return; }
    const dateError = validateProjectDates(form);
    if (dateError) { setError(dateError); return; }

    setLoading(true);
    setError(null);

    try {
      await projectService.update(id, {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        requisitos: form.requisitos.trim() || undefined,
        tecnologias: form.tecnologias.trim() || undefined,
        areaId: Number(form.areaId),
        vagas: Number(form.vagas),
        dataInicio: form.dataInicio || undefined,
        dataFim: form.dataFim || undefined,
        dataLimiteInscricao: form.dataLimiteInscricao || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate(`/app/projects/${id}`), 1200);
    } catch (err) {
      setError(err.message ?? "Não foi possível salvar as alterações.");
    } finally {
      setLoading(false);
    }
  }

  if (fetchLoading) return <StatusView title="Carregando projeto" description="Buscando dados para edicao." />;
  if (fetchError) return <StatusView title="Erro ao carregar" description={fetchError} />;

  const areasUnavailable = areas.length === 0;
  const isDisabled = loading || success || areasUnavailable;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="pagina-criar-projeto"
    >
      <div className="pagina-criar-projeto__cabecalho">
        <button type="button" onClick={() => navigate(`/app/projects/${id}`)} className="pagina-criar-projeto__botao-voltar">
          <ArrowLeft size={16} />
          Voltar
        </button>
        <div>
          <h2 className="pagina-criar-projeto__titulo">Editar projeto</h2>
          <p className="pagina-criar-projeto__subtitulo">Atualize as informações do projeto</p>
        </div>
      </div>

      <div className="pagina-criar-projeto__conteudo">
        <form onSubmit={handleSubmit} className="formulario-projeto" noValidate>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="formulario-projeto__alerta formulario-projeto__alerta--erro">
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="formulario-projeto__alerta formulario-projeto__alerta--sucesso">
              Projeto atualizado! Redirecionando...
            </motion.div>
          )}
          {areasUnavailable && (
            <div className="formulario-projeto__alerta formulario-projeto__alerta--erro" role="alert">
              Nenhuma área de pesquisa cadastrada. Solicite ao administrador o cadastro de uma área antes de editar projetos.
            </div>
          )}

          <div className="formulario-projeto__campo">
            <label htmlFor="titulo" className="formulario-projeto__rotulo">
              Título <span className="formulario-projeto__obrigatorio">*</span>
            </label>
            <input id="titulo" name="titulo" type="text" value={form.titulo} onChange={handleChange}
              className="formulario-projeto__input" maxLength={200} disabled={isDisabled} autoFocus />
          </div>

          <div className="formulario-projeto__campo">
            <label htmlFor="descricao" className="formulario-projeto__rotulo">Descrição</label>
            <textarea id="descricao" name="descricao" value={form.descricao} onChange={handleChange}
              className="formulario-projeto__textarea" rows={4} disabled={isDisabled} />
          </div>

          <div className="formulario-projeto__campo">
            <label htmlFor="requisitos" className="formulario-projeto__rotulo">Requisitos</label>
            <input id="requisitos" name="requisitos" type="text" value={form.requisitos} onChange={handleChange}
              placeholder="Ex: Python, estatística básica"
              className="formulario-projeto__input" disabled={isDisabled} />
          </div>

          <div className="formulario-projeto__campo">
            <label htmlFor="tecnologias" className="formulario-projeto__rotulo">Tecnologias e competências</label>
            <input id="tecnologias" name="tecnologias" type="text" value={form.tecnologias} onChange={handleChange}
              placeholder="Ex: React, Spring Boot, PostgreSQL"
              className="formulario-projeto__input" disabled={isDisabled} />
          </div>

          <div className="formulario-projeto__grade-2">
            <div className="formulario-projeto__campo">
              <label htmlFor="areaId" className="formulario-projeto__rotulo">
                Área <span className="formulario-projeto__obrigatorio">*</span>
              </label>
              <select id="areaId" name="areaId" value={form.areaId} onChange={handleChange}
                className="formulario-projeto__select" disabled={isDisabled}>
                <option value="">{areasUnavailable ? "Nenhuma área cadastrada" : "Selecione uma área"}</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </div>

            <div className="formulario-projeto__campo">
              <label htmlFor="vagas" className="formulario-projeto__rotulo">
                Vagas <span className="formulario-projeto__obrigatorio">*</span>
              </label>
              <input id="vagas" name="vagas" type="number" min={1} max={99}
                value={form.vagas} onChange={handleChange}
                className="formulario-projeto__input" disabled={isDisabled} />
            </div>
          </div>

          <div className="formulario-projeto__grade-3">
            <div className="formulario-projeto__campo">
              <label htmlFor="dataInicio" className="formulario-projeto__rotulo">Data de início</label>
              <input id="dataInicio" name="dataInicio" type="date" value={form.dataInicio}
                onChange={handleChange} className="formulario-projeto__input" disabled={isDisabled} />
            </div>
            <div className="formulario-projeto__campo">
              <label htmlFor="dataFim" className="formulario-projeto__rotulo">Data de término</label>
              <input id="dataFim" name="dataFim" type="date" value={form.dataFim}
                onChange={handleChange} className="formulario-projeto__input" disabled={isDisabled} />
            </div>
            <div className="formulario-projeto__campo">
              <label htmlFor="dataLimiteInscricao" className="formulario-projeto__rotulo">Limite de inscrição</label>
              <input id="dataLimiteInscricao" name="dataLimiteInscricao" type="date"
                value={form.dataLimiteInscricao} onChange={handleChange}
                className="formulario-projeto__input" disabled={isDisabled} />
            </div>
          </div>

          <div className="formulario-projeto__acoes">
            <button type="button" onClick={() => navigate(`/app/projects/${id}`)}
              className="formulario-projeto__botao-cancelar" disabled={loading}>
              Cancelar
            </button>
            <motion.button type="submit"
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.97 }}
              className="formulario-projeto__botao-criar"
              disabled={isDisabled}>
              {loading
                ? <><Loader2 size={16} className="formulario-projeto__spinner" /> Salvando...</>
                : <><Save size={16} /> Salvar alterações</>}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
