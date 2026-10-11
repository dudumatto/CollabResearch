import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Plus, X } from "@phosphor-icons/react";

export const MARCO_FORM_ID = "marco-form";

export function MarcoForm({ defaultValues, comTarefas = false, onSubmit }) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "tarefas" });
  const semData = useWatch({ control, name: "semData" });

  const inputClass = (erro) => `advisor-campo__input ${erro ? "advisor-campo__input--erro" : ""}`;

  return (
    <form id={MARCO_FORM_ID} className="advisor-modal__corpo" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="advisor-campo">
        <label className="advisor-campo__rotulo" htmlFor="marco-titulo">Título *</label>
        <input
          id="marco-titulo"
          type="text"
          autoFocus
          maxLength={120}
          className={inputClass(errors.titulo)}
          aria-invalid={Boolean(errors.titulo)}
          placeholder="Ex.: Revisão bibliográfica"
          {...register("titulo", { validate: (v) => v.trim() !== "" || "Informe o título do marco." })}
        />
        {errors.titulo && <span className="advisor-campo__erro" role="alert">{errors.titulo.message}</span>}
      </div>

      <div className="advisor-campo">
        <label className="advisor-campo__rotulo" htmlFor="marco-descricao">Descrição</label>
        <textarea
          id="marco-descricao"
          rows={3}
          className="advisor-campo__input"
          placeholder="Descreva o objetivo e a entrega esperada deste marco..."
          {...register("descricao")}
        />
      </div>

      <div className="advisor-campo">
        <label className="advisor-campo__rotulo" htmlFor="marco-prazo">Prazo</label>
        <input
          id="marco-prazo"
          type="date"
          disabled={semData}
          className={inputClass(errors.prazo)}
          aria-invalid={Boolean(errors.prazo)}
          {...register("prazo", { validate: (v) => semData || Boolean(v) || "Informe o prazo do marco." })}
        />
        {errors.prazo && <span className="advisor-campo__erro" role="alert">{errors.prazo.message}</span>}
        <label className="advisor-checkbox advisor-checkbox--campo" htmlFor="marco-sem-data">
          <input
            id="marco-sem-data"
            type="checkbox"
            {...register("semData", {
              onChange: (e) => { if (e.target.checked) setValue("prazo", "", { shouldValidate: true }); },
            })}
          />
          <span>Este marco não precisa de um prazo específico agora</span>
        </label>
      </div>

      {comTarefas && (
        <div className="advisor-campo">
          <span className="advisor-campo__rotulo">Tarefas iniciais (opcional)</span>
          {fields.map((field, index) => (
            <div key={field.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                className="advisor-campo__input"
                aria-label={`Tarefa ${index + 1}`}
                placeholder={index === 0 ? "Ex.: Ler 10 artigos-base" : "Nova tarefa"}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  append({ titulo: "" });
                }}
                {...register(`tarefas.${index}.titulo`)}
              />
              <button
                type="button"
                className="advisor-botao advisor-botao--secundario"
                aria-label={`Remover tarefa ${index + 1}`}
                onClick={() => remove(index)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <div>
            <button type="button" className="advisor-botao advisor-botao--secundario" onClick={() => append({ titulo: "" })}>
              <Plus size={14} /> Adicionar tarefa
            </button>
          </div>
          <span className="advisor-campo__contador">Você poderá marcar tarefas como obrigatórias depois, no marco.</span>
        </div>
      )}

      <label className="advisor-checkbox">
        <input type="checkbox" {...register("obrigatoria")} />
        Marco obrigatório para finalizar o projeto
      </label>
    </form>
  );
}
