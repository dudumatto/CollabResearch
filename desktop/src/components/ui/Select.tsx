import type { SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: Array<{ label: string; value: string }> }

export function Select({ label, options, id, className = '', ...props }: Props) {
  const fieldId = id || props.name
  return (
    <label className={`field ${className}`} htmlFor={fieldId}>
      {label && <span>{label}</span>}
      <select id={fieldId} {...props}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}
