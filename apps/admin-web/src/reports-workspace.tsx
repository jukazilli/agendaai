import { AlertCircle, X } from "lucide-react";
import type { JSX } from "react";

export type ReportsWorkspaceTab =
  | "overview"
  | "services"
  | "team"
  | "retention"
  | "agenda"
  | "week"
  | "month"
  | "operations";

export interface ReportsWorkspaceItem {
  readonly key: ReportsWorkspaceTab;
  readonly label: string;
  readonly group: string;
  readonly description: string;
  readonly badge?: string;
}

export interface ReportsWorkspaceFilter {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly options: ReadonlyArray<{
    readonly value: string;
    readonly label: string;
  }>;
  readonly onChange: (value: string) => void;
}

export interface ReportsWorkspaceAction {
  readonly label: string;
  readonly onClick: () => void;
  readonly active?: boolean;
}

export interface ReportsWorkspaceContextItem {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

export interface ReportsWorkspaceKpi {
  readonly id: string;
  readonly label: string;
  readonly value: string | number;
  readonly helper: string;
}

export interface ReportsWorkspaceMiniCard {
  readonly id: string;
  readonly label: string;
  readonly value: string | number;
}

export interface ReportsWorkspaceMetricRow {
  readonly id: string;
  readonly label: string;
  readonly current: string;
  readonly previous?: string;
}

export interface ReportsWorkspaceFeedEntry {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly value: string;
  readonly meta: string;
}

export interface ReportsWorkspaceTable {
  readonly id: string;
  readonly title?: string;
  readonly description?: string;
  readonly columns: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
  }>;
  readonly rows: ReadonlyArray<{
    readonly id: string;
    readonly cells: ReadonlyArray<string | number>;
  }>;
  readonly emptyMessage: string;
}

export interface ReportsWorkspacePanel {
  readonly id: string;
  readonly title: string;
  readonly caption?: string;
  readonly actions?: ReadonlyArray<ReportsWorkspaceAction>;
  readonly metricRows?: ReadonlyArray<ReportsWorkspaceMetricRow>;
  readonly miniCards?: ReadonlyArray<ReportsWorkspaceMiniCard>;
  readonly feed?: ReadonlyArray<ReportsWorkspaceFeedEntry>;
  readonly emptyMessage?: string;
}

export interface ReportsWorkspacePane {
  readonly title: string;
  readonly description: string;
  readonly actions?: ReadonlyArray<ReportsWorkspaceAction>;
  readonly kpis?: ReadonlyArray<ReportsWorkspaceKpi>;
  readonly panels?: ReadonlyArray<ReportsWorkspacePanel>;
  readonly bucketCards?: ReadonlyArray<ReportsWorkspaceMiniCard>;
  readonly tables?: ReadonlyArray<ReportsWorkspaceTable>;
}

interface ReportsWorkspaceProps {
  readonly filters: ReadonlyArray<ReportsWorkspaceFilter>;
  readonly menuGroups: ReadonlyArray<[string, ReportsWorkspaceItem[]]>;
  readonly openTabs: ReadonlyArray<ReportsWorkspaceTab>;
  readonly activeTab: ReportsWorkspaceTab;
  readonly activeMeta: ReportsWorkspaceItem;
  readonly pane: ReportsWorkspacePane;
  readonly contextItems: ReadonlyArray<ReportsWorkspaceContextItem>;
  readonly isMenuOpen: boolean;
  readonly isContextVisible: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onToggleMenu: () => void;
  readonly onToggleContext: () => void;
  readonly onOpenTab: (tab: ReportsWorkspaceTab) => void;
  readonly onActivateTab: (tab: ReportsWorkspaceTab) => void;
  readonly onCloseTab: (tab: ReportsWorkspaceTab) => void;
}

