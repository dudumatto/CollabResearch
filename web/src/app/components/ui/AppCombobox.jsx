import { useState } from "react";
import { Dropdown } from "antd";
import { ChevronDown } from "lucide-react";
import "./AppCombobox.css";

export function AppCombobox({
  ariaLabel,
  className = "",
  disabled = false,
  emptyLabel = "Nenhuma opção",
  id,
  name,
  onChange,
  options = [],
  placeholder = "Selecione",
  value = "",
}) {
  const [open, setOpen] = useState(false);
  const normalizedValue = value == null ? "" : String(value);
  const normalizedOptions = options.map((option) => ({
    ...option,
    value: option.value == null ? "" : String(option.value),
  }));
  const selectedOption = normalizedOptions.find((option) => option.value === normalizedValue);
  const label = selectedOption?.label ?? placeholder;
  const isDisabled = disabled || normalizedOptions.length === 0;
  const menuItems = normalizedOptions.length
    ? normalizedOptions.map((option) => ({
        key: option.value,
        label: option.label,
        disabled: option.disabled,
      }))
    : [{ key: "__empty", label: emptyLabel, disabled: true }];

  const handleSelect = ({ key }) => {
    if (key === "__empty" || key === normalizedValue) {
      setOpen(false);
      return;
    }
    onChange?.(key, normalizedOptions.find((option) => option.value === key));
    setOpen(false);
  };

  return (
    <Dropdown
      menu={{ items: menuItems, selectable: true, selectedKeys: normalizedValue ? [normalizedValue] : [], onClick: handleSelect }}
      trigger={["click"]}
      disabled={isDisabled}
      placement="bottomLeft"
      overlayClassName="app-combobox__dropdown"
      open={open}
      onOpenChange={setOpen}
    >
      <button
        type="button"
        id={id}
        name={name}
        className={`app-combobox ${className}`.trim()}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={isDisabled || undefined}
        disabled={isDisabled}
      >
        <span className="app-combobox__label">{label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
    </Dropdown>
  );
}
