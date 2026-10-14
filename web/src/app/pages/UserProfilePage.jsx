import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Envelope, BookOpen, Buildings, GraduationCap, Trophy, Calendar, ChatCircleText } from "@phosphor-icons/react";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { userService } from "../services/userService";
import { conversationService } from "../services/conversationService";
import { formatProjectStatus, formatUserType } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import { ProfileDocuments } from "../components/ProfileDocuments";
import { Sk } from "../components/Skeleton";
import { toast } from "sonner";
import "./ProfilePage.css";

function getInitials(name) {
  if (!name) return "IC";
  return name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function getProjectStatusClass(status) {
  const classes = {
    ABERTO: "historico-item__etiqueta--aberto",
    EM_ANDAMENTO: "historico-item__etiqueta--andamento",
    FINALIZADO: "historico-item__etiqueta--finalizado",
    PENDENTE_ORIENTADOR: "historico-item__etiqueta--pendente",
    REJEITADO_ORIENTADOR: "historico-item__etiqueta--rejeitado",
  };

  return classes[status] ?? "historico-item__etiqueta--neutro";
}

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  // Perfil, projetos e documentos carregam de forma independente; o layout
  // estático aparece na hora e só os dados pendentes mostram skeleton.
  const { data: profileData, loading, error } = useAsyncData(() => userService.getProfileById(id), [id]);
  const projectsState = useAsyncData(async () => {
    const projects = await userService.getProjects(id).catch(() => []);
    return Array.isArray(projects) ? projects : projects?.content ?? [];
  }, [id], { initialData: [] });
  const documentsState = useAsyncData(async () => {
    const documents = await userService.getDocuments(id).catch(() => []);
    return Array.isArray(documents) ? documents : [];
  }, [id], { initialData: [] });
  const data = { profile: profileData, documents: documentsState.data };

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [data?.profile?.fotoPerfilUrl]);

  const handleEnviarMensagem = async () => {
    try {
      await conversationService.openPrivate(Number(id));
      navigate("/app/chat");
    } catch {
      toast.error("Erro ao abrir conversa");
    }
  };

  if (!loading && (error || !data?.profile)) {
    return <StatusView title="Usuário não encontrado" description={error?.message || "Perfil indisponível."} />;
  }

  const profile = data.profile ?? {};
  const projects = projectsState.data;
  const showProfilePhoto = Boolean(profile.fotoPerfilUrl) && !avatarLoadFailed;

  return (
    <div className="pagina-perfil">
      <button
        onClick={() => navigate(-1)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--cor-texto-fraco)", fontSize: "var(--tamanho-medio)", marginBottom: "var(--espaco-4)", fontFamily: "var(--fonte-principal)" }}
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="pagina-perfil__grade">
        {/* Card lateral */}
        <div className="cartao-perfil">
          <div className="cartao-perfil__corpo cartao-perfil__corpo--sem-capa">
            <div className="cartao-perfil__avatar-wrapper">
              <div className="cartao-perfil__avatar">
                {loading ? (
                  <Sk r="inherit" w="100%" h="100%" />
                ) : showProfilePhoto ? (
                  <img
                    src={profile.fotoPerfilUrl}
                    alt={profile.nome ?? "Foto de perfil"}
                    onError={() => setAvatarLoadFailed(true)}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                  />
                ) : (
                  <span className="cartao-perfil__avatar-inicial">{getInitials(profile.nome)}</span>
                )}
              </div>
            </div>

            {loading ? (
              <>
                <span className="skeleton perfil-sk-nome" aria-hidden="true" style={{ display: "block", margin: "0 auto 8px" }} />
                <span className="skeleton perfil-sk-tipo" aria-hidden="true" style={{ display: "block", margin: "0 auto 4px" }} />
                <span className="skeleton perfil-sk-inst" aria-hidden="true" style={{ display: "block", margin: "0 auto var(--espaco-4)" }} />
              </>
            ) : (
              <>
                <h2 className="cartao-perfil__nome">{profile.nome}</h2>
                <p className="cartao-perfil__tipo">{formatUserType(profile.tipo)}</p>
                <p className="cartao-perfil__instituicao">{profile.instituicao ?? "Instituição não informada"}</p>
              </>
            )}

            <div className="cartao-perfil__estatisticas">
              {[
                { label: "Projetos", value: projectsState.loading ? <Sk inline w={28} h={20} /> : projects.length },
                { label: "Tipo", value: loading ? <Sk inline w={64} h={20} /> : formatUserType(profile.tipo) },
              ].map((item) => (
                <div key={item.label} className="cartao-perfil__stat">
                  <p className="cartao-perfil__stat-valor">{item.value}</p>
                  <p className="cartao-perfil__stat-label">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="cartao-perfil__info-lista">
              {[
                { icon: Envelope, label: profile.email },
                { icon: BookOpen, label: profile.cursoNome ?? "Curso não informado" },
                { icon: Buildings, label: profile.instituicao ?? "Instituição não informada" },
                { icon: GraduationCap, label: profile.semestre ?? "Semestre não informado" },
                { icon: Calendar, label: `Membro desde ${profile.dataCadastro ? new Date(profile.dataCadastro).toLocaleDateString("pt-BR") : "-"}` },
              ].map((item, index) => (
                <div key={loading ? index : item.label} className="cartao-perfil__info-item">
                  <item.icon size={14} className="cartao-perfil__info-icone" />
                  <span className="cartao-perfil__info-texto">{loading ? <Sk inline w={120 + (index % 3) * 20} h={13} /> : item.label}</span>
                </div>
              ))}
            </div>

            {/* Botão enviar mensagem */}
            <button
              onClick={handleEnviarMensagem}
              style={{
                width: "100%",
                marginTop: "var(--espaco-4)",
                padding: "var(--espaco-3) 0",
                background: "var(--cor-primaria)",
                color: "var(--cor-branco)",
                border: "none",
                borderRadius: "var(--raio-grande)",
                cursor: "pointer",
                fontFamily: "var(--fonte-principal)",
                fontWeight: "var(--peso-semi)",
                fontSize: "var(--tamanho-medio)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--espaco-2)",
              }}
            >
              <ChatCircleText size={15} /> Enviar mensagem
            </button>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="pagina-perfil__conteudo-principal">
          {profile.bio && (
            <div className="secao-perfil">
              <h3 className="secao-perfil__titulo">Sobre</h3>
              <p style={{ color: "var(--cor-texto-medio)", fontSize: "var(--tamanho-medio)", lineHeight: 1.7 }}>
                {profile.bio}
              </p>
            </div>
          )}

          {profile.tipo === "ALUNO" && (
            <div className="secao-perfil">
              <ProfileDocuments userId={id} documents={data.documents} loading={documentsState.loading} editable={false} />
            </div>
          )}

          <div className="secao-perfil">
            <h3 className="secao-perfil__titulo">Projetos</h3>
            {projectsState.loading ? (
              <div className="historico-academico__lista" aria-busy="true" aria-label="Carregando projetos">
                {[0, 1, 2].map((i) => <span key={i} className="skeleton perfil-sk-projeto" aria-hidden="true" style={{ display: "block" }} />)}
              </div>
            ) : projects.length === 0 ? (
              <p style={{ color: "var(--cor-texto-mudo)", fontSize: "var(--tamanho-medio)" }}>
                Nenhum projeto encontrado.
              </p>
            ) : (
              <div className="historico-academico__lista">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="historico-item"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/app/projects/${p.id}`)}
                  >
                    <div className="historico-item__icone-area">
                      <Trophy size={18} style={{ color: "var(--cor-primaria)" }} />
                    </div>
                    <div className="historico-item__info">
                      <p className="historico-item__titulo">{p.titulo ?? p.title ?? "Projeto"}</p>
                      <p className="historico-item__meta">{p.area ?? "-"}</p>
                    </div>
                    <span className={`historico-item__etiqueta ${getProjectStatusClass(p.status)}`}>
                      {formatProjectStatus(p.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
