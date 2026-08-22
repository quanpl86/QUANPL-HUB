import React from 'react';

export function AdminPageHeader({
  eyebrow,
  title,
  accent,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div>
        <span className="admin-kicker">{eyebrow}</span>
        <h1 className="admin-page-title">
          {title}{accent ? <> <span>{accent}</span></> : null}
        </h1>
        <p className="admin-page-subtitle">{description}</p>
      </div>
      {actions ? <div className="admin-page-actions">{actions}</div> : null}
    </header>
  );
}

export function AdminPanel({
  title,
  description,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-panel ${className}`}>
      {title || description ? (
        <div className="admin-panel-header">
          {title ? <h2>{title}</h2> : null}
          {description ? <p>{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
