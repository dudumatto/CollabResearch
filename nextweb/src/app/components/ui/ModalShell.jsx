"use client";

import { useId } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { IconButton } from "./IconButton";

export function ModalShell({
  title,
  description,
  onClose,
  footer,
  size = "md",
  className,
  children,
  ...props
}) {
  const titleId = useId();
  const descriptionId = useId();

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className="ui-modal-shell__overlay ui-animate-fade" onMouseDown={handleOverlayMouseDown}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={clsx("ui-modal-shell__panel", `ui-modal-shell--${size}`, "ui-animate-scale", className)}
        {...props}
      >
        <header className="ui-modal-shell__header">
          <div>
            {title ? <h2 id={titleId} className="ui-modal-shell__title">{title}</h2> : null}
            {description ? (
              <p id={descriptionId} className="ui-modal-shell__description">
                {description}
              </p>
            ) : null}
          </div>
          {onClose ? (
            <IconButton aria-label="Fechar modal" title="Fechar modal" size="sm" variant="ghost" onClick={onClose}>
              <X size={16} aria-hidden="true" />
            </IconButton>
          ) : null}
        </header>

        <div className="ui-modal-shell__body">{children}</div>

        {footer ? <footer className="ui-modal-shell__footer">{footer}</footer> : null}
      </section>
    </div>
  );
}
