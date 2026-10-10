import { useCallback, useEffect, useRef, useState } from "react";
import { marcosApi } from "./marcosApi";
import { ordenarMarcos, resumoDeMarcos } from "./marcoUtils";

// Carrega marcos + resumo do projeto e expõe mutações que sempre recarregam
// os números calculados pelo backend (percentuais, status, emRevisao).
export function useMarcos(projectId) {
  const [estado, setEstado] = useState({ projectId, marcos: [], resumo: null, loading: Boolean(projectId), error: null });
  const requisicao = useRef(0);

  const carregar = useCallback(
    async ({ silencioso = false } = {}) => {
      const atual = ++requisicao.current;
      if (!projectId) {
        setEstado({ projectId, marcos: [], resumo: null, loading: false, error: null });
        return;
      }
      if (!silencioso) setEstado((s) => ({ ...s, projectId, loading: true, error: null }));
      try {
        const [lista, resumo] = await Promise.all([
          marcosApi.listMarcos(projectId),
          marcosApi.getProgressSummary(projectId).catch(() => null),
        ]);
        if (atual !== requisicao.current) return;
        const marcos = ordenarMarcos(Array.isArray(lista) ? lista : []);
        setEstado({ projectId, marcos, resumo: resumo ?? resumoDeMarcos(marcos), loading: false, error: null });
      } catch (error) {
        if (atual !== requisicao.current) return;
        setEstado((s) => ({ ...s, loading: false, error: silencioso ? s.error : error }));
      }
    },
    [projectId],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Executa a mutação e recarrega; erros sobem para a tela exibir o toast.
  const executar = useCallback(
    async (mutacao) => {
      try {
        const resultado = await mutacao();
        await carregar({ silencioso: true });
        return resultado;
      } catch (error) {
        await carregar({ silencioso: true });
        throw error;
      }
    },
    [carregar],
  );

  // Marcar/desmarcar atualiza a tela na hora e confirma com o backend em seguida.
  const alternarTarefa = useCallback(
    (marcoId, tarefaId, concluida) => {
      setEstado((s) => ({
        ...s,
        marcos: s.marcos.map((m) =>
          String(m.id) !== String(marcoId)
            ? m
            : {
                ...m,
                tarefas: m.tarefas.map((x) => (String(x.id) === String(tarefaId) ? { ...x, concluida } : x)),
                itensConcluidos: m.itensConcluidos + (concluida ? 1 : -1),
                percentual: m.itensTotal ? Math.round(((m.itensConcluidos + (concluida ? 1 : -1)) / m.itensTotal) * 100) : 0,
              },
        ),
      }));
      return executar(() => marcosApi.toggleTarefa(projectId, marcoId, tarefaId, concluida));
    },
    [executar, projectId],
  );

  const atual = estado.projectId === projectId;
  return {
    marcos: atual ? estado.marcos : [],
    resumo: atual ? estado.resumo : null,
    loading: estado.loading || (!atual && Boolean(projectId)),
    error: atual ? estado.error : null,
    recarregar: carregar,
    executar,
    alternarTarefa,
  };
}
