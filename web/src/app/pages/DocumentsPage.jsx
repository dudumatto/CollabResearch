import { useMemo, useRef, useState, useEffect } from "react";
import {
  Upload, FileText, CheckCircle, Trash2, Eye,
  FolderOpen, Plus, X, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { api } from "../services/api";
import { documentService } from "../services/documentService";
import { StatusView } from "../components/StatusView";
import { useUploadDocumento } from "../../hooks/useUploadDocumento";
import "./DocumentsPage.css";

const statItems = [
  { key: "total", label: "Total de documentos", icon: FolderOpen, areaClass: "resumo-documentos__icone-area--azul", iconClass: "resumo-documentos__icone--azul" },
  { key: "verified", label: "Verificados", icon: CheckCircle, areaClass: "resumo-documentos__icone-area--verde", iconClass: "resumo-documentos__icone--verde" },
];

function normalizeDocument(doc) {
  return {
    id: doc?.id,
    name: doc?.nomeArquivo ?? doc?.name ?? "Documento",
    type: doc?.tipo ?? doc?.type ?? "CURRICULO",
    uploadedAt: doc?.dataEnvio ?? doc?.uploadedAt ?? null,
    status: doc?.status ?? "ENVIADO",
    url: doc?.url ?? null,
  };
}

function DocumentsSkeleton() {
  const Sk = ({ w = "100%", h = 14, r = "0.5rem" }) => (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-5)", padding: "var(--espaco-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "var(--espaco-4)" }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", border: "1px solid var(--cor-borda-clara)", padding: "var(--espaco-5)", display: "flex", gap: 14, alignItems: "center" }}>
            <Sk w={44} h={44} r="var(--raio-medio)" />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <Sk w={40} h={20} />
              <Sk w={110} h={12} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", border: "2px dashed var(--cor-borda-media)", padding: "var(--espaco-8)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Sk w={48} h={48} r="50%" />
        <Sk w={180} h={16} />
        <Sk w={240} h={13} />
        <Sk w={130} h={36} r="var(--raio-medio)" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-3)" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: "var(--cor-superficie)", borderRadius: "var(--raio-grande)", border: "1px solid var(--cor-borda-clara)", padding: "var(--espaco-4)", display: "flex", alignItems: "center", gap: 14 }}>
            <Sk w={40} h={40} r="var(--raio-medio)" />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
              <Sk w="50%" h={14} />
              <Sk w="35%" h={12} />
            </div>
            <Sk w={72} h={22} r="var(--raio-completo)" />
            <div style={{ display: "flex", gap: 6 }}>
              <Sk w={32} h={32} r="var(--raio-medio)" />
              <Sk w={32} h={32} r="var(--raio-medio)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentViewer({ doc, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState(null);

  const isPdf = doc?.name?.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    if (!doc?.id) return;

    setLoadingPreview(true);
    setPreviewError(null);
    setBlobUrl(null);

    let objectUrl = null;

    api.getBlob(`/api/documentos/${doc.id}/preview`)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        setPreviewError(
          err?.status === 415
            ? "Pré-visualização disponível apenas para arquivos PDF."
            : "Não foi possível carregar o documento."
        );
      })
      .finally(() => setLoadingPreview(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc?.id]);

  return (
    <div className="doc-viewer__overlay" onClick={onClose}>
      <div className="doc-viewer__modal" onClick={(e) => e.stopPropagation()}>

        <div className="doc-viewer__cabecalho">
          <div className="doc-viewer__info">
            <FileText size={16} />
            <span className="doc-viewer__nome">{doc.name}</span>
          </div>
          <button className="doc-viewer__fechar" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="doc-viewer__corpo">
          {loadingPreview && (
            <div className="doc-viewer__estado">
              <div className="doc-viewer__spinner" />
              <span>Carregando documento...</span>
            </div>
          )}

          {!loadingPreview && previewError && (
            <div className="doc-viewer__estado doc-viewer__estado--erro">
              <AlertCircle size={32} />
              <p>{previewError}</p>
              {!isPdf && (
                <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-mudo)", marginTop: 4 }}>
                  Arquivos .doc e .docx não podem ser visualizados no navegador.
                  Use o botão de download para abrir no seu computador.
                </p>
              )}
            </div>
          )}

          {!loadingPreview && blobUrl && (
            <iframe
              src={blobUrl}
              className="doc-viewer__iframe"
              title={doc.name}
            />
          )}
        </div>

        <div className="doc-viewer__rodape">
          <button className="doc-viewer__botao-cancelar" onClick={onClose}>
            Fechar
          </button>
          {blobUrl && (
            <a
              href={blobUrl}
              download={doc.name}
              className="doc-viewer__botao-download"
            >
              Baixar arquivo
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const { upload: uploadDocumentoStorage, uploading: uploadingStorage, erro: storageError, progresso } = useUploadDocumento();
  const [dragging, setDragging] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState("HISTORICO");
  const [docVisualizando, setDocVisualizando] = useState(null);

  const { data, loading, error, reload } = useAsyncData(
    async () => {
      if (!user?.id) return [];
      const response = await documentService.getDocuments(user.id);
      const listaDocumentos = response?.data || response || [];
      if (!Array.isArray(listaDocumentos)) return [];
      return listaDocumentos.map(normalizeDocument);
    },
    [user?.id],
    { initialData: [] },
  );

  const docs = Array.isArray(data) ? data : [];
  const uploading = uploadingStorage || savingMetadata;

  const handleUpload = async (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!user?.id) {
      toast.error("Usuário não autenticado.");
      return;
    }
    setSavingMetadata(false);
    try {
      const uploaded = await uploadDocumentoStorage(file, `usuarios/${user.id}/${tipoDocumento.toLowerCase()}`);
      if (!uploaded?.publicUrl) {
        throw new Error(storageError || "Não foi possível enviar o documento para a nuvem.");
      }

      setSavingMetadata(true);
      await documentService.upload(user.id, tipoDocumento, file.name, uploaded.publicUrl);
      toast.success(`${tipoDocumento === "HISTORICO" ? "Histórico" : "Currículo"} enviado com sucesso.`);
      await reload();
    } catch (uploadError) {
      toast.error(uploadError.message || "Não foi possível enviar o documento.");
    } finally {
      setSavingMetadata(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await documentService.remove(id);
      await reload();
      toast.success("Documento removido.");
    } catch (removeError) {
      toast.error(removeError.message || "Não foi possível remover o documento.");
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    handleUpload(event.dataTransfer.files);
  };

  const statValues = useMemo(
    () => ({
      total: docs.length,
      verified: docs.filter((doc) => doc.status === "VERIFICADO" || doc.status === "ATIVO" || !doc.status).length,
    }),
    [docs],
  );

  if (loading) return <DocumentsSkeleton />;
  if (error) return <StatusView title="Falha ao carregar documentos" description={error.message} />;

  return (
    <div className="pagina-documentos">
      <div className="pagina-documentos__grade-resumos">
        {statItems.map((item) => (
          <div key={item.label} className="resumo-documentos">
            <div className={`resumo-documentos__icone-area ${item.areaClass}`}>
              <item.icon size={18} className={item.iconClass} />
            </div>
            <p className="resumo-documentos__valor">{statValues[item.key]}</p>
            <p className="resumo-documentos__label">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="pagina-documentos__secao-tipo">
        <p className="pagina-documentos__tipo-label">Selecione o que deseja enviar:</p>
        <div className="pagina-documentos__tipo-opcoes">
          <button
            onClick={() => setTipoDocumento("HISTORICO")}
            className={`pagina-documentos__tipo-botao ${tipoDocumento === "HISTORICO" ? "pagina-documentos__tipo-botao--ativo" : ""}`}
          >
            <FileText size={16} />
            Histórico Escolar
          </button>
          <button
            onClick={() => setTipoDocumento("CURRICULO")}
            className={`pagina-documentos__tipo-botao ${tipoDocumento === "CURRICULO" ? "pagina-documentos__tipo-botao--ativo" : ""}`}
          >
            <FileText size={16} />
            Currículo (Lattes/PDF)
          </button>
        </div>
      </div>

      <div
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`pagina-documentos__zona-upload ${dragging ? "pagina-documentos__zona-upload--arrastando" : "pagina-documentos__zona-upload--normal"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={false}
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: "none" }}
          onChange={(event) => handleUpload(event.target.files)}
        />
        {uploading ? (
          <div className="pagina-documentos__progresso-upload">
            <div className="pagina-documentos__upload-icone-animado">
              <Upload size={20} />
            </div>
            <p className="pagina-documentos__upload-label">
              {savingMetadata
                ? "Salvando dados do documento..."
                : `Enviando ${tipoDocumento === "HISTORICO" ? "Histórico" : "Currículo"}... ${progresso}%`}
            </p>
          </div>
        ) : (
          <>
            <div className="pagina-documentos__upload-icone-area">
              <Upload size={22} className={dragging ? "pagina-documentos__upload-icone--arrastando" : "pagina-documentos__upload-icone--normal"} />
            </div>
            <p className="pagina-documentos__upload-titulo">
              {dragging ? "Solte o arquivo aqui" : "Clique ou arraste seu arquivo aqui"}
            </p>
            <p className="pagina-documentos__upload-subtitulo">Formatos aceitos: PDF, JPG, PNG</p>
          </>
        )}
      </div>

      <div className="pagina-documentos__lista">
        <div className="pagina-documentos__cabecalho-lista">
          <h3 className="pagina-documentos__contagem">
            {docs.length} documento{docs.length !== 1 ? "s" : ""}
          </h3>
          <button onClick={() => fileInputRef.current?.click()} className="pagina-documentos__botao-adicionar">
            <Plus size={14} />
            Adicionar
          </button>
        </div>

        {docs.length === 0 ? (
          <div className="pagina-documentos__vazio">
            <div className="pagina-documentos__icone-vazio">
              <FolderOpen size={22} />
            </div>
            <p className="pagina-documentos__texto-vazio">Nenhum documento enviado até o momento</p>
          </div>
        ) : (
          <div className="pagina-documentos__grade-itens">
            {docs.map((doc) => (
              <div key={doc.id} className="documento-item">
                <div className="documento-item__icone-area documento-item__icone-area--pdf">
                  <FileText size={18} className="documento-item__icone--pdf" />
                </div>

                <div className="documento-item__info">
                  <p className="documento-item__nome">{doc.name || "Documento sem nome"}</p>
                  <div className="documento-item__meta">
                    <span className="documento-item__data">
                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("pt-BR") : "-"}
                    </span>
                    <span className={`documento-item__categoria documento-item__categoria--${doc.type?.toLowerCase()}`}>
                      {doc.type === "HISTORICO" ? "Histórico Escolar" : "Currículo"}
                    </span>
                  </div>
                </div>

                <div className={`documento-item__status documento-item__status--${doc.status?.toLowerCase() || "enviado"}`}>
                  <CheckCircle size={12} />
                  {doc.status || "Enviado"}
                </div>

                <div className="documento-item__acoes">
                  <button
                    onClick={() => setDocVisualizando(doc)}
                    className="documento-item__botao-acao"
                    title="Visualizar"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="documento-item__botao-acao documento-item__botao-excluir"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {docVisualizando && (
        <DocumentViewer
          doc={docVisualizando}
          onClose={() => setDocVisualizando(null)}
        />
      )}
    </div>
  );
}
