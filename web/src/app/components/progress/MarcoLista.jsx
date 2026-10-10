import { useState } from "react";
import { MarcoCard } from "./MarcoCard";

/** Lista de marcos do aluno. Reordenação (arrastar ou botões) só quando não há filtro ativo. */
export function MarcoLista({ marcos, podeReordenar, somenteLeitura, destacadoId, onReordenar, acoes }) {
  const [arrastando, setArrastando] = useState(null);
  const ativo = podeReordenar && marcos.length > 1;

  const entrar = (indice) => {
    if (!ativo || arrastando === null || arrastando === indice) return;
    onReordenar(arrastando, indice);
    setArrastando(indice);
  };

  return (
    <div className="stepper-vertical">
      {marcos.map((marco, indice) => (
        <MarcoCard
          key={marco.id}
          marco={marco}
          indice={indice + 1}
          somenteLeitura={somenteLeitura}
          destacado={String(marco.id) === String(destacadoId)}
          abertoInicial={String(marco.id) === String(destacadoId)}
          acoes={acoes}
          arrastar={{
            ativo,
            arrastando: arrastando === indice,
            primeiro: indice === 0,
            ultimo: indice === marcos.length - 1,
            onDragStart: () => setArrastando(indice),
            onDragEnter: () => entrar(indice),
            onDragOver: (event) => event.preventDefault(),
            onDragEnd: () => setArrastando(null),
            mover: (direcao) => onReordenar(indice, indice + direcao),
          }}
        />
      ))}
    </div>
  );
}
