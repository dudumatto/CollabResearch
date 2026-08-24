import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const generatedId = useId();
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const listboxId = `${id || generatedId}-listbox`;
  const normalizedValue = value == null ? "" : String(value);
  const normalizedOptions = options.map((option) => ({
    ...option,
    value: option.value == null ? "" : String(option.value),
  }));
  const selectedOption = normalizedOptions.find((option) => option.value === normalizedValue);
  const label = selectedOption?.label ?? placeholder;
  const isDisabled = disabled || normalizedOptions.length === 0;
  const menuItems = normalizedOptions.length
    ? normalizedOptions
    : [{ value: "__empty", label: emptyLabel, disabled: true }];

  const updateDropdownPosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const gap = 6;
    const viewportPadding = 12;
    const maxHeight = Math.min(320, window.innerHeight - viewportPadding * 2);
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const openAbove = spaceBelow < 180 && rect.top > spaceBelow;
    const availableHeight = openAbove
      ? Math.max(120, rect.top - viewportPadding - gap)
      : Math.max(120, spaceBelow - gap);

    setDropdownStyle({
      left: `${Math.max(viewportPadding, rect.left)}px`,
      top: openAbove ? undefined : `${rect.bottom + gap}px`,
      bottom: openAbove ? `${window.innerHeight - rect.top + gap}px` : undefined,
      width: `${rect.width}px`,
      maxHeight: `${Math.min(maxHeight, availableHeight)}px`,
    });
  };

  useEffect(() => {
    if (!open) return undefined;

    updateDropdownPosition();

    const handlePointerDown = (event) => {
      const target = event.target;
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (isDisabled) setOpen(false);
  }, [isDisabled]);

  const handleSelect = (option) => {
    if (option.disabled || option.value === "__empty") return;

    if (option.value !== normalizedValue) {
      onChange?.(option.value, normalizedOptions.find((item) => item.value === option.value));
    }
    setOpen(false);
    buttonRef.current?.focus();
  };

  const toggleMenu = () => {
    if (!isDisabled) setOpen((current) => !current);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isDisabled) setOpen(true);
    }
  };

  const dropdown = open && dropdownStyle
    ? createPortal(
        <div
          ref={dropdownRef}
          className="app-combobox__dropdown"
          style={dropdownStyle}
        >
          <ul id={listboxId} className="app-combobox__listbox" role="listbox" aria-label={ariaLabel}>
            {menuItems.map((option) => {
              const selected = option.value === normalizedValue;
              const optionId = `${listboxId}-${option.value}`;

              return (
                <li
                  key={option.value}
                  id={optionId}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={option.disabled || undefined}
                  className={`app-combobox__option ${selected ? "app-combobox__option--selected" : ""} ${option.disabled ? "app-combobox__option--disabled" : ""}`.trim()}
                  onClick={() => handleSelect(option)}
                >
                  {option.label}
                </li>
              );
            })}
          </ul>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        name={name}
        className={`app-combobox ${open ? "app-combobox--open" : ""} ${className}`.trim()}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-disabled={isDisabled || undefined}
        disabled={isDisabled}
        onClick={toggleMenu}
        onKeyDown={handleKeyDown}
      >
        <span className="app-combobox__label">{label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {dropdown}
    </>
  );
}
