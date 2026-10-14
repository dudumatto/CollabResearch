import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Envelope, Buildings, GraduationCap, FloppyDisk, X, PencilSimple, User } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { advisorService } from "../services/advisorService";
import { userService } from "../services/userService";
import { mapOrientadorPerfil, withImageCacheBuster } from "../utils/adapters";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { StatusView } from "../components/StatusView";
import { Sk, SkLines } from "../components/Skeleton";
import { AppCombobox } from "../components/ui/AppCombobox";
import { INSTITUICOES, TITULACOES, DEPARTAMENTOS } from "../constants/academicOptions";
import "./AdvisorWorkspace.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function iniciais(nome = "") {
  return String(nome)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function resetFormFromPerfil(perfil) {
  return {
    nome: perfil?.nome ?? "",
    email: perfil?.email ?? "",
    instituicao: perfil?.instituicao ?? "",
    departamento: perfil?.departamento ?? "",
    titulacao: perfil?.titulacao ?? "",
    bio: perfil?.bio ?? "",
    fotoPerfilUrl: perfil?.fotoPerfilUrl ?? "",
  };
}

const CAMPOS_PERFIL = [
  ["perfil-nome", "Nome *"],
  ["perfil-email", "E-mail *"],
  ["perfil-instituicao", "Instituição"],
  ["perfil-departamento", "Departamento"],
  ["perfil-titulacao", "Titulação"],
];

const BIO_MAX = 500;

