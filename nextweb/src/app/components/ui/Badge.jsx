import clsx from "clsx";

export function Badge({ tone = "neutral", size = "md", icon, className, children, ...props }) {
  return (
    <span className={clsx("ui-badge", `ui-badge--${tone}`, `ui-badge--${size}`, className)} {...props}>
      {icon ? <span className="ui-badge__icon" aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}
