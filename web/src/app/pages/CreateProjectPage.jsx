import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, FolderPlus, Loader2, Plus, X } from "lucide-react";
import { areaService } from "../services/areaService";
import { projectService } from "../services/projectService";
import { userService } from "../services/userService";
import { useAuth } from "../hooks/useAuth";
import { validateProjectDates } from "../utils/projectFormValidation";
import "./CreateProjectPage.css";

const INITIAL_FORM = {
  titulo: "",
  descricao: "",
  requisitos: "",
  tecnologias: [],
  areaId: "",
  vagas: "",
  dataInicio: "",
  dataFim: "",
  dataLimiteInscricao: "",
  orientadorId: "",
};

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areasError, setAreasError] = useState(null);
  const [advisors, setAdvisors] = useState([]);
  const [advisorsLoading, setAdvisorsLoading] = useState(false);
  const [advisorsError, setAdvisorsError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [technologyDraft, setTechnologyDraft] = useState("");
  const isStudent = user?.tipo === "ALUNO";

  function parseTextList(value) {
    return String(value ?? "")
      .split(/[,;\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function addTechnologies() {
    const items = parseTextList(technologyDraft);
    if (items.length === 0) return;

    setForm((prev) => {
      const existing = new Set(prev.tecnologias.map((item) => item.toLowerCase()));
      const next = [...prev.tecnologias];
      items.forEach((item) => {
        const key = item.toLowerCase();
        if (!existing.has(key)) {
          existing.add(key);
          next.push(item);
        }
      });
      return { ...prev, tecnologias: next };
    });
    setTechnologyDraft("");
    if (error) setError(null);
  }

  function removeTechnology(value) {
    setForm((prev) => ({
      ...prev,
      tecnologias: prev.tecnologias.filter((item) => item !== value),
    }));
  }

  function handleTechnologyKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTechnologies();
    }
  }

  useEffect(() => {
    let alive = true;

    setAreasLoading(true);
    areaService
      .list()
      .then((payload) => {
        if (!alive) return;
        const next = Array.isArray(payload) ? payload : [];
        setAreas(next);
      })
      .catch(() => {
        if (!alive) return;
        setAreas([]);
        setAreasError("Não foi possível carregar as áreas cadastradas.");
      })
      .finally(() => {
        if (!alive) return;
        setAreasLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!isStudent) {
      setAdvisors([]);
      setAdvisorsLoading(false);
      setAdvisorsError(null);
      return;
    }

    let alive = true;

    setAdvisorsLoading(true);
    userService
      .listAdvisors()
      .then((payload) => {
        if (!alive) return;
        setAdvisors(Array.isArray(payload) ? payload : []);
      })
      .catch(() => {
        if (!alive) return;
        setAdvisors([]);
        setAdvisorsError("Não foi possível carregar os orientadores cadastrados.");
      })
      .finally(() => {
        if (!alive) return;
        setAdvisorsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [isStudent]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.titulo.trim()) { setError("O título é obrigatório."); return; }
    if (!form.areaId) { setError("Selecione uma área de pesquisa."); return; }
    if (!areas.some((area) => String(area.id) === form.areaId)) { setError("Selecione uma área cadastrada."); return; }
    if (isStudent && !form.orientadorId) { setError("Selecione o orientador que deve avaliar o projeto."); return; }
    if (isStudent && !advisors.some((advisor) => String(advisor.id) === form.orientadorId)) { setError("Selecione um orientador cadastrado."); return; }
    if (!form.vagas || Number(form.vagas) < 1) { setError("Informe o número de vagas (mínimo 1)."); return; }
    const dateError = validateProjectDates(form);
    if (dateError) { setError(dateError); return; }

    setLoading(true);
    setError(null);

    try {
      const tecnologias = [...form.tecnologias];
      parseTextList(technologyDraft).forEach((item) => {
        if (!tecnologias.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
          tecnologias.push(item);
        }
      });

      const payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        requisitos: form.requisitos.trim() || undefined,
        tecnologias: tecnologias.length > 0 ? tecnologias : undefined,
        areaId: Number(form.areaId),
        vagas: Number(form.vagas),
        dataInicio: form.dataInicio || undefined,
        dataFim: form.dataFim || undefined,
        dataLimiteInscricao: form.dataLimiteInscricao || undefined,
        orientadorId: isStudent ? Number(form.orientadorId) : undefined,
      };

      const created = await projectService.create(payload);
      setSuccess(true);

      const id = created?.id;
      setTimeout(() => {
        navigate(id ? `/app/projects/${id}` : "/app/projects");
      }, 1200);
    } catch (err) {
      setError(err.message ?? "Não foi possível criar o projeto. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const areasUnavailable = !areasLoading && areas.length === 0;
  const advisorsUnavailable = isStudent && !advisorsLoading && advisors.length === 0;
  const isDisabled = loading || success || areasUnavailable || advisorsUnavailable;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="pagina-criar-projeto"
    >
      <div className="pagina-criar-projeto__cabecalho">
        <button type="button" onClick={() => navigate("/app/projects")} className="pagina-criar-projeto__botao-voltar">
          <ArrowLeft size={16} />
          Voltar
        </button>
        <div>
          <h2 className="pagina-criar-projeto__titulo">Novo projeto</h2>
          <p className="pagina-criar-projeto__subtitulo">
            Preencha as informações para publicar seu projeto de pesquisa
          </p>
        </div>
      </div>

      <div className="pagina-criar-projeto__conteudo">
        <form onSubmit={handleSubmit} className="formulario-projeto" noValidate>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="formulario-projeto__alerta formulario-projeto__alerta--erro"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="formulario-projeto__alerta formulario-projeto__alerta--sucesso"
            >
              Projeto criado com sucesso! Redirecionando...
            </motion.div>
          )}

          {areasUnavailable && (
            <div className="formulario-projeto__alerta formulario-projeto__alerta--erro" role="alert">
              {areasError ?? "Nenhuma área de pesquisa cadastrada. Solicite ao administrador o cadastro de uma área antes de criar projetos."}
            </div>
          )}

          {advisorsUnavailable && (
            <div className="formulario-projeto__alerta formulario-projeto__alerta--erro" role="alert">
              {advisorsError ?? "Nenhum orientador ativo encontrado. Solicite ao administrador o cadastro de um orientador antes de criar projetos."}
            </div>
          )}

          {/* Título */}
          <div className="formulario-projeto__campo">
            <label htmlFor="titulo" className="formulario-projeto__rotulo">
              Título <span className="formulario-projeto__obrigatorio">*</span>
            </label>
            <input
              id="titulo" name="titulo" type="text"
              value={form.titulo} onChange={handleChange}
              placeholder="Ex: Sistema de detecção de anomalias com IA"
              className="formulario-projeto__input"
              maxLength={200} disabled={isDisabled} autoFocus
            />
          </div>

          {/* Descrição */}
          <div className="formulario-projeto__campo">
            <label htmlFor="descricao" className="formulario-projeto__rotulo">Descrição</label>
            <textarea
              id="descricao" name="descricao"
              value={form.descricao} onChange={handleChange}
              placeholder="Descreva os objetivos, metodologia e resultados esperados..."
              className="formulario-projeto__textarea"
              rows={4} disabled={isDisabled}
            />
          </div>

          {/* Requisitos */}
          <div className="formulario-projeto__campo">
            <label htmlFor="requisitos" className="formulario-projeto__rotulo">Requisitos</label>
            <input
              id="requisitos" name="requisitos" type="text"
              value={form.requisitos} onChange={handleChange}
              placeholder="Ex: Conhecimento em Python, estatística básica"
              className="formulario-projeto__input"
              disabled={isDisabled}
            />
          </div>

          <div className="formulario-projeto__campo">
            <label htmlFor="tecnologias" className="formulario-projeto__rotulo">Tecnologias e competências</label>
            <div className="formulario-projeto__lista-input">
              <input
                id="tecnologias" name="tecnologias" type="text"
                value={technologyDraft}
                onChange={(e) => setTechnologyDraft(e.target.value)}
                onKeyDown={handleTechnologyKeyDown}
                onBlur={addTechnologies}
                placeholder="Ex: React, Spring Boot, PostgreSQL"
                className="formulario-projeto__input"
                disabled={isDisabled}
              />
              <button
                type="button"
                className="formulario-projeto__botao-adicionar"
                onMouseDown={(e) => e.preventDefault()}
                onClick={addTechnologies}
                disabled={isDisabled || !technologyDraft.trim()}
                aria-label="Adicionar tecnologia"
              >
                <Plus size={16} />
              </button>
            </div>
            {form.tecnologias.length > 0 && (
              <div className="formulario-projeto__chips" aria-label="Tecnologias adicionadas">
                {form.tecnologias.map((technology) => (
                  <span key={technology} className="formulario-projeto__chip">
                    {technology}
                    <button
                      type="button"
                      onClick={() => removeTechnology(technology)}
                      disabled={isDisabled}
                      aria-label={`Remover ${technology}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Area + Vagas */}
          <div className="formulario-projeto__grade-2">
            <div className="formulario-projeto__campo">
              <label htmlFor="areaId" className="formulario-projeto__rotulo">
                Área de pesquisa <span className="formulario-projeto__obrigatorio">*</span>
              </label>
              <select
                id="areaId" name="areaId"
                value={form.areaId} onChange={handleChange}
                className="formulario-projeto__select"
                disabled={isDisabled || areasLoading}
              >
                <option value="">
                  {areasLoading ? "Carregando..." : areasUnavailable ? "Nenhuma área cadastrada" : "Selecione uma área"}
                </option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </div>

            <div className="formulario-projeto__campo">
              <label htmlFor="vagas" className="formulario-projeto__rotulo">
                Vagas <span className="formulario-projeto__obrigatorio">*</span>
              </label>
              <input
                id="vagas" name="vagas" type="number" min={1} max={99}
                value={form.vagas} onChange={handleChange}
                placeholder="Ex: 3"
                className="formulario-projeto__input"
                disabled={isDisabled}
              />
            </div>
          </div>

          {isStudent && (
            <div className="formulario-projeto__campo">
              <label htmlFor="orientadorId" className="formulario-projeto__rotulo">
                Orientador <span className="formulario-projeto__obrigatorio">*</span>
              </label>
              <select
                id="orientadorId" name="orientadorId"
                value={form.orientadorId} onChange={handleChange}
                className="formulario-projeto__select"
                disabled={isDisabled || advisorsLoading}
              >
                <option value="">
                  {advisorsLoading ? "Carregando..." : advisorsUnavailable ? "Nenhum orientador cadastrado" : "Selecione um orientador"}
                </option>
                {advisors.map((advisor) => (
                  <option key={advisor.id} value={advisor.id}>{advisor.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Datas */}
          <div className="formulario-projeto__grade-3">
            <div className="formulario-projeto__campo">
              <label htmlFor="dataInicio" className="formulario-projeto__rotulo">Data de início</label>
              <input
                id="dataInicio" name="dataInicio" type="date"
                value={form.dataInicio} onChange={handleChange}
                className="formulario-projeto__input" disabled={isDisabled}
              />
            </div>
            <div className="formulario-projeto__campo">
              <label htmlFor="dataFim" className="formulario-projeto__rotulo">Data de término</label>
              <input
                id="dataFim" name="dataFim" type="date"
                value={form.dataFim} onChange={handleChange}
                className="formulario-projeto__input" disabled={isDisabled}
              />
            </div>
            <div className="formulario-projeto__campo">
              <label htmlFor="dataLimiteInscricao" className="formulario-projeto__rotulo">Limite de inscrição</label>
              <input
                id="dataLimiteInscricao" name="dataLimiteInscricao" type="date"
                value={form.dataLimiteInscricao} onChange={handleChange}
                className="formulario-projeto__input" disabled={isDisabled}
              />
            </div>
          </div>

          {/* Acoes */}
          <div className="formulario-projeto__acoes">
            <button
              type="button" onClick={() => navigate("/app/projects")}
              className="formulario-projeto__botao-cancelar"
              disabled={loading}
            >
              Cancelar
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.97 }}
              className="formulario-projeto__botao-criar"
              disabled={isDisabled}
            >
              {loading ? (
                <><Loader2 size={16} className="formulario-projeto__spinner" /> Criando...</>
              ) : (
                <><FolderPlus size={16} /> Criar projeto</>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
