import { useEffect, useMemo, useRef, useState } from "react";
import { User, Mail, BookOpen, Building2, GraduationCap, Edit3, Save, X, Award } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { useUploadDocumento } from "../../hooks/useUploadDocumento";
import { courseService } from "../services/courseService";
import { userService } from "../services/userService";
import { applicationService } from "../services/applicationService";
import { mapApplication } from "../utils/adapters";
import { formatUserType } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import { AppCombobox } from "../components/ui/AppCombobox";
import { ProfileDocuments } from "../components/ProfileDocuments";
import "./AdvisorWorkspace.css";
import "./ProfilePage.css";

function initials(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "IC";
}

function ProfileSkeleton() {
  return (
    <div className="advisor-pagina advisor-profile-standard student-profile-standard">
      <div className="advisor-detalhe-grade">
        <div className="advisor-detalhe-lateral">
          <div className="skeleton" style={{ width: "100%", height: 260, borderRadius: "var(--raio-grande)" }} />
          <div className="skeleton" style={{ width: "100%", height: 120, borderRadius: "var(--raio-grande)" }} />
        </div>
        <div className="student-profile-standard__main">
          <div className="skeleton" style={{ width: "100%", height: 320, borderRadius: "var(--raio-grande)" }} />
          <div className="skeleton" style={{ width: "100%", height: 220, borderRadius: "var(--raio-grande)" }} />
        </div>
      </div>
    </div>
  );
}

