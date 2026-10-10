import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkle, Warning, X, ArrowRight } from "@phosphor-icons/react";
import "../pages/AdvisorWorkspace.css";

function corPontuacao(pontuacao) {
  if (pontuacao >= 7) return "advisor-etiqueta--verde";
  if (pontuacao >= 4) return "advisor-etiqueta--amarelo";
  return "advisor-etiqueta--vermelho";
}

export function LumenRecommendationsModal({ open, recomendacoes = [], aviso, onClose, onOpenProject }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="advisor-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="lumen-recomendacoes-titulo">
      <div className="advisor-modal advisor-lumen">
        <div className="advisor-modal__cabecalho">
          <div className="advisor-lumen__icone" aria-hidden="true">
            <Sparkle size={22} weight="fill" />
          </div>
          <div className="advisor-modal__cabecalho-conteudo">
            <h3 id="lumen-recomendacoes-titulo" className="advisor-modal__titulo">Projetos recomendados pela Lumen</h3>
            <p className="advisor-lumen__subtitulo">Compatibilidade entre o seu perfil e os projetos abertos</p>
          </div>
          <button type="button" className="advisor-modal__fechar" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="advisor-modal__corpo">
          <ol className="advisor-lumen__lista" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {recomendacoes.map((r, i) => (
              <li key={r.projetoId} className="advisor-lumen__card">
                <div className="advisor-lumen__card-topo">
                  <span className="advisor-lumen__posicao">{i + 1}º</span>
                  <strong className="advisor-lumen__nome" title={r.titulo}>{r.titulo}</strong>
                  <span className={`advisor-etiqueta ${corPontuacao(r.pontuacao)}`}>{r.pontuacao}/10</span>
                </div>
                {r.area && <span className="advisor-lumen__subtitulo">{r.area}</span>}
                <p className="advisor-lumen__texto">{r.justificativa || "Sem justificativa informada."}</p>
                <button
                  type="button"
                  className="advisor-botao advisor-botao--secundario advisor-botao--pequeno"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => onOpenProject(r.projetoId)}
                >
                  Ver projeto <ArrowRight size={14} />
                </button>
              </li>
            ))}
          </ol>
        </div>

        <p className="advisor-lumen__aviso">
          <Warning size={14} weight="fill" />
          {aviso || "Sugestão gerada por IA. Avalie cada projeto antes de se inscrever."}
        </p>

        <div className="advisor-lumen__acoes">
          <button type="button" className="advisor-botao advisor-botao--secundario" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default LumenRecommendationsModal;
