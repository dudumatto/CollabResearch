import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { advisorService } from "../services/advisorService";
import { normalizeError, getErrorMessage } from "../utils/apiError";
import { LumenLoadingModal } from "../components/LumenLoadingModal";

const LumenAnalysisContext = createContext(null);

// Vive no layout: a análise segue rodando (e avisa ao terminar) mesmo que o orientador troque de tela.
export function LumenAnalysisProvider({ children }) {
  const navigate = useNavigate();
  const mounted = useRef(true);
  const rodandoRef = useRef(false);
  const [rodando, setRodando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [conclusao, setConclusao] = useState(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const iniciar = useCallback(async (projetoId, ids = []) => {
    if (!projetoId || rodandoRef.current) return;
    rodandoRef.current = true;
    setRodando(true);
    setModalAberto(true);
    try {
      const resultado = await advisorService.ranquearComLumen(projetoId, ids);
      if (!mounted.current) return; // logout durante a análise: sem aviso
      const ranking = resultado?.ranking ?? [];
      if (ranking.length === 0) {
        toast.info(resultado?.aviso || "A Lumen não retornou sugestões.");
        return;
      }
      const foco = ids.length === 1 ? ids[0] : null;
      setConclusao({ ranking, projetoId, foco });
      toast.success("Sua avaliação terminou. Venha conferir os resultados.", {
        duration: Infinity,
        closeButton: true,
        action: {
          label: "Ver resultados",
          onClick: () => navigate("/app/applications", { state: { lumenResultados: { projetoId, foco } } }),
        },
      });
    } catch (err) {
      if (mounted.current) {
        toast.error(getErrorMessage(normalizeError(err), "Não foi possível analisar com a Lumen."));
      }
    } finally {
      rodandoRef.current = false;
      if (mounted.current) {
        setRodando(false);
        setModalAberto(false);
      }
    }
  }, [navigate]);

  const value = useMemo(() => ({ rodando, conclusao, iniciar }), [rodando, conclusao, iniciar]);

  return (
    <LumenAnalysisContext.Provider value={value}>
      {children}
      <LumenLoadingModal
        open={rodando && modalAberto}
        onClose={() => setModalAberto(false)}
        message="O Lumen está analisando as candidaturas. Você será avisado quando o processo for concluído."
      />
    </LumenAnalysisContext.Provider>
  );
}

export function useLumenAnalysis() {
  const context = useContext(LumenAnalysisContext);
  if (!context) {
    throw new Error("useLumenAnalysis deve ser usado dentro de LumenAnalysisProvider.");
  }
  return context;
}