function resetFormFromProfile(profile) {
  return {
    nome: profile?.nome ?? "",
    email: profile?.email ?? "",
    cursoId: profile?.cursoId ? String(profile.cursoId) : "",
    instituicao: profile?.instituicao ?? "",
    semestre: profile?.semestre ?? "",
    bio: profile?.bio ?? "",
  };
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const avatarInputRef = useRef(null);
  const { upload: uploadAvatar, uploading: uploadingAvatar } = useUploadDocumento();
  const { data, loading, error, reload } = useAsyncData(async () => {
    if (!user?.id) return { profile: user, applications: [], documents: [], courses: [] };
    const [profile, applications, documents, courses] = await Promise.all([
      userService.getCurrentUser().catch(() => user),
      applicationService.listMine().catch(() => []),
      userService.getDocuments(user.id).catch(() => []),
      courseService.list().catch(() => []),
    ]);

    return {
      profile,
      applications: Array.isArray(applications) ? applications.map(mapApplication) : [],
      documents: Array.isArray(documents) ? documents : [],
      courses: Array.isArray(courses) ? courses : [],
    };
  }, [user?.id], { initialData: { profile: user, applications: [], documents: [], courses: [] } });

  const [editing, setEditing] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    cursoId: "",
    instituicao: "",
    semestre: "",
    bio: "",
  });

  useEffect(() => {
    if (data?.profile) {
      setForm(resetFormFromProfile(data.profile));
    }
  }, [data]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [data?.profile?.fotoPerfilUrl]);

  const approvedApps = useMemo(
    () => (data?.applications ?? []).filter((item) => item.status === "APROVADO").length,
    [data],
  );

  const handleSave = async () => {
    if (!user?.id) return;
    setLoadingSave(true);

    try {
      await userService.update(user.id, {
        nome: form.nome,
        email: form.email,
        cursoId: form.cursoId === "" ? null : Number(form.cursoId),
        instituicao: form.instituicao,
        semestre: form.semestre === "" ? null : Number(form.semestre),
        bio: form.bio,
      });
      await reload();
      await refreshUser();
      toast.success("Perfil atualizado com sucesso.");
      setEditing(false);
    } catch (err) {
      toast.error(err.message || "Não foi possível salvar o perfil.");
    } finally {
      setLoadingSave(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      const uploaded = await uploadAvatar(file, `usuarios/${user.id}/foto-perfil`);
      if (!uploaded?.publicUrl) {
        throw new Error("Não foi possível enviar a foto de perfil.");
      }

      await userService.update(user.id, {
        nome: form.nome,
        email: form.email,
        cursoId: form.cursoId === "" ? null : Number(form.cursoId),
        instituicao: form.instituicao,
        semestre: form.semestre === "" ? null : Number(form.semestre),
        bio: form.bio,
        fotoPerfilUrl: uploaded.publicUrl,
      });
      await reload();
      await refreshUser();
      toast.success("Foto de perfil atualizada.");
    } catch (err) {
      toast.error(err.message || "Não foi possível atualizar a foto.");
    } finally {
      event.target.value = "";
    }
  };

  if (loading) return <ProfileSkeleton />;

  if (error || !data?.profile) {
    return <StatusView title="Falha ao carregar perfil" description={error?.message || "Perfil indisponível."} />;
  }

  const profile = data.profile;
  const isAluno = profile.tipo === "ALUNO";
  const courseOptions = Array.isArray(data?.courses) ? data.courses : [];
  const showProfilePhoto = Boolean(profile.fotoPerfilUrl) && !avatarLoadFailed;
  const profileType = formatUserType(profile.tipo);

  return (
    <div className="advisor-pagina advisor-profile-standard student-profile-standard">
      <div className="advisor-hero" style={{ padding: "var(--espaco-4)" }}>
        <h2 className="advisor-hero__titulo" style={{ fontSize: "var(--tamanho-titulo)" }}>
          Meu perfil
        </h2>
        <p className="advisor-hero__subtitulo">
          Mantenha seus dados acadêmicos, currículo e documentos atualizados.
        </p>
      </div>

      <div className="advisor-detalhe-grade">
        <div className="advisor-detalhe-lateral">
          <div className="advisor-perfil-cartao student-profile-card">
            <div className="student-profile-card__avatar-wrap">
              {showProfilePhoto ? (
                <img
                  src={profile.fotoPerfilUrl}
                  alt={profile.nome ?? "Foto de perfil"}
                  onError={() => setAvatarLoadFailed(true)}
                  className="student-profile-card__avatar-img"
                />
              ) : (
                <div className="advisor-perfil-cartao__avatar">{initials(profile.nome)}</div>
              )}
              {editing && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    onChange={handleAvatarUpload}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="cartao-perfil__botao-avatar student-profile-card__avatar-button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    title="Alterar foto"
                  >
                    <Edit3 size={12} />
                  </button>
                </>
              )}
            </div>

            <h3 className="advisor-perfil-cartao__nome">{profile.nome}</h3>
            <p className="advisor-perfil-cartao__meta">{profile.cursoNome || profileType}</p>

            <div className="advisor-perfil-cartao__info">
              {profile.email && (
                <div className="advisor-perfil-cartao__info-item">
                  <Mail size={14} className="advisor-perfil-cartao__info-icone" />
                  <span>{profile.email}</span>
                </div>
              )}
              <div className="advisor-perfil-cartao__info-item">
                <BookOpen size={14} className="advisor-perfil-cartao__info-icone" />
                <span>{profile.cursoNome ?? "Curso não informado"}</span>
              </div>
              <div className="advisor-perfil-cartao__info-item">
                <Building2 size={14} className="advisor-perfil-cartao__info-icone" />
                <span>{profile.instituicao ?? "Instituição não informada"}</span>
              </div>
              <div className="advisor-perfil-cartao__info-item">
                <GraduationCap size={14} className="advisor-perfil-cartao__info-icone" />
                <span>{profile.semestre ? `${profile.semestre}º semestre` : "Semestre não informado"}</span>
              </div>
            </div>
          </div>

          <div className="advisor-card-conteudo" style={{ padding: "var(--espaco-4)" }}>
            <p className="advisor-card-conteudo__titulo" style={{ fontSize: "var(--tamanho-normal)" }}>
              Números
            </p>
            <div className="advisor-notas">
              <div className="advisor-nota">
                <span className="advisor-nota__rotulo">Projetos</span>
                <span className="advisor-nota__valor">{approvedApps}</span>
              </div>
              <div className="advisor-nota">
                <span className="advisor-nota__rotulo">Inscrições</span>
                <span className="advisor-nota__valor">{data.applications.length}</span>
              </div>
              <div className="advisor-nota">
                <span className="advisor-nota__rotulo">Tipo</span>
                <span className="advisor-nota__valor">{profileType}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="student-profile-standard__main">
          <div className="advisor-card-conteudo">
            <div className="advisor-modal__cabecalho">
              <p className="advisor-card-conteudo__titulo" style={{ fontSize: "var(--tamanho-normal)" }}>
                Dados do perfil
              </p>
              <div className="student-profile-standard__actions">
                <span className="advisor-etiqueta advisor-etiqueta--cinza">{profileType}</span>
                {!editing ? (
                  <button type="button" onClick={() => setEditing(true)} className="advisor-botao advisor-botao--secundario">
                    <Edit3 size={16} />
                    Editar perfil
                  </button>
                ) : null}
              </div>
            </div>

            <div className="student-profile-standard__form-grid">
              <div className="advisor-campo">
                <label className="advisor-campo__rotulo" htmlFor="perfil-nome">Nome *</label>
                <div className="student-profile-standard__input-wrap">
                  <User size={14} className="student-profile-standard__input-icon" />
                  <input
                    id="perfil-nome"
                    type="text"
                    value={form.nome}
                    disabled={!editing}
                    onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                    className="advisor-campo__input student-profile-standard__input"
                  />
                </div>
              </div>
              <div className="advisor-campo">
                <label className="advisor-campo__rotulo" htmlFor="perfil-email">E-mail *</label>
                <div className="student-profile-standard__input-wrap">
                  <Mail size={14} className="student-profile-standard__input-icon" />
                  <input
                    id="perfil-email"
                    type="email"
                    value={form.email}
                    disabled={!editing}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="advisor-campo__input student-profile-standard__input"
                  />
                </div>
              </div>
              <div className="advisor-campo">
                <label className="advisor-campo__rotulo" htmlFor="perfil-curso">Curso</label>
                <div className="student-profile-standard__input-wrap">
                  <BookOpen size={14} className="student-profile-standard__input-icon" />
                  <AppCombobox
                    id="perfil-curso"
                    ariaLabel="Selecionar curso"
                    className="advisor-campo__input student-profile-standard__input app-combobox--with-leading-icon"
                    value={form.cursoId}
                    disabled={!editing}
                    onChange={(nextValue) => setForm((prev) => ({ ...prev, cursoId: nextValue }))}
                    options={[
                      { value: "", label: "Selecione o curso" },
                      ...courseOptions.map((course) => ({ value: course.id, label: course.nome })),
                    ]}
                  />
                </div>
              </div>
              <div className="advisor-campo">
                <label className="advisor-campo__rotulo" htmlFor="perfil-instituicao">Instituição</label>
                <div className="student-profile-standard__input-wrap">
                  <Building2 size={14} className="student-profile-standard__input-icon" />
                  <input
                    id="perfil-instituicao"
                    type="text"
                    value={form.instituicao}
                    disabled={!editing}
                    onChange={(e) => setForm((prev) => ({ ...prev, instituicao: e.target.value }))}
                    className="advisor-campo__input student-profile-standard__input"
                  />
                </div>
              </div>
              <div className="advisor-campo">
                <label className="advisor-campo__rotulo" htmlFor="perfil-semestre">Semestre</label>
                <div className="student-profile-standard__input-wrap">
                  <GraduationCap size={14} className="student-profile-standard__input-icon" />
                  <input
                    id="perfil-semestre"
                    type="number"
                    min="1"
                    value={form.semestre}
                    disabled={!editing}
                    onChange={(e) => setForm((prev) => ({ ...prev, semestre: e.target.value }))}
                    className="advisor-campo__input student-profile-standard__input"
                  />
                </div>
              </div>
              <div className="advisor-campo">
                <label className="advisor-campo__rotulo" htmlFor="perfil-tipo">Tipo</label>
                <div className="student-profile-standard__input-wrap">
                  <Award size={14} className="student-profile-standard__input-icon" />
                  <input
                    id="perfil-tipo"
                    type="text"
                    value={profileType}
                    disabled
                    className="advisor-campo__input student-profile-standard__input"
                  />
                </div>
              </div>
            </div>

            <div className="advisor-campo">
              <label className="advisor-campo__rotulo" htmlFor="perfil-bio">Biografia</label>
              <textarea
                id="perfil-bio"
                value={form.bio}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                disabled={!editing}
                rows={5}
                maxLength={2000}
                className="advisor-campo__input"
                placeholder="Conte sobre sua trajetória acadêmica, interesses e objetivos de pesquisa..."
              />
            </div>

            {editing && (
              <div className="advisor-modal__rodape" style={{ justifyContent: "flex-start" }}>
                <button type="button" className="advisor-botao advisor-botao--primario" onClick={handleSave} disabled={loadingSave || uploadingAvatar}>
                  {loadingSave || uploadingAvatar ? <span className="secao-perfil__spinner" /> : <Save size={16} />}
                  Salvar alterações
                </button>
                <button
                  type="button"
                  className="advisor-botao advisor-botao--secundario"
                  onClick={() => {
                    setEditing(false);
                    setForm(resetFormFromProfile(profile));
                  }}
                  disabled={loadingSave || uploadingAvatar}
                >
                  <X size={16} />
                  Descartar alterações
                </button>
              </div>
            )}
          </div>

          {isAluno && (
            <div className="advisor-card-conteudo student-profile-standard__documents">
              <ProfileDocuments
                userId={user.id}
                documents={data.documents}
                editable
                onUploaded={reload}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