export function ReportsWorkspace({
  filters,
  menuGroups,
  openTabs,
  activeTab,
  activeMeta,
  pane,
  contextItems,
  isMenuOpen,
  isContextVisible,
  isLoading,
  error,
  onToggleMenu,
  onToggleContext,
  onOpenTab,
  onActivateTab,
  onCloseTab
}: ReportsWorkspaceProps): JSX.Element {
  const tabLabelMap = new Map(menuGroups.flatMap(([, items]) => items.map((item) => [item.key, item.label] as const)));

  return (
    <section className="reports-module-shell">
      <header className="reports-module-topbar">
        <div className="reports-module-heading">
          <span className="eyebrow">Relatorios</span>
          <h1>Relatorios gerenciais</h1>
          <p>Leitura organizada por contexto, sem misturar visao executiva com fila operacional.</p>
        </div>

        <div className="reports-module-toolbar">
          <div className="reports-filter-strip">
            {filters.map((filter) => (
              <label className="reports-filter-box" key={filter.id}>
                <span>{filter.label}</span>
                <select onChange={(event) => filter.onChange(event.target.value)} value={filter.value}>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="reports-toolbar-actions">
            <div className="reports-menu-anchor">
              <button
                className={isMenuOpen ? "dashboard-link-button is-active" : "dashboard-link-button"}
                onClick={onToggleMenu}
                type="button"
              >
                Abrir visao
              </button>

              {isMenuOpen ? (
                <div className="reports-menu-popover">
                  <div className="reports-menu-header">
                    <strong>Relatorios do tenant</strong>
                    <span>Escolha o contexto gerencial que quer abrir.</span>
                  </div>

                  {menuGroups.map(([group, items]) => (
                    <section className="reports-menu-group" key={group}>
                      <span className="reports-menu-group-title">{group}</span>
                      <div className="reports-menu-group-items">
                        {items.map((item) => (
                          <button
                            className="reports-menu-item"
                            key={item.key}
                            onClick={() => onOpenTab(item.key)}
                            type="button"
                          >
                            <div className="reports-menu-item-row">
                              <strong>{item.label}</strong>
                              {item.badge ? <span className="reports-menu-badge">{item.badge}</span> : null}
                            </div>
                            <span>{item.description}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              className={isContextVisible ? "dashboard-link-button is-active" : "dashboard-link-button"}
              onClick={onToggleContext}
              type="button"
            >
              {isContextVisible ? "Ocultar contexto" : "Contexto"}
            </button>
          </div>
        </div>
      </header>

      <div aria-label="Visoes abertas de relatorios" className="reports-module-tabbar" role="tablist">
        {openTabs.map((tab) => (
          <button
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "reports-module-tab is-active" : "reports-module-tab"}
            key={tab}
            onClick={() => onActivateTab(tab)}
            role="tab"
            type="button"
          >
            <span>{tabLabelMap.get(tab) ?? tab}</span>
            {openTabs.length > 1 ? (
              <span
                className="reports-module-tab-close"
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseTab(tab);
                }}
              >
                <X className="w-4 h-4" />
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <section className="reports-window">
        {isLoading ? <div className="feedback-banner is-info">Atualizando leitura dos relatorios...</div> : null}
        {error ? <div className="feedback-banner is-error">{error}</div> : null}
        {isContextVisible ? (
          <div className="reports-context-grid">
            {contextItems.map((item) => (
              <article className="reports-context-card" key={item.id}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        ) : null}

        <div className="reports-window-meta">
          <span className="reports-window-group">{activeMeta.group}</span>
          <div>
            <strong>{activeMeta.label}</strong>
            <p>{activeMeta.description}</p>
          </div>
          {activeMeta.badge ? <span className="reports-menu-badge">{activeMeta.badge}</span> : null}
        </div>

        <div className="reports-pane-stack">
          <div className="reports-pane-header">
            <div>
              <h2>{pane.title}</h2>
              <p>{pane.description}</p>
            </div>
            {pane.actions?.length ? (
              <div className="reports-pane-action">
                {pane.actions.map((action) => (
                  <button
                    className={action.active ? "dashboard-link-button is-active" : "dashboard-link-button"}
                    key={action.label}
                    onClick={action.onClick}
                    type="button"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {pane.kpis?.length ? (
            <div className="reports-kpi-grid">
              {pane.kpis.map((metric) => (
                <article className="reports-kpi-card" key={metric.id}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.helper}</p>
                </article>
              ))}
            </div>
          ) : null}

          {pane.panels?.length ? (
            <div className="reports-two-col">
              {pane.panels.map((panel) => (
                <section className="reports-panel" key={panel.id}>
                  <div className="reports-section-head">
                    <div>
                      <h3>{panel.title}</h3>
                      {panel.caption ? <span>{panel.caption}</span> : null}
                    </div>
                    {panel.actions?.length ? (
                      <div className="entity-record-actions">
                        {panel.actions.map((action) => (
                          <button className="dashboard-link-button" key={action.label} onClick={action.onClick} type="button">
                            {action.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {panel.metricRows?.length ? (
                    <div className="reports-metric-list">
                      {panel.metricRows.map((row) => (
                        <div className="reports-metric-row" key={row.id}>
                          <span>{row.label}</span>
                          <div className="reports-metric-values">
                            <strong>{row.current}</strong>
                            {row.previous ? <small>{row.previous}</small> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {panel.miniCards?.length ? (
                    <div className="reports-mini-grid">
                      {panel.miniCards.map((card) => (
                        <article className="reports-mini-card" key={card.id}>
                          <span>{card.label}</span>
                          <strong>{card.value}</strong>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {panel.feed ? (
                    panel.feed.length ? (
                      <div className="reports-feed-list">
                        {panel.feed.map((item) => (
                          <article className="reports-feed-item" key={item.id}>
                            <div className="reports-feed-main">
                              <strong>{item.title}</strong>
                              <span>{item.subtitle}</span>
                            </div>
                            <div className="reports-feed-meta">
                              <strong>{item.value}</strong>
                              <small>{item.meta}</small>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="reports-empty-panel">
                        <AlertCircle className="w-5 h-5" />
                        <p>{panel.emptyMessage ?? "Nenhum dado disponivel."}</p>
                      </div>
                    )
                  ) : null}
                </section>
              ))}
            </div>
          ) : null}

          {pane.bucketCards?.length ? (
            <div className="reports-bucket-grid">
              {pane.bucketCards.map((bucket) => (
                <article className="reports-bucket-card" key={bucket.id}>
                  <span>{bucket.label}</span>
                  <strong>{bucket.value}</strong>
                </article>
              ))}
            </div>
          ) : null}

          {pane.tables?.map((table) => (
            <div className="reports-table-card" key={table.id}>
              {table.title || table.description ? (
                <div className="reports-section-head">
                  <div>
                    {table.title ? <h3>{table.title}</h3> : null}
                    {table.description ? <span>{table.description}</span> : null}
                  </div>
                </div>
              ) : null}

              {table.rows.length ? (
                <table>
                  <thead>
                    <tr>
                      {table.columns.map((column) => (
                        <th key={column.id}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={row.id}>
                        {row.cells.map((cell, index) => (
                          <td key={`${row.id}-${index}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="reports-empty-panel">
                  <AlertCircle className="w-5 h-5" />
                  <p>{table.emptyMessage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
