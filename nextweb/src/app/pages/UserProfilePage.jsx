"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, BookOpen, Building2, GraduationCap, Calendar, Award, MessageSquare } from "lucide-react";
import { userService } from "../services/userService";
import { conversationService } from "../services/conversationService";
import { formatUserType, formatProjectStatus } from "../utils/formatters";
import { StatusView } from "../components/StatusView";
import { ProfileDocuments } from "../components/ProfileDocuments";
import { toast } from "sonner";
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
              {[1, 2].map((i) => (
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
            <Sk w={120} h={16} />
            <Sk w="100%" h={72} r="var(--raio-medio)" style={{ marginTop: 12 }} />
          </div>
          <div className="secao-perfil">
            <Sk w={100} h={16} />
            <Sk w="100%" h={48} r="var(--raio-medio)" style={{ marginTop: 12 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ profile: null, projects: [], documents: [] });
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      userService.getProfileById(id),
      userService.getProjects(id).catch(() => []),
      userService.getDocuments(id).catch(() => []),
    ])
      .then(([profile, projects, documents]) => {
        if (cancelled) return;
        setData({
          profile,
          projects: Array.isArray(projects) ? projects : projects?.content ?? [],
          documents: Array.isArray(documents) ? documents : [],
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  const handleEnviarMensagem = async () => {
    if (sendingMessage) return;
    setSendingMessage(true);
    try {
      const result = await conversationService.openPrivate(Number(id));
      const conversationId = result?.id ?? result?.conversationId;
      if (conversationId) {
        router.push(`/app/chat?conversationId=${conversationId}`);
      } else {
        router.push("/app/chat");
      }
    } catch {
      toast.error("Erro ao abrir conversa");
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  if (error || !data.profile) {
    return <StatusView title="Usuário não encontrado" description={error?.message || "Perfil indisponível."} />;
  }

  const { profile, projects, documents } = data;

  return (
    <div className="pagina-perfil">
      <button
        onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--cor-texto-fraco)", fontSize: "var(--tamanho-medio)", marginBottom: "var(--espaco-4)", fontFamily: "var(--fonte-principal)" }}
      >
        <ArrowLeft size={16} /> Voltar
      </button>

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

            <button
              onClick={handleEnviarMensagem}
              disabled={sendingMessage}
              style={{
                width: "100%",
                marginTop: "var(--espaco-4)",
                padding: "var(--espaco-3) 0",
                background: "var(--cor-primaria)",
                color: "var(--cor-branco)",
                border: "none",
                borderRadius: "var(--raio-grande)",
                cursor: sendingMessage ? "not-allowed" : "pointer",
                fontFamily: "var(--fonte-principal)",
                fontWeight: "var(--peso-semi)",
                fontSize: "var(--tamanho-medio)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--espaco-2)",
                opacity: sendingMessage ? 0.6 : 1,
              }}
            >
              <MessageSquare size={15} /> {sendingMessage ? "Abrindo..." : "Enviar mensagem"}
            </button>
          </div>
        </div>

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
              <ProfileDocuments userId={id} documents={documents} editable={false} />
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
                    onClick={() => router.push(`/app/projects/${p.id}`)}
                  >
                    <div className="historico-item__icone-area">
                      <Award size={18} style={{ color: "var(--cor-primaria)" }} />
                    </div>
                    <div className="historico-item__info">
                      <p className="historico-item__titulo">{p.titulo ?? p.title ?? "Projeto"}</p>
                      {(p.descricao ?? p.description) && (
                        <p className="historico-item__meta" style={{ marginTop: 2 }}>
                          {(p.descricao ?? p.description).length > 100
                            ? `${(p.descricao ?? p.description).slice(0, 100)}...`
                            : (p.descricao ?? p.description)}
                        </p>
                      )}
                      <p className="historico-item__meta">
                        {p.area ?? "-"}{p.status ? ` · ${formatProjectStatus(p.status)}` : ""}
                      </p>
                    </div>
                    {p.status && (
                      <span className={`historico-item__etiqueta ${
                        p.status === "EM_ANDAMENTO" || p.status === "ABERTO"
                          ? "historico-item__etiqueta--aprovado"
                          : p.status === "PENDENTE_ORIENTADOR"
                            ? "historico-item__etiqueta--pendente"
                            : "historico-item__etiqueta--rejeitado"
                      }`}>
                        {formatProjectStatus(p.status)}
                      </span>
                    )}
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
