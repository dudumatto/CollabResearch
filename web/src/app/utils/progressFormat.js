// Textos de progresso por marcos. Só formata números já calculados pelo backend.

/** "3 de 4 itens concluídos" / "1 de 1 item concluído" / "Sem itens". */
export function formatItensConcluidos(concluidos, total) {
  const feitos = Number(concluidos ?? 0);
  const todos = Number(total ?? 0);
  if (todos <= 0) return "Sem itens";
  return `${feitos} de ${todos} ${todos === 1 ? "item concluído" : "itens concluídos"}`;
}

/** "75%" a partir do percentual inteiro enviado pelo backend. */
export function formatPercentual(percentual) {
  return `${Math.round(Number(percentual ?? 0))}%`;
}
