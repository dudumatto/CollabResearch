"use client";

import { forwardRef, useId } from "react";
import clsx from "clsx";

export const TextField = forwardRef(function TextField(
  {
    label,
    helperText,
    error,
    leftIcon,
    rightSlot,
    id,
    type = "text",
    required = false,
    disabled = false,
    className,
    inputClassName,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorText = typeof error === "string" ? error : "";
  const message = errorText || helperText;
  const messageId = message ? `${inputId}-message` : undefined;
  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(error);

  return (
    <div className={clsx("ui-text-field", invalid && "ui-text-field--invalid", className)}>
      {label ? (
        <div className="ui-text-field__label-row">
          <label className="ui-text-field__label" htmlFor={inputId}>
            {label}
          </label>
        </div>
      ) : null}

      <div className="ui-text-field__control">
        {leftIcon ? <span className="ui-text-field__icon" aria-hidden="true">{leftIcon}</span> : null}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={clsx(
            "ui-text-field__input",
            leftIcon && "ui-text-field__input--with-left-icon",
            rightSlot && "ui-text-field__input--with-right-slot",
            inputClassName,
          )}
          {...props}
        />
        {rightSlot ? <span className="ui-text-field__slot">{rightSlot}</span> : null}
      </div>

      {message ? (
        <p
          id={messageId}
          className={clsx("ui-text-field__message", invalid && "ui-text-field__message--error")}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
});
