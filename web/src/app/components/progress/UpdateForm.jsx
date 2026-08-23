import { useEffect } from "react";
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
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      titulo: "",
      categoria: "progress",
      dataRegistro: new Date().toISOString().slice(0, 10),
      semData: false,
      etapaId: "",
      descricao: "",
    },
  });

  const selectedStepId = watch("etapaId");
  const semData = watch("semData");

  useEffect(() => {
    if (!semData) return;
    setValue("dataRegistro", "", { shouldDirty: true, shouldValidate: true });
    clearErrors("dataRegistro");
  }, [clearErrors, semData, setValue]);

  const submit = async (values) => {
    const payload = {
      titulo: values.titulo.trim(),
      categoria: values.categoria,
      dataRegistro: values.semData ? null : values.dataRegistro ? `${values.dataRegistro}T00:00:00` : null,
      semData: Boolean(values.semData),
      descricao: values.descricao?.trim() || "",
      etapaId: values.etapaId ? Number(values.etapaId) : null,
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

        <div className="update-form__field">
          <label htmlFor="dataRegistro">
            <span>Data da etapa</span>
          </label>
          <input
            id="dataRegistro"
            type="date"
            disabled={semData}
            {...register("dataRegistro", {
              validate: (value) => semData || Boolean(value) || "Informe a data da etapa",
            })}
          />
          <label className="update-form__checkbox">
            <input type="checkbox" {...register("semData")} />
            <span>Registrar atualização sem data</span>
          </label>
          {errors.dataRegistro ? <small>{errors.dataRegistro.message}</small> : null}
        </div>

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
