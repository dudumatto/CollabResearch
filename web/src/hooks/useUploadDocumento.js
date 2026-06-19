import { useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabase";

const BUCKET_NAME = "documents";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];

function sanitizeFileName(name) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  const baseName = name
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${baseName || "documento"}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

function validateFile(file) {
  if (!file) {
    throw new Error("Selecione um arquivo para enviar.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error("Tipo de arquivo não suportado. Use PDF, JPG ou PNG.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Arquivo muito grande. O limite é 5 MB.");
  }
}

export function useUploadDocumento() {
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState(null);
  const [progresso, setProgresso] = useState(0);

  const upload = async (file, folder = "") => {
    setUploading(true);
    setErro(null);
    setProgresso(0);
    let progressInterval = null;

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error("Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
      }

      validateFile(file);

      const safeFolder = folder
        .split("/")
        .map((part) => part.replace(/[^a-zA-Z0-9-_]/g, ""))
        .filter(Boolean)
        .join("/");
      const fileName = sanitizeFileName(file.name);
      const filePath = safeFolder ? `${safeFolder}/${fileName}` : fileName;

      progressInterval = setInterval(() => {
        setProgresso((prev) => (prev < 90 ? prev + 10 : prev));
      }, 200);

      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error("Não foi possível gerar a URL pública do documento.");
      }

      setProgresso(100);
      return {
        path: data?.path ?? filePath,
        publicUrl: publicUrlData.publicUrl,
      };
    } catch (err) {
      setErro(err.message || "Não foi possível enviar o documento.");
      setProgresso(0);
      return null;
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setUploading(false);
    }
  };

  return { upload, uploading, erro, progresso };
}
