import { useState } from "react";
import { useUploadDocumento } from "../hooks/useUploadDocumento";

function UploadDocumento({ candidatoId, usuarioId, tipo }) {
  const { upload, uploading, erro, progresso } = useUploadDocumento();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSuccess(false);
    setServerError(null);

    try {
      const ownerId = usuarioId ?? candidatoId;
      if (!ownerId) {
        throw new Error("Usuário não informado para vincular o documento.");
      }

      await upload(file, { usuarioId: ownerId, tipo });

      setSuccess(true);
      event.target.value = "";
    } catch (err) {
      setServerError(err.message || "Não foi possível concluir o envio.");
    }
  };

  const labelMap = {
    curriculo: "Currículo",
    historico: "Histórico Escolar",
  };

  const label = labelMap[tipo] || tipo;

  return (
    <div className="p-6 border rounded-xl shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Upload de {label}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Formatos aceitos: PDF, DOC, DOCX, TXT (Max. 5MB)
          </p>
        </div>

        <div className="relative">
          <label className="sr-only" htmlFor={`documento-${tipo}`}>
            Selecionar arquivo para {label}
          </label>
          <input
            id={`documento-${tipo}`}
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2.5 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-blue-900/30 dark:file:text-blue-400
              cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {uploading && (
          <div className="space-y-2" role="status" aria-live="polite">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Enviando... {progresso}%
            </p>
          </div>
        )}

        {erro && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium" role="alert">
            {erro}
          </div>
        )}

        {serverError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium" role="alert">
            Erro no servidor: {serverError}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium" role="status">
            Documento enviado com sucesso!
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadDocumento;
