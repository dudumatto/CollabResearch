import { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Mail, BookOpen, Building2, GraduationCap, Award, Calendar, MessageSquare } from "lucide-react";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { userService } from "../services/userService";
import { conversationService } from "../services/conversationService";
import { formatUserType } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import { ProfileDocuments } from "../components/ProfileDocuments";
import { toast } from "sonner";
import "./ProfilePage.css";

function getInitials(name) {
  if (!name) return "IC";
  return name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, loading, error } = useAsyncData(async () => {
    const [profile, projects, documents] = await Promise.all([
      userService.getProfileById(id),
      userService.getProjects(id).catch(() => []),
      userService.getDocuments(id).catch(() => []),
    ]);
    return {
      profile,
      projects: Array.isArray(projects) ? projects : projects?.content ?? [],
      documents: Array.isArray(documents) ? documents : [],
    };
  }, [id], { initialData: { profile: null, projects: [], documents: [] } });

  const handleEnviarMensagem = async () => {
    try {
      await conversationService.openPrivate(Number(id));
      navigate("/app/chat");
    } catch {
      toast.error("Erro ao abrir conversa");
    }
  };

  if (loading) {
    return (
      <div className="pagina-perfil">
        <div className="pagina-perfil__grade">
          <div className="cartao-perfil">
            <div className="cartao-perfil__capa skeleton" style={{ borderRadius: "var(--raio-grande) var(--raio-grande) 0 0" }} />
            <div className="cartao-perfil__corpo" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div className="skeleton" style={{ width: 80, height: 80, borderRadius: "50%" }} />
              <div className="skeleton" style={{ width: "60%", height: 18 }} />
              <div className="skeleton" style={{ width: "40%", height: 13 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return <StatusView title="Usuário não encontrado" description={error?.message || "Perfil indisponível."} />;
  }

  const { profile, projects } = data;

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
          <div className="cartao-perfil__capa" />
          <div className="cartao-perfil__corpo">
            <div className="cartao-perfil__avatar-wrapper">
              <div className="cartao-perfil__avatar">
                {profile.fotoPerfilUrl ? (
                  <img
                    src={profile.fotoPerfilUrl}
                    alt={profile.nome ?? "Foto de perfil"}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                  />
                ) : (
                  <span className="cartao-perfil__avatar-inicial">{getInitials(profile.nome)}</span>
                )}
              </div>
            </div>

            <h2 className="cartao-perfil__nome">{profile.nome}</h2>
            <p className="cartao-perfil__tipo">{formatUserType(profile.tipo)}</p>
            <p className="cartao-perfil__instituicao">{profile.instituicao ?? "Instituição não informada"}</p>

            <div className="cartao-perfil__estatisticas">
              {[
                { label: "Projetos", value: projects.length },
                { label: "Tipo", value: formatUserType(profile.tipo) },
              ].map((item) => (
                <div key={item.label} className="cartao-perfil__stat">
                  <p className="cartao-perfil__stat-valor">{item.value}</p>
                  <p className="cartao-perfil__stat-label">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="cartao-perfil__info-lista">
              {[
                { icon: Mail, label: profile.email },
                { icon: BookOpen, label: profile.cursoNome ?? "Curso não informado" },
                { icon: Building2, label: profile.instituicao ?? "Instituição não informada" },
                { icon: GraduationCap, label: profile.semestre ?? "Semestre não informado" },
                { icon: Calendar, label: `Membro desde ${profile.dataCadastro ? new Date(profile.dataCadastro).toLocaleDateString("pt-BR") : "-"}` },
              ].map((item) => (
                <div key={item.label} className="cartao-perfil__info-item">
                  <item.icon size={14} className="cartao-perfil__info-icone" />
                  <span className="cartao-perfil__info-texto">{item.label}</span>
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
              <MessageSquare size={15} /> Enviar mensagem
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
              <ProfileDocuments userId={id} documents={data.documents} editable={false} />
            </div>
          )}

          <div className="secao-perfil">
            <h3 className="secao-perfil__titulo">Projetos</h3>
            {projects.length === 0 ? (
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
                      <Award size={18} style={{ color: "var(--cor-primaria)" }} />
                    </div>
                    <div className="historico-item__info">
                      <p className="historico-item__titulo">{p.titulo ?? p.title ?? "Projeto"}</p>
                      <p className="historico-item__meta">{p.area ?? "-"}</p>
                    </div>
                    <span className="historico-item__etiqueta historico-item__etiqueta--aprovado">
                      {p.status ?? ""}
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
