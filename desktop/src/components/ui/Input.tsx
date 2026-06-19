import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }

export function Input({ label, error, id, className = '', ...props }: Props) {
  const fieldId = id || props.name
  return (
    <label className={`field ${className}`} htmlFor={fieldId}>
      {label && <span>{label}</span>}
      <input id={fieldId} className={error ? 'invalid' : ''} {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}
