export function StatusView({ title, description, action }) {
  return (
    <div style={{ padding: "2rem", background: "var(--cor-branco)", borderRadius: "1.5rem", border: "1px solid var(--cor-borda-suave)" }}>
      <h3 style={{ marginBottom: "0.5rem", fontSize: "1.125rem", fontWeight: 700 }}>{title}</h3>
      <p style={{ marginBottom: action ? "1rem" : 0, color: "var(--cor-texto-medio)" }}>{description}</p>
      {action}
    </div>
  );
}
