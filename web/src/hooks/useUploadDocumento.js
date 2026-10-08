import { useState } from "react";
import { api } from "../app/services/api";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt"];

function validateFile(file) {
  if (!file) throw new Error("Selecione um arquivo para enviar.");

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error("Tipo de arquivo não suportado. Use PDF, DOC, DOCX ou TXT.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Arquivo muito grande. O limite é 5 MB.");
  }
}

export function useUploadDocumento() {
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState(null);
  const [progresso, setProgresso] = useState(0);

  const upload = async (file, { usuarioId, tipo }) => {
    setUploading(true);
    setErro(null);
    setProgresso(0);
    let progressInterval = null;

    try {
      validateFile(file);
      if (!usuarioId || !tipo) {
        throw new Error("Usuário e tipo do documento são obrigatórios.");
      }

      const formData = new FormData();
      formData.append("tipo", String(tipo).toUpperCase());
      formData.append("arquivo", file);
      progressInterval = setInterval(() => {
        setProgresso((prev) => (prev < 90 ? prev + 10 : prev));
      }, 200);

      const documento = await api.post(`/api/documentos/usuario/${usuarioId}/upload`, formData);
      setProgresso(100);
      return documento?.data ?? documento;
    } catch (err) {
      setErro(err.message || "Não foi possível enviar o documento.");
      setProgresso(0);
      throw err;
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setUploading(false);
    }
  };

  return { upload, uploading, erro, progresso };
}
