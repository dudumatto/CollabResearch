"use client";

import { forwardRef } from "react";
import clsx from "clsx";

export const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    disabled = false,
    type = "button",
    className,
    children,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={clsx(
        "ui-button",
        `ui-button--${variant}`,
        `ui-button--${size}`,
        fullWidth && "ui-button--full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="ui-button__spinner ui-animate-spin" aria-hidden="true" />
      ) : leftIcon ? (
        <span className="ui-button__icon" aria-hidden="true">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon ? <span className="ui-button__icon" aria-hidden="true">{rightIcon}</span> : null}
    </button>
  );
});
