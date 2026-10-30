import "./IaIcone.css";

/* Estrela de "recurso com IA" (mesmo desenho do Sparkle do Phosphor, pesos
   "fill" e "regular").
   Em repouso pinta com currentColor, igual ao ícone antigo; no hover/foco/clique
   do botão pai (ou de um contêiner .ia-gatilho) um gradiente Gemini atravessa a
   estrela. Duas camadas: a externa recebe className/estilo de quem usa (ex.:
   animações de pulso dos modais) e a interna carrega a máscara e a varredura,
   então uma animação não sobrescreve a outra. */
export function IaIcone({ size = "1em", weight = "fill", label, className = "", style }) {
  const tamanho = typeof size === "number" ? `${size}px` : size;
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" };

  return (
    <span
      className={`ia-icone${weight === "regular" ? " ia-icone--regular" : ""} ${className}`.trim()}
      style={{ "--ia-tamanho": tamanho, ...style }}
      {...a11y}
    >
      <span className="ia-icone__forma" />
    </span>
  );
}

export default IaIcone;
