"use client";

import { forwardRef } from "react";
import clsx from "clsx";

export const IconButton = forwardRef(function IconButton(
  {
    variant = "ghost",
    size = "md",
    title,
    disabled = false,
    className,
    children,
    "aria-label": ariaLabel,
    ...props
  },
  ref,
) {
  const accessibleName = ariaLabel || title;

  if (!accessibleName) {
    throw new Error("IconButton requires an aria-label or title.");
  }

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={accessibleName}
      title={title || accessibleName}
      className={clsx(
        "ui-icon-button",
        `ui-icon-button--${variant}`,
        `ui-icon-button--${size}`,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
