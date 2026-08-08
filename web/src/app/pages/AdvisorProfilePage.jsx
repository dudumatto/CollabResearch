import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Building2, GraduationCap, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { mapOrientadorPerfil } from "../utils/adapters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import "./AdvisorWorkspace.css";

function iniciais(nome = "") {
  return String(nome)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function PerfilSkeleton() {
  return (
    <div className="advisor-pagina">
      <div className="advisor-detalhe-grade">
        <div className="advisor-detalhe-lateral">
          <div className="skeleton" style={{ width: "100%", height: 260, borderRadius: "var(--raio-grande)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-4)" }}>
          <div className="skeleton" style={{ width: "100%", height: 120, borderRadius: "var(--raio-grande)" }} />
          <div className="skeleton" style={{ width: "100%", height: 260, borderRadius: "var(--raio-grande)" }} />
        </div>
      </div>
    </div>
  );
}

export default function AdvisorProfilePage() {
  const { data: perfil, loading, error, reload } = useAsyncData(
    async () => mapOrientadorPerfil(await advisorService.perfil()),
    [],
    { initialData: null },
  );

  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (perfil && !form) {
      setForm({
        nome: perfil.nome ?? "",
        email: perfil.email ?? "",
        instituicao: perfil.instituicao ?? "",
        departamento: perfil.departamento ?? "",
        titulacao: perfil.titulacao ?? "",
        bio: perfil.bio ?? "",
        fotoPerfilUrl: perfil.fotoPerfilUrl ?? "",
      });
    }
  }, [perfil, form]);

  const normError = error ? normalizeError(error) : null;

  const salvar = async () => {
    if (!form) return;
    if (!form.nome.trim()) {
      toast.error("Informe o seu nome.");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Informe o seu e-mail.");
      return;
    }
    setSalvando(true);
    try {
      const atualizado = mapOrientadorPerfil(
        await advisorService.atualizarPerfil({
          nome: form.nome.trim(),
          email: form.email.trim(),
          instituicao: form.instituicao.trim(),
          departamento: form.departamento.trim(),
          titulacao: form.titulacao.trim(),
          bio: form.bio.trim(),
          fotoPerfilUrl: form.fotoPerfilUrl.trim(),
        }),
      );
      setForm({
        nome: atualizado.nome ?? form.nome,
        email: atualizado.email ?? form.email,
        instituicao: atualizado.instituicao ?? form.instituicao,
        departamento: atualizado.departamento ?? form.departamento,
        titulacao: atualizado.titulacao ?? form.titulacao,
        bio: atualizado.bio ?? form.bio,
        fotoPerfilUrl: atualizado.fotoPerfilUrl ?? form.fotoPerfilUrl,
      });
      toast.success("Perfil atualizado com sucesso.");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível salvar o perfil."));
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <PerfilSkeleton />;

  if (normError || !perfil) {
    return <StatusView title="Não foi possível carregar o perfil" description={getErrorMessage(normError, "Perfil não encontrado.")} />;
  }

  const editavel = Boolean(form);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina"
    >
      <div className="advisor-hero" style={{ padding: "var(--espaco-4)" }}>
        <h2 className="advisor-hero__titulo" style={{ fontSize: "var(--tamanho-titulo)" }}>
          Meu perfil
        </h2>
        <p className="advisor-hero__subtitulo">
          Mantenha seus dados profissionais atualizados para os alunos te encontrarem.
        </p>
      </div>

      <div className="advisor-detalhe-grade">
        <div className="advisor-detalhe-lateral">
          <div className="advisor-perfil-cartao">
            {form?.fotoPerfilUrl ? (
              <img
                src={form.fotoPerfilUrl}
                alt="Foto de perfil"
                style={{ width: "4.5rem", height: "4.5rem", borderRadius: "var(--raio-completo)", objectFit: "cover" }}
              />
            ) : (
              <div className="advisor-perfil-cartao__avatar">{iniciais(perfil.nome)}</div>
            )}
            <h3 className="advisor-perfil-cartao__nome">{perfil.nome}</h3>
            <p className="advisor-perfil-cartao__meta">{perfil.titulacao || "Professor/Orientador"}</p>
            <div className="advisor-perfil-cartao__info">
              {perfil.email && (
                <div className="advisor-perfil-cartao__info-item">
                  <Mail size={14} className="advisor-perfil-cartao__info-icone" />
                  {perfil.email}
                </div>
              )}
              {perfil.instituicao && (
                <div className="advisor-perfil-cartao__info-item">
                  <Building2 size={14} className="advisor-perfil-cartao__info-icone" />
                  {perfil.instituicao}
                </div>
              )}
              {perfil.departamento && (
                <div className="advisor-perfil-cartao__info-item">
                  <GraduationCap size={14} className="advisor-perfil-cartao__info-icone" />
                  {perfil.departamento}
                </div>
              )}
            </div>
          </div>

          <div className="advisor-card-conteudo" style={{ padding: "var(--espaco-4)" }}>
            <p className="advisor-card-conteudo__titulo" style={{ fontSize: "var(--tamanho-normal)" }}>
              Números
            </p>
            <div className="advisor-notas">
              <div className="advisor-nota">
                <span className="advisor-nota__rotulo">Projetos</span>
                <span className="advisor-nota__valor">{perfil.projetos}</span>
              </div>
              <div className="advisor-nota">
                <span className="advisor-nota__rotulo">Orientandos</span>
                <span className="advisor-nota__valor">{perfil.orientandos}</span>
              </div>
              <div className="advisor-nota">
                <span className="advisor-nota__rotulo">Avaliações</span>
                <span className="advisor-nota__valor">{perfil.avaliacoes}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="advisor-card-conteudo">
          <div className="advisor-modal__cabecalho">
            <p className="advisor-card-conteudo__titulo" style={{ fontSize: "var(--tamanho-normal)" }}>
              Dados do perfil
            </p>
            <span className="advisor-etiqueta advisor-etiqueta--cinza">Professor/Orientador</span>
          </div>

          {!editavel && <p className="advisor-linha-card__meta">Carregando formulário...</p>}

          {editavel && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--espaco-3)" }}>
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="perfil-nome">Nome *</label>
                  <input
                    id="perfil-nome"
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="advisor-campo__input"
                  />
                </div>
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="perfil-email">E-mail *</label>
                  <input
                    id="perfil-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="advisor-campo__input"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--espaco-3)" }}>
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="perfil-instituicao">Instituição</label>
                  <input
                    id="perfil-instituicao"
                    type="text"
                    value={form.instituicao}
                    onChange={(e) => setForm({ ...form, instituicao: e.target.value })}
                    className="advisor-campo__input"
                  />
                </div>
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="perfil-departamento">Departamento</label>
                  <input
                    id="perfil-departamento"
                    type="text"
                    value={form.departamento}
                    onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                    className="advisor-campo__input"
                  />
                </div>
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="perfil-titulacao">Titulação</label>
                  <input
                    id="perfil-titulacao"
                    type="text"
                    value={form.titulacao}
                    onChange={(e) => setForm({ ...form, titulacao: e.target.value })}
                    className="advisor-campo__input"
                    placeholder="Ex.: Doutor em Ciência da Computação"
                  />
                </div>
              </div>

              <div className="advisor-campo">
                <label className="advisor-campo__rotulo" htmlFor="perfil-foto">URL da foto de perfil</label>
                <input
                  id="perfil-foto"
                  type="text"
                  value={form.fotoPerfilUrl}
                  onChange={(e) => setForm({ ...form, fotoPerfilUrl: e.target.value })}
                  className="advisor-campo__input"
                  placeholder="https://..."
                />
              </div>

              <div className="advisor-campo">
                <label className="advisor-campo__rotulo" htmlFor="perfil-bio">Biografia</label>
                <textarea
                  id="perfil-bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={5}
                  maxLength={2000}
                  className="advisor-campo__input"
                  placeholder="Conte sobre sua trajetória, áreas de pesquisa e interesses..."
                />
              </div>

              <div className="advisor-modal__rodape" style={{ justifyContent: "flex-start" }}>
                <button type="button" className="advisor-botao advisor-botao--primario" onClick={salvar} disabled={salvando}>
                  <Save size={16} />
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
                <button
                  type="button"
                  className="advisor-botao advisor-botao--secundario"
                  onClick={() =>
                    setForm({
                      nome: perfil.nome ?? "",
                      email: perfil.email ?? "",
                      instituicao: perfil.instituicao ?? "",
                      departamento: perfil.departamento ?? "",
                      titulacao: perfil.titulacao ?? "",
                      bio: perfil.bio ?? "",
                      fotoPerfilUrl: perfil.fotoPerfilUrl ?? "",
                    })
                  }
                  disabled={salvando}
                >
                  <X size={16} />
                  Descartar alterações
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
