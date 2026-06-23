export function validateProjectDates({ dataInicio, dataFim, dataLimiteInscricao }) {
  if (dataInicio && dataFim && dataFim < dataInicio) {
    return "A data de término deve ser igual ou posterior à data de início.";
  }

  if (dataLimiteInscricao && dataFim && dataLimiteInscricao > dataFim) {
    return "O limite de inscrição deve ser igual ou anterior à data de término.";
  }

  return null;
}
