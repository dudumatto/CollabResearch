/* Skeleton só para dados vindos da API: títulos, ícones e layout estático
   renderizam normalmente. `<span>` (display block por padrão) para poder ficar
   dentro de botões e parágrafos sem gerar HTML inválido. */
export function Sk({ w = "100%", h = 14, r = "0.5rem", inline = false, className = "", style }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      aria-hidden="true"
      style={{
        display: inline ? "inline-block" : "block",
        verticalAlign: inline ? "middle" : undefined,
        width: w,
        height: h,
        borderRadius: r,
        ...style,
      }}
    />
  );
}

/* Linhas empilhadas no lugar de uma lista ainda carregando. */
export function SkLines({ rows = 3, h = 30, gap = "var(--espaco-3)", label = "Carregando" }) {
  return (
    <span role="status" aria-busy="true" aria-label={label} style={{ display: "flex", flexDirection: "column", gap, width: "100%" }}>
      {Array.from({ length: rows }).map((_, i) => <Sk key={i} h={h} />)}
    </span>
  );
}
