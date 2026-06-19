import { useForm } from "react-hook-form";

const CATEGORY_OPTIONS = [
  { value: "progress", label: "Progresso" },
  { value: "document", label: "Documento" },
  { value: "meeting", label: "Reunião" },
  { value: "problem", label: "Problema" },
  { value: "milestone", label: "Marco" },
];

export function UpdateForm({ steps = [], onSubmit }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      titulo: "",
      categoria: "progress",
      etapaId: "",
      etapaContribuicao: 0,
      descricao: "",
    },
  });

  const selectedStepId = watch("etapaId");
  const hasStepSelected = Boolean(selectedStepId);

  const submit = async (values) => {
    const payload = {
      titulo: values.titulo.trim(),
      categoria: values.categoria,
      descricao: values.descricao?.trim() || "",
      etapaId: values.etapaId ? Number(values.etapaId) : null,
      etapaContribuicao: values.etapaId ? Number(values.etapaContribuicao ?? 0) : 0,
    };

    await onSubmit?.(payload);
    reset();
  };

  return (
    <form className="update-form" onSubmit={handleSubmit(submit)}>
      <div className="update-form__grid">
        <label className="update-form__field">
          <span>Título</span>
          <input
            type="text"
            placeholder="Ex.: Capítulo 2 escrito"
            {...register("titulo", { required: "Informe um título", maxLength: 120 })}
          />
          {errors.titulo ? <small>{errors.titulo.message}</small> : null}
        </label>

        <label className="update-form__field">
          <span>Categoria</span>
          <select {...register("categoria", { required: true })}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="update-form__field">
          <span>Etapa relacionada</span>
          <select {...register("etapaId")}>
            <option value="">Sem etapa</option>
            {steps.map((step) => (
              <option key={step.id} value={step.id}>
                {step.stepOrder}. {step.title}
              </option>
            ))}
          </select>
        </label>

        {hasStepSelected ? (
          <label className="update-form__field update-form__field--slider">
            <span>Contribuição na etapa</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              {...register("etapaContribuicao", { valueAsNumber: true })}
            />
            <strong>{watch("etapaContribuicao")}%</strong>
          </label>
        ) : null}

        <label className="update-form__field update-form__field--full">
          <span>Descrição</span>
          <textarea
            rows={4}
            placeholder="Conte o que foi avançado nesta atualização"
            {...register("descricao")}
          />
        </label>
      </div>

      <div className="update-form__actions">
        <button type="submit" className="update-form__submit" disabled={isSubmitting}>
          {isSubmitting ? "Publicando..." : "Publicar"}
        </button>
      </div>
    </form>
  );
}