export default function AdvisorProfilePage() {
  const { user, refreshUser } = useAuth();
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { data: perfil, loading, error, reload } = useAsyncData(
    async () => mapOrientadorPerfil(await advisorService.perfil()),
    [],
    { initialData: null },
  );

  const [form, setForm] = useState(null);
  const bioRef = useRef(null);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const el = bioRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [form?.bio, editing]);
  const [salvando, setSalvando] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    if (perfil && (!form || !editing)) {
      setForm(resetFormFromPerfil(perfil));
    }
  }, [perfil, editing]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [form?.fotoPerfilUrl]);

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
    if (!EMAIL_REGEX.test(form.email.trim())) {
      toast.error("Informe um e-mail válido.");
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
      setForm(resetFormFromPerfil({ ...form, ...atualizado }));
      toast.success("Perfil atualizado com sucesso.");
      setEditing(false);
      await reload();
      await refreshUser();
    } catch (err) {
      toast.error(getErrorMessage(normalizeError(err), "Não foi possível salvar o perfil."));
    } finally {
      setSalvando(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    const userId = user?.id ?? perfil?.id;
    if (!file || !userId || !form) return;

    try {
      setUploadingAvatar(true);
      const updatedProfile = await userService.uploadProfilePhoto(file);
      const fotoPerfilUrl = withImageCacheBuster(updatedProfile?.fotoPerfilUrl);
      if (!fotoPerfilUrl) {
        throw new Error("Não foi possível enviar a foto de perfil.");
      }
      setForm(resetFormFromPerfil({ ...form, fotoPerfilUrl }));
      await reload();
      await refreshUser();
      toast.success("Foto de perfil atualizada.");
    } catch (err) {
      toast.error(err.message || "Não foi possível atualizar a foto.");
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  // Layout, rótulos e ações aparecem na hora; só os dados do perfil mostram skeleton.
  const pendente = loading && !perfil;

  if (!loading && (normError || !perfil)) {
    return <StatusView title="Não foi possível carregar o perfil" description={getErrorMessage(normError, "Perfil não encontrado.")} />;
  }

  const editavel = Boolean(form);
  const showProfilePhoto = Boolean(form?.fotoPerfilUrl) && !avatarLoadFailed;
  const busy = salvando || uploadingAvatar;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="advisor-pagina advisor-profile-standard"
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
            <div className="advisor-profile-standard__avatar-wrap">
              {pendente ? (
                <Sk w="4rem" h="4rem" r="var(--raio-grande)" />
              ) : showProfilePhoto ? (
                <img
                  src={form.fotoPerfilUrl}
                  alt="Foto de perfil"
                  onError={() => setAvatarLoadFailed(true)}
                  className="advisor-profile-standard__avatar-img"
                />
              ) : (
                <div className="advisor-perfil-cartao__avatar">{iniciais(perfil?.nome)}</div>
              )}
              {editing && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    onChange={handleAvatarUpload}
                    className="advisor-profile-standard__avatar-input"
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="cartao-perfil__botao-avatar advisor-profile-standard__avatar-button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={busy}
                    title="Alterar foto"
                  >
                    <PencilSimple size={12} />
                  </button>
                </>
              )}
            </div>
            {pendente ? (
              <>
                <Sk w="60%" h={18} />
                <Sk w="40%" h={13} />
                <SkLines rows={3} h={14} gap="var(--espaco-2)" label="Carregando perfil" />
              </>
            ) : (
            <>
            <h3 className="advisor-perfil-cartao__nome">{perfil.nome}</h3>
            <p className="advisor-perfil-cartao__meta">{perfil.titulacao || "Professor/Orientador"}</p>
            <div className="advisor-perfil-cartao__info">
              {perfil.email && (
                <div className="advisor-perfil-cartao__info-item">
                  <Envelope size={14} className="advisor-perfil-cartao__info-icone" />
                  <span>{perfil.email}</span>
                </div>
              )}
              {perfil.instituicao && (
                <div className="advisor-perfil-cartao__info-item">
                  <Buildings size={14} className="advisor-perfil-cartao__info-icone" />
                  <span>{perfil.instituicao}</span>
                </div>
              )}
              {perfil.departamento && (
                <div className="advisor-perfil-cartao__info-item">
                  <GraduationCap size={14} className="advisor-perfil-cartao__info-icone" />
                  <span>{perfil.departamento}</span>
                </div>
              )}
            </div>
            </>
            )}
          </div>

          <div className="advisor-card-conteudo" style={{ padding: "var(--espaco-4)" }}>
            <p className="advisor-card-conteudo__titulo" style={{ fontSize: "var(--tamanho-normal)" }}>
              Números
            </p>
            <div className="advisor-notas">
              <div className="advisor-nota">
                <span className="advisor-nota__rotulo">Projetos</span>
                <span className="advisor-nota__valor">{pendente ? <Sk inline w={28} h={20} /> : perfil.projetos}</span>
              </div>
              <div className="advisor-nota">
                <span className="advisor-nota__rotulo">Orientandos</span>
                <span className="advisor-nota__valor">{pendente ? <Sk inline w={28} h={20} /> : perfil.orientandos}</span>
              </div>
              <div className="advisor-nota">
                <span className="advisor-nota__rotulo">Avaliações</span>
                <span className="advisor-nota__valor">{pendente ? <Sk inline w={28} h={20} /> : perfil.avaliacoes}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="advisor-card-conteudo">
          <div className="advisor-modal__cabecalho">
            <p className="advisor-card-conteudo__titulo" style={{ fontSize: "var(--tamanho-normal)" }}>
              Dados do perfil
            </p>
            <div className="advisor-profile-standard__actions">
              <span className="advisor-etiqueta advisor-etiqueta--cinza">Professor/Orientador</span>
              {!editing && (
                <button type="button" onClick={() => setEditing(true)} className="advisor-botao advisor-botao--secundario">
                  <PencilSimple size={16} />
                  Editar perfil
                </button>
              )}
            </div>
          </div>

          {!editavel && (
            <>
              <div className="advisor-profile-standard__form-grid" aria-busy="true" aria-label="Carregando formulário">
                {CAMPOS_PERFIL.map(([id, rotulo]) => (
                  <div className="advisor-campo" key={id}>
                    <span className="advisor-campo__rotulo">{rotulo}</span>
                    <Sk h={40} r="var(--raio-medio)" />
                  </div>
                ))}
              </div>
              <div className="advisor-campo">
                <span className="advisor-campo__rotulo">Biografia</span>
                <Sk h={80} r="var(--raio-medio)" />
              </div>
            </>
          )}

          {editavel && (
            <>
              <div className="advisor-profile-standard__form-grid">
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="perfil-nome">Nome *</label>
                  <div className="advisor-profile-standard__input-wrap">
                    <User size={14} className="advisor-profile-standard__input-icon" />
                    <input
                      id="perfil-nome"
                      type="text"
                      value={form.nome}
                      disabled={!editing}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      className="advisor-campo__input advisor-profile-standard__input"
                    />
                  </div>
                </div>
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="perfil-email">E-mail *</label>
                  <div className="advisor-profile-standard__input-wrap">
                    <Envelope size={14} className="advisor-profile-standard__input-icon" />
                    <input
                      id="perfil-email"
                      type="email"
                      value={form.email}
                      disabled={!editing}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="advisor-campo__input advisor-profile-standard__input"
                    />
                  </div>
                </div>
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="perfil-instituicao">Instituição</label>
                  <AppCombobox
                    id="perfil-instituicao"
                    ariaLabel="Selecionar instituição"
                    disabled={!editing}
                    className="advisor-campo__input app-combobox--advisor-input"
                    value={form.instituicao}
                    placeholder="Selecione a instituição"
                    onChange={(nextValue) => setForm({ ...form, instituicao: nextValue })}
                    options={INSTITUICOES.map((instituicao) => ({ value: instituicao, label: instituicao }))}
                  />
                </div>
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="perfil-departamento">Departamento</label>
                  <AppCombobox
                    id="perfil-departamento"
                    ariaLabel="Selecionar departamento"
                    disabled={!editing}
                    className="advisor-campo__input app-combobox--advisor-input"
                    value={form.departamento}
                    placeholder="Selecione o departamento"
                    onChange={(nextValue) => setForm({ ...form, departamento: nextValue })}
                    options={DEPARTAMENTOS.map((departamento) => ({ value: departamento, label: departamento }))}
                  />
                </div>
                <div className="advisor-campo">
                  <label className="advisor-campo__rotulo" htmlFor="perfil-titulacao">Titulação</label>
                  <AppCombobox
                    id="perfil-titulacao"
                    ariaLabel="Selecionar titulação"
                    disabled={!editing}
                    className="advisor-campo__input app-combobox--advisor-input"
                    value={form.titulacao}
                    placeholder="Selecione a titulação"
                    onChange={(nextValue) => setForm({ ...form, titulacao: nextValue })}
                    options={TITULACOES.map((titulacao) => ({ value: titulacao, label: titulacao }))}
                  />
                </div>
              </div>

              <div className="advisor-campo">
                <label className="advisor-campo__rotulo" htmlFor="perfil-bio">Biografia</label>
                <textarea
                  id="perfil-bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  disabled={!editing}
                  ref={bioRef}
                  rows={3}
                  maxLength={BIO_MAX}
                  className="advisor-campo__input advisor-campo__bio"
                  placeholder="Conte sobre sua trajetória, áreas de pesquisa e interesses..."
                />
                {editing && <span className="advisor-campo__contador">{form.bio.length}/{BIO_MAX}</span>}
              </div>

              {editing && (
                <div className="advisor-modal__rodape" style={{ justifyContent: "flex-start" }}>
                  <button type="button" className="advisor-botao advisor-botao--primario" onClick={salvar} disabled={busy}>
                    {busy ? <span className="secao-perfil__spinner" /> : <FloppyDisk size={16} />}
                    Salvar alterações
                  </button>
                  <button
                    type="button"
                    className="advisor-botao advisor-botao--secundario"
                    onClick={() => {
                      setEditing(false);
                      setForm(resetFormFromPerfil(perfil));
                    }}
                    disabled={busy}
                  >
                    <X size={16} />
                    Descartar alterações
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
