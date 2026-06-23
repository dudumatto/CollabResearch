import clsx from "clsx";

export function Card({
  variant = "default",
  padding = "md",
  interactive = false,
  className,
  children,
  ...props
}) {
  return (
    <div
      className={clsx(
        "ui-card",
        `ui-card--${variant}`,
        `ui-card--padding-${padding}`,
        interactive && "ui-card--interactive",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
