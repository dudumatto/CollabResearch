import { useRef, useState } from "react";
import { Eye, FileText, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useUploadDocumento } from "../../hooks/useUploadDocumento";
import { documentService } from "../services/documentService";
import { api } from "../services/api";
import { StatusView } from "./StatusView";

function normalizeDocument(doc) {
  return {
    id: doc?.id,
    name: doc?.nomeArquivo ?? doc?.name ?? "Documento",
    type: doc?.tipo ?? doc?.type ?? "CURRICULO",
    uploadedAt: doc?.dataEnvio ?? doc?.dataUpload ?? doc?.uploadedAt ?? null,
    status: doc?.status ?? "ENVIADO",
  };
}

function formatDocumentType(type) {
  return type === "HISTORICO" ? "Historico escolar" : "Curriculo";
}

export function ProfileDocuments({ userId, documents = [], editable = false, onUploaded }) {
  const fileInputRef = useRef(null);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const { upload, uploading, progresso } = useUploadDocumento();
  const docs = Array.isArray(documents) ? documents.map(normalizeDocument) : [];
  const busy = uploading || savingMetadata;

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    try {
      const uploaded = await upload(file, `usuarios/${userId}/curriculo`);
      if (!uploaded?.publicUrl) {
        throw new Error("Nao foi possivel enviar o curriculo.");
      }

      setSavingMetadata(true);
      await documentService.upload(userId, "CURRICULO", file.name, uploaded.publicUrl);
      toast.success("Curriculo enviado com sucesso.");
      await onUploaded?.();
    } catch (err) {
      toast.error(err.message || "Nao foi possivel enviar o curriculo.");
    } finally {
      setSavingMetadata(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePreview = async (doc) => {
    try {
      const blob = await api.getBlob(`/api/documentos/${doc.id}/preview`);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (err) {
      toast.error(err.message || "Nao foi possivel abrir o documento.");
    }
  };

  const handleRemove = async (doc) => {
    setRemovingId(doc.id);
    try {
      await documentService.remove(doc.id);
      toast.success("Documento removido.");
      await onUploaded?.();
    } catch (err) {
      toast.error(err.message || "Nao foi possivel remover o documento.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="perfil-documentos">
      <div className="perfil-documentos__cabecalho">
        <div>
          <h3 className="secao-perfil__titulo">Curriculo e documentos</h3>
          <p className="perfil-documentos__subtitulo">
            Curriculos ficam disponiveis para usuarios autenticados.
          </p>
        </div>
        {editable && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={handleUpload}
              disabled={busy}
              className="perfil-documentos__input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="perfil-documentos__botao"
            >
              {busy ? <Upload size={14} /> : <Plus size={14} />}
              {busy ? `Enviando ${progresso}%` : "Adicionar curriculo"}
            </button>
          </>
        )}
      </div>

      {docs.length === 0 ? (
        <StatusView title="Nenhum documento" description="Nenhum curriculo foi enviado ate o momento." />
      ) : (
        <div className="perfil-documentos__lista">
          {docs.map((doc) => (
            <div key={doc.id} className="perfil-documentos__item">
              <div className="perfil-documentos__icone">
                <FileText size={17} />
              </div>
              <div className="perfil-documentos__info">
                <p className="perfil-documentos__nome">{doc.name}</p>
                <p className="perfil-documentos__meta">
                  {formatDocumentType(doc.type)}
                  {doc.uploadedAt ? ` · ${new Date(doc.uploadedAt).toLocaleDateString("pt-BR")}` : ""}
                </p>
              </div>
              <span className="perfil-documentos__status">{doc.status}</span>
              <div className="perfil-documentos__acoes">
                <button
                  type="button"
                  onClick={() => handlePreview(doc)}
                  className="perfil-documentos__acao"
                  title="Visualizar documento"
                >
                  <Eye size={15} />
                </button>
                {editable && (
                  <button
                    type="button"
                    onClick={() => handleRemove(doc)}
                    disabled={removingId === doc.id}
                    className="perfil-documentos__acao perfil-documentos__acao--perigo"
                    title="Remover documento"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
