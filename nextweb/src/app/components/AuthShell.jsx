"use client";

import Link from "next/link";
import clsx from "clsx";
import { FlaskConical, Sparkles } from "lucide-react";
import { Badge, Card } from "./ui";

export default function AuthShell({
  className,
  eyebrow = "CollabResearch",
  title,
  description,
  sideTitle,
  sideDescription,
  sideItems = [],
  children,
  footer,
  wide = false,
}) {
  return (
    <main className={clsx("auth-shell tema-fixo-claro", wide && "auth-shell--wide", className)}>
      <div className="auth-shell__halo auth-shell__halo--one" aria-hidden="true" />
      <div className="auth-shell__halo auth-shell__halo--two" aria-hidden="true" />

      <div className="auth-shell__frame">
        <aside className="auth-shell__visual" aria-label="Resumo da plataforma">
          <Link href="/" className="auth-shell__brand" aria-label="Ir para a pagina inicial">
            <span className="auth-shell__brand-mark" aria-hidden="true">
              <FlaskConical size={22} />
            </span>
            <span>CollabResearch</span>
          </Link>

          <div className="auth-shell__visual-copy">
            <Badge tone="brand" size="md" icon={<Sparkles size={13} />}>
              {eyebrow}
            </Badge>
            <h2>{sideTitle}</h2>
            <p>{sideDescription}</p>
          </div>

          <div className="auth-shell__bento" aria-hidden="true">
            {sideItems.map((item, index) => (
              <div className={clsx("auth-shell__bento-item", index === 0 && "auth-shell__bento-item--wide")} key={`${item.title}-${index}`}>
                {item.icon ? <span className="auth-shell__bento-icon">{item.icon}</span> : null}
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="auth-shell__content" aria-label="Formulario de autenticacao">
          <Link href="/" className="auth-shell__brand auth-shell__brand--mobile" aria-label="Ir para a pagina inicial">
            <span className="auth-shell__brand-mark" aria-hidden="true">
              <FlaskConical size={21} />
            </span>
            <span>CollabResearch</span>
          </Link>

          <Card variant="subtle" padding="none" className="auth-shell__card">
            <header className="auth-shell__header">
              <Badge tone="neutral" size="sm">{eyebrow}</Badge>
              <h1>{title}</h1>
              {description ? <p>{description}</p> : null}
            </header>
            {children}
          </Card>

          {footer ? <div className="auth-shell__footer">{footer}</div> : null}
        </section>
      </div>
    </main>
  );
}
