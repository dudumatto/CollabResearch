"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { User, Mail, BookOpen, Building2, GraduationCap, Edit3, Save, X, Award, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { useUploadDocumento } from "../hooks/useUploadDocumento";
import { useTheme } from "../providers/ThemeProvider";
import { courseService } from "../services/courseService";
import { userService } from "../services/userService";
import { applicationService } from "../services/applicationService";
import { mapApplication } from "../utils/adapters";
import { formatApplicationStatus, formatUserType } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import { ProfileDocuments } from "../components/ProfileDocuments";
import "./ProfilePage.css";

function ProfileSkeleton() {
  const Sk = ({ w = "100%", h = 14, r = "0.5rem" }) => (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
  );
  return (
    <div className="pagina-perfil">
      <div className="pagina-perfil__grade">
        <div className="cartao-perfil">
          <div className="cartao-perfil__capa skeleton" style={{ borderRadius: "var(--raio-grande) var(--raio-grande) 0 0" }} />
          <div className="cartao-perfil__corpo" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Sk w={80} h={80} r="50%" />
            <Sk w="60%" h={18} />
            <Sk w="40%" h={13} />
            <Sk w="55%" h={13} />
            <div style={{ display: "flex", gap: 24, margin: "8px 0" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <Sk w={30} h={18} />
                  <Sk w={50} h={11} />
                </div>
              ))}
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", width: "100%" }}>
                <Sk w={16} h={16} r="50%" />
                <Sk w="75%" h={13} />
              </div>
            ))}
          </div>
        </div>
        <div className="pagina-perfil__conteudo-principal">
          <div className="secao-perfil">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--espaco-4)" }}>
              <Sk w={180} h={16} />
              <Sk w={100} h={32} r="var(--raio-medio)" />
            </div>
            <div className="secao-perfil__grade-campos">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Sk w="35%" h={13} />
                  <Sk w="100%" h={40} r="var(--raio-medio)" />
                </div>
              ))}
            </div>
            <div style={{ marginTop: "var(--espaco-4)", display: "flex", flexDirection: "column", gap: 6 }}>
              <Sk w="20%" h={13} />
              <Sk w="100%" h={72} r="var(--raio-medio)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { setTheme } = useTheme();
  const { data, loading, error, reload } = useAsyncData(async () => {
    if (!user?.id) return { profile: user, courses: [], applications: [], documents: [] };
    const [profile, courses, applications, documents] = await Promise.all([
      userService.getCurrentUser().catch(() => user),
      courseService.list().catch(() => []),
      applicationService.listMine().catch(() => []),
      userService.getDocuments(user.id).catch(() => []),
    ]);

    return {
      profile,
      courses: Array.isArray(courses) ? courses : [],
      applications: Array.isArray(applications) ? applications.map(mapApplication) : [],
      documents: Array.isArray(documents) ? documents : [],
    };
  }, [user?.id], { initialData: { profile: user, courses: [], applications: [], documents: [] } });

  const buildFormFromProfile = (profile) => ({
    nome: profile.nome ?? "",
    email: profile.email ?? "",
    cursoId: profile.cursoId ? String(profile.cursoId) : "",
    instituicao: profile.instituicao ?? "",
    semestre: profile.semestre ?? "",
    bio: profile.bio ?? "",
    tema: profile.tema ?? "sistema",
  });

  const [editing, setEditing] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const avatarInputRef = useRef(null);
  const { upload: uploadAvatar, uploading: uploadingAvatar } = useUploadDocumento();
  const [form, setForm] = useState(() => buildFormFromProfile(data?.profile ?? {}));

  useEffect(() => {
    if (data?.profile) {
      setForm(buildFormFromProfile(data.profile));
      const savedTema = data.profile.tema;
      if (savedTema === "escuro" || savedTema === "claro") {
        setTheme(savedTema);
      } else if (savedTema === "sistema") {
        const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
      }
    }
  }, [data]);

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
      await userService.updatePreferencias({
        notificacoesAtivas: data?.profile?.notificacoesAtivas ?? true,
        tema: form.tema || "sistema",
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

  const applications = useMemo(
    () => Array.isArray(data?.applications) ? data.applications : [],
    [data?.applications],
  );
  const approvedApps = useMemo(
    () => applications.filter((item) => item.status === "APROVADO").length,
    [applications],
  );

  if (loading) return <ProfileSkeleton />;

  if (error || !data?.profile) {
    return <StatusView title="Falha ao carregar perfil" description={error?.message || "Perfil indisponível."} />;
  }

  const profile = data.profile;
  const isAluno = profile.tipo === "ALUNO";
  const courseOptions = Array.isArray(data?.courses) ? data.courses : [];
  const documents = Array.isArray(data?.documents) ? data.documents : [];

  return (
    <div className="pagina-perfil">
      <div className="pagina-perfil__grade">
        <div className="cartao-perfil">
          <div className="cartao-perfil__capa" />
          <div className="cartao-perfil__corpo">
            <div className="cartao-perfil__avatar-wrapper">
              <div className="cartao-perfil__avatar">
                {profile.fotoPerfilUrl ? (
                  <img
                    src={profile.fotoPerfilUrl}
                    alt={profile.nome ?? "Foto de perfil"}
                    className="cartao-perfil__avatar-img"
                  />
                ) : (
                  <span className="cartao-perfil__avatar-inicial">
                    {(profile.nome ?? "IC").split(" ").slice(0, 2).map((part) => part[0]).join("")}
                  </span>
                )}
              </div>
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
                    className="cartao-perfil__botao-avatar"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? <div className="secao-perfil__spinner" /> : <Edit3 size={12} />}
                  </button>
                </>
              )}
            </div>

            <h2 className="cartao-perfil__nome">{profile.nome}</h2>
            <p className="cartao-perfil__tipo">{formatUserType(profile.tipo)}</p>
            <p className="cartao-perfil__instituicao">{profile.instituicao ?? "Instituição não informada"}</p>

            <div className="cartao-perfil__info-lista">
              {[
                { icon: Mail, label: profile.email },
                { icon: BookOpen, label: profile.cursoNome ?? "Curso não informado" },
                { icon: Building2, label: profile.instituicao ?? "Instituição não informada" },
                { icon: GraduationCap, label: profile.semestre ?? "Semestre não informado" },
                { icon: Calendar, label: "Conta autenticada via API" },
              ].map((item) => (
                <div key={item.label} className="cartao-perfil__info-item">
                  <item.icon size={14} className="cartao-perfil__info-icone" />
                  <span className="cartao-perfil__info-texto">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pagina-perfil__conteudo-principal">
          <div className="secao-perfil">
            <div className="secao-perfil__cabecalho">
              <h3 className="secao-perfil__titulo">Informações do perfil</h3>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="secao-perfil__botao-editar">
                  <Edit3 size={14} />
                  Editar perfil
                </button>
              ) : (
                <div className="secao-perfil__acoes-edicao">
                  <button onClick={() => { setForm(buildFormFromProfile(data.profile)); setEditing(false); }} className="secao-perfil__botao-cancelar">
                    <X size={14} /> Cancelar
                  </button>
                  <button onClick={handleSave} disabled={loadingSave} className="secao-perfil__botao-salvar">
                    {loadingSave ? <div className="secao-perfil__spinner" /> : <Save size={14} />}
                    Salvar
                  </button>
                </div>
              )}
            </div>

            <div className="secao-perfil__grade-campos">
              {[
                { label: "Nome completo", value: form.nome, icon: User, field: "nome" },
                { label: "E-mail", value: form.email, icon: Mail, field: "email" },
                { label: "Curso", value: form.cursoId, icon: BookOpen, field: "cursoId" },
                { label: "Instituição", value: form.instituicao, icon: Building2, field: "instituicao" },
                { label: "Semestre", value: form.semestre, icon: GraduationCap, field: "semestre" },
                { label: "Tema visual", value: form.tema, icon: Calendar, field: "tema" },
                { label: "Tipo", value: formatUserType(profile.tipo), icon: User, field: null },
              ].map((field) => (
                <div key={field.label}>
                  <label className="campo-perfil__label">{field.label}</label>
                  <div className="campo-perfil__wrapper">
                    <field.icon size={14} className="campo-perfil__icone" />
                    {field.field === "cursoId" ? (
                      <select
                        value={form.cursoId}
                        disabled={!editing}
                        onChange={(e) => setForm((prev) => ({ ...prev, cursoId: e.target.value }))}
                        className={`campo-perfil__input ${editing ? "campo-perfil__input--editando" : "campo-perfil__input--leitura"}`}
                      >
                        <option value="">Selecione o curso</option>
                        {courseOptions.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.nome}
                          </option>
                        ))}
                      </select>
                    ) : field.field === "tema" ? (
                      <select
                        value={form.tema}
                        disabled={!editing}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm((prev) => ({ ...prev, tema: value }));
                          if (value === "escuro" || value === "claro") {
                            setTheme(value);
                          } else {
                            const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
                            setTheme(prefersDark ? "dark" : "light");
                          }
                        }}
                        className={`campo-perfil__input ${editing ? "campo-perfil__input--editando" : "campo-perfil__input--leitura"}`}
                      >
                        <option value="sistema">Sistema</option>
                        <option value="claro">Claro</option>
                        <option value="escuro">Escuro</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={field.value}
                        disabled={!editing || !field.field}
                        onChange={(e) => field.field && setForm((prev) => ({ ...prev, [field.field]: e.target.value }))}
                        className={`campo-perfil__input ${editing && field.field ? "campo-perfil__input--editando" : "campo-perfil__input--leitura"}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "var(--espaco-4)" }}>
              <label className="campo-perfil__label">Biografia</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                disabled={!editing}
                rows={3}
                className={`campo-perfil__bio ${editing ? "campo-perfil__bio--editando" : "campo-perfil__bio--leitura"}`}
              />
            </div>
          </div>
        </div>

        {isAluno && (
          <div className="secao-perfil">
            <ProfileDocuments
              userId={user.id}
              documents={documents}
              editable
              onUploaded={reload}
            />
          </div>
        )}

        {isAluno && (
          <div className="secao-perfil">
            <h3 className="secao-perfil__titulo">Histórico acadêmico</h3>
            <div className="historico-academico__lista">
              {applications.length === 0 ? (
                <StatusView title="Sem histórico" description="Suas inscrições e aprovações aparecerão aqui." />
              ) : (
                applications.map((application) => (
                  <div key={application.id} className="historico-item">
                    <div className="historico-item__icone-area">
                      <Award size={18} style={{ color: "var(--cor-primaria)" }} />
                    </div>
                    <div className="historico-item__info">
                      <p className="historico-item__titulo">{application.project?.title ?? "Projeto"}</p>
                      <p className="historico-item__meta">
                        {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString("pt-BR") : "-"} · {application.project?.area ?? "Área não informada"}
                      </p>
                    </div>
                    <span className="historico-item__etiqueta historico-item__etiqueta--aprovado">
                      {formatApplicationStatus(application.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
