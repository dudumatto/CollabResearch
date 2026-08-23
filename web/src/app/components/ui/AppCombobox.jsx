import { useEffect, useRef, useState } from "react";
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
  const buttonRef = useRef(null);
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

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (buttonRef.current?.contains(target) || target.closest?.(".app-combobox__dropdown")) return;
      setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleEscape, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [open]);

  const handleSelect = ({ key }) => {
    if (key === "__empty" || key === normalizedValue) {
      setOpen(false);
      return;
    }
    onChange?.(key, normalizedOptions.find((option) => option.value === key));
    setOpen(false);
  };

  const toggleMenu = () => {
    if (!isDisabled) setOpen((current) => !current);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <Dropdown
      menu={{ items: menuItems, selectable: true, selectedKeys: normalizedValue ? [normalizedValue] : [], onClick: handleSelect }}
      trigger={[]}
      disabled={isDisabled}
      placement="bottomLeft"
      overlayClassName="app-combobox__dropdown"
      open={open}
    >
      <button
        ref={buttonRef}
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
        onClick={toggleMenu}
        onKeyDown={handleKeyDown}
      >
        <span className="app-combobox__label">{label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
    </Dropdown>
  );
}
