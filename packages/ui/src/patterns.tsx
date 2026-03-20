import type { ReactNode } from "react";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ViewTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface EntityIdentityField {
  readonly id: string;
  readonly label: string;
  readonly value: ReactNode;
  readonly helper?: ReactNode;
}

export interface EntityAsideItem {
  readonly id: string;
  readonly label: string;
  readonly description?: ReactNode;
  readonly value?: ReactNode;
  readonly action?: ReactNode;
  readonly active?: boolean;
}

export interface DocumentField {
  readonly id: string;
  readonly label: string;
  readonly value: ReactNode;
}

export interface DocumentSummaryMetric {
  readonly id: string;
  readonly label: string;
  readonly value: ReactNode;
  readonly helper?: ReactNode;
  readonly tone?: Exclude<ViewTone, "neutral">;
}

export interface DocumentTab {
  readonly id: string;
  readonly label: string;
  readonly active?: boolean;
}

export interface DocumentTimelineEntry {
  readonly id: string;
  readonly title: string;
  readonly description?: ReactNode;
  readonly timestamp?: ReactNode;
  readonly meta?: ReactNode;
}

export interface DocumentImpactSection {
  readonly id: string;
  readonly title: string;
  readonly items: ReactNode[];
  readonly tone?: Exclude<ViewTone, "info"> | "default";
}

function ViewHeader({
  eyebrow,
  title,
  subtitle,
  badges,
  actions
}: {
  readonly eyebrow?: ReactNode;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly badges?: ReactNode;
  readonly actions?: ReactNode;
}) {
  return (
    <header className="ag-view-header">
      <div className="ag-view-header-main">
        {eyebrow ? <p className="ag-view-eyebrow">{eyebrow}</p> : null}
        <h2 className="ag-view-title">{title}</h2>
        {subtitle ? <p className="ag-view-subtitle">{subtitle}</p> : null}
      </div>
      {(badges || actions) ? (
        <div className="ag-view-header-meta">
          {badges ? <div className="ag-view-header-badges">{badges}</div> : null}
          {actions ? <div className="ag-view-header-actions">{actions}</div> : null}
        </div>
      ) : null}
    </header>
  );
}

function ViewPanelHeader({
  title,
  description,
  actions
}: {
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
}) {
  if (!title && !description && !actions) {
    return null;
  }

  return (
    <div className="ag-view-panel-header">
      <div className="ag-view-panel-copy">
        {title ? <h3 className="ag-view-panel-title">{title}</h3> : null}
        {description ? <p className="ag-view-panel-description">{description}</p> : null}
      </div>
      {actions ? <div className="ag-view-panel-actions">{actions}</div> : null}
    </div>
  );
}

function toneClassName(tone?: ViewTone | "default") {
  switch (tone) {
    case "success":
      return "is-success";
    case "warning":
      return "is-warning";
    case "danger":
      return "is-danger";
    case "info":
      return "is-info";
    case "default":
      return "is-default";
    case "neutral":
    default:
      return "is-neutral";
  }
}

export function ViewBadge({
  tone = "neutral",
  children,
  className
}: {
  readonly tone?: ViewTone;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <span className={cx("ag-view-badge", toneClassName(tone), className)}>
      {children}
    </span>
  );
}

export function EntityIdentityCard({
  title = "Identidade",
  description,
  fields,
  className
}: {
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly fields: readonly EntityIdentityField[];
  readonly className?: string;
}) {
  return (
    <section className={cx("ag-surface-card ag-view-panel", className)}>
      <ViewPanelHeader title={title} description={description} />
      <div className="ag-entity-identity-grid">
        {fields.map((field) => (
          <div className="ag-entity-field" key={field.id}>
            <p className="ag-entity-field-label">{field.label}</p>
            <div className="ag-entity-field-value">{field.value}</div>
            {field.helper ? <p className="ag-entity-field-helper">{field.helper}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function EntitySection({
  title,
  description,
  actions,
  children,
  className
}: {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <section className={cx("ag-surface-card ag-view-panel", className)}>
      <ViewPanelHeader title={title} description={description} actions={actions} />
      <div className="ag-view-section-body">{children}</div>
    </section>
  );
}

export function EntityAsideSummary({
  title,
  description,
  items,
  className
}: {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly items: readonly EntityAsideItem[];
  readonly className?: string;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section className={cx("ag-surface-card ag-view-panel", className)}>
      <ViewPanelHeader title={title} description={description} />
      <div className="ag-entity-aside-list">
        {items.map((item) => (
          <div
            className={cx(
              "ag-entity-aside-item",
              item.active && "is-active"
            )}
            key={item.id}
          >
            <div className="ag-entity-aside-copy">
              <div className="ag-entity-aside-row">
                <strong>{item.label}</strong>
                {item.value ? <span>{item.value}</span> : null}
              </div>
              {item.description ? (
                <div className="ag-entity-aside-description">{item.description}</div>
              ) : null}
            </div>
            {item.action ? <div className="ag-entity-aside-action">{item.action}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function EntityViewLayout({
  eyebrow,
  title,
  subtitle,
  statusBadge,
  pageActions,
  identityCard,
  sections,
  aside,
  footerActions,
  className
}: {
  readonly eyebrow?: ReactNode;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly statusBadge?: ReactNode;
  readonly pageActions?: ReactNode;
  readonly identityCard: ReactNode;
  readonly sections: ReactNode;
  readonly aside?: ReactNode;
  readonly footerActions?: ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={cx("ag-view-layout ag-entity-view", className)}>
      <ViewHeader
        actions={pageActions}
        badges={statusBadge}
        eyebrow={eyebrow}
        subtitle={subtitle}
        title={title}
      />
      {identityCard}
      <div className={cx("ag-view-shell", aside ? "has-aside" : undefined)}>
        <div className="ag-view-main">{sections}</div>
        {aside ? <aside className="ag-view-aside">{aside}</aside> : null}
      </div>
      {footerActions ? <div className="ag-view-footer-actions">{footerActions}</div> : null}
    </div>
  );
}

export function DocumentHeader({
  fields,
  className
}: {
  readonly fields: readonly DocumentField[];
  readonly className?: string;
}) {
  return (
    <section className={cx("ag-surface-card ag-view-panel", className)}>
      <div className="ag-document-header-grid">
        {fields.map((field) => (
          <div className="ag-document-field" key={field.id}>
            <p className="ag-entity-field-label">{field.label}</p>
            <div className="ag-entity-field-value">{field.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DocumentSummaryCards({
  metrics,
  className
}: {
  readonly metrics: readonly DocumentSummaryMetric[];
  readonly className?: string;
}) {
  if (!metrics.length) {
    return null;
  }

  return (
    <div className={cx("ag-document-summary-grid", className)}>
      {metrics.map((metric) => (
        <article
          className={cx("ag-surface-card ag-document-summary-card", toneClassName(metric.tone))}
          key={metric.id}
        >
          <span className="ag-document-summary-label">{metric.label}</span>
          <strong className="ag-document-summary-value">{metric.value}</strong>
          {metric.helper ? <p className="ag-document-summary-helper">{metric.helper}</p> : null}
        </article>
      ))}
    </div>
  );
}

export function DocumentTabs({
  tabs,
  className
}: {
  readonly tabs: readonly DocumentTab[];
  readonly className?: string;
}) {
  if (!tabs.length) {
    return null;
  }

  return (
    <div className={cx("ag-document-tab-strip", className)}>
      {tabs.map((tab) => (
        <div
          className={cx("ag-document-tab", tab.active && "is-active")}
          key={tab.id}
        >
          {tab.label}
        </div>
      ))}
    </div>
  );
}

export function DocumentTimeline({
  title = "Timeline",
  entries,
  className
}: {
  readonly title?: ReactNode;
  readonly entries: readonly DocumentTimelineEntry[];
  readonly className?: string;
}) {
  if (!entries.length) {
    return null;
  }

  return (
    <section className={cx("ag-surface-card ag-view-panel", className)}>
      <ViewPanelHeader title={title} />
      <div className="ag-document-timeline">
        {entries.map((entry) => (
          <div className="ag-document-timeline-item" key={entry.id}>
            <span className="ag-document-timeline-dot" />
            <div className="ag-document-timeline-row">
              <div>
                <strong className="ag-document-timeline-title">{entry.title}</strong>
                {entry.description ? (
                  <div className="ag-document-timeline-description">{entry.description}</div>
                ) : null}
              </div>
              {entry.timestamp ? (
                <span className="ag-document-timeline-timestamp">{entry.timestamp}</span>
              ) : null}
            </div>
            {entry.meta ? <div className="ag-document-timeline-meta">{entry.meta}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function DocumentImpactPanel({
  title = "Impactos e observacoes",
  sections,
  className
}: {
  readonly title?: ReactNode;
  readonly sections: readonly DocumentImpactSection[];
  readonly className?: string;
}) {
  if (!sections.length) {
    return null;
  }

  return (
    <section className={cx("ag-surface-card ag-view-panel", className)}>
      <ViewPanelHeader title={title} />
      <div className="ag-document-impact-list">
        {sections.map((section) => (
          <div
            className={cx(
              "ag-document-impact-section",
              toneClassName(section.tone === "default" ? "neutral" : section.tone)
            )}
            key={section.id}
          >
            <strong>{section.title}</strong>
            <ul>
              {section.items.map((item, index) => (
                <li key={`${section.id}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DocumentViewLayout({
  eyebrow,
  title,
  subtitle,
  documentNumber,
  statusBadge,
  pageActions,
  header,
  summary,
  tabs,
  items,
  timeline,
  impactPanel,
  aside,
  className
}: {
  readonly eyebrow?: ReactNode;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly documentNumber?: ReactNode;
  readonly statusBadge?: ReactNode;
  readonly pageActions?: ReactNode;
  readonly header: ReactNode;
  readonly summary?: ReactNode;
  readonly tabs?: ReactNode;
  readonly items: ReactNode;
  readonly timeline?: ReactNode;
  readonly impactPanel?: ReactNode;
  readonly aside?: ReactNode;
  readonly className?: string;
}) {
  const displayTitle =
    documentNumber !== undefined && documentNumber !== null
      ? (
        <>
          {title} <span className="ag-document-number">#{documentNumber}</span>
        </>
      )
      : title;

  return (
    <div className={cx("ag-view-layout ag-document-view", className)}>
      <ViewHeader
        actions={pageActions}
        badges={statusBadge}
        eyebrow={eyebrow}
        subtitle={subtitle}
        title={displayTitle}
      />
      {header}
      {summary}
      {tabs}
      <div className={cx("ag-document-grid", aside ? "has-aside" : undefined)}>
        <div className="ag-view-main">
          {items}
          {timeline}
        </div>
        {(aside || impactPanel) ? (
          <aside className="ag-view-aside">
            {aside}
            {impactPanel}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export function MasterDetailLayout({
  eyebrow,
  title,
  subtitle,
  toolbar,
  masterTitle,
  masterDescription,
  master,
  detailTitle,
  detailDescription,
  detail,
  emptyDetail,
  className,
  masterClassName,
  detailClassName
}: {
  readonly eyebrow?: ReactNode;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly toolbar?: ReactNode;
  readonly masterTitle?: ReactNode;
  readonly masterDescription?: ReactNode;
  readonly master: ReactNode;
  readonly detailTitle?: ReactNode;
  readonly detailDescription?: ReactNode;
  readonly detail?: ReactNode;
  readonly emptyDetail?: ReactNode;
  readonly className?: string;
  readonly masterClassName?: string;
  readonly detailClassName?: string;
}) {
  return (
    <section className={cx("ag-view-layout ag-master-detail", className)}>
      <ViewHeader eyebrow={eyebrow} subtitle={subtitle} title={title} actions={toolbar} />
      <div className="ag-master-detail-grid">
        <section className={cx("ag-surface-card ag-view-panel", masterClassName)}>
          <ViewPanelHeader title={masterTitle} description={masterDescription} />
          <div className="ag-master-detail-body">{master}</div>
        </section>
        <section className={cx("ag-surface-card ag-view-panel", detailClassName)}>
          <ViewPanelHeader title={detailTitle} description={detailDescription} />
          <div className="ag-master-detail-body">
            {detail ?? emptyDetail ?? (
              <p className="ag-master-detail-empty">
                Selecione um registro para abrir o detalhe desta area.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
