import {
  Filter,
  FolderOpen,
  Play,
  Save,
  Search,
  X
} from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState, type JSX, type ReactNode } from "react";

import type {
  ReportBuilderCatalog,
  ReportDefinition,
  ReportExecutionTable,
  ReportExecutionResponse,
  ReportFilterConditionNode,
  ReportFilterNode,
  ReportOperator,
  ReportSortDirection
} from "@agendaai/contracts";

export interface ReportsBuilderMenuItem {
  readonly code: string;
  readonly label: string;
  readonly group: string;
  readonly description: string;
}

export interface ReportsBuilderLookupRow {
  readonly id: string;
  readonly value: string;
  readonly code: string;
  readonly primary: string;
  readonly secondary?: string;
  readonly searchText: string;
}

export interface ReportsBuilderTabState {
  readonly id: string;
  readonly label: string;
  readonly definition: ReportDefinition;
  readonly result: ReportExecutionResponse | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly dirty: boolean;
}

interface ReportsBuilderWorkspaceProps {
  readonly menuGroups: ReadonlyArray<[string, ReportsBuilderMenuItem[]]>;
  readonly openTabs: ReadonlyArray<ReportsBuilderTabState>;
  readonly activeTabId: string;
  readonly catalog: ReportBuilderCatalog | null;
  readonly savedModels: ReadonlyArray<ReportDefinition>;
  readonly lookupRows: {
    readonly service: ReadonlyArray<ReportsBuilderLookupRow>;
    readonly professional: ReadonlyArray<ReportsBuilderLookupRow>;
    readonly client: ReadonlyArray<ReportsBuilderLookupRow>;
  };
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly showMenuButton?: boolean;
  readonly isMenuOpen?: boolean;
  readonly onOpenMenu?: () => void;
  readonly onCloseMenu?: () => void;
  readonly onToggleMenu?: () => void;
  readonly onOpenSystemDefinition: (code: string) => void;
  readonly onOpenSavedDefinition: (definitionId: string) => void;
  readonly onActivateTab: (tabId: string) => void;
  readonly onCloseTab: (tabId: string) => void;
  readonly onUpdateDefinition: (tabId: string, definition: ReportDefinition) => void;
  readonly onExecuteTab: (tabId: string) => void;
  readonly onSaveTab: (tabId: string, name: string, description: string) => void;
}

type LookupKind = "service" | "professional" | "client";

interface LookupState {
  readonly kind: LookupKind;
}

interface FilterEditorState {
  readonly connective: "AND" | "OR";
  readonly field: string;
  readonly operator: ReportOperator;
  readonly valueMode: "value" | "parameter";
  readonly valuePrimary: string;
  readonly valueSecondary: string;
  readonly parameterName: string;
}

interface SortEditorState {
  readonly field: string;
  readonly direction: ReportSortDirection;
  readonly priority: string;
}

const visualizationOptions: ReadonlyArray<ReportDefinition["visualization"]> = [
  "kpi_table",
  "kpi",
  "time_series",
  "ranking"
];

const metricOperationOptions: ReadonlyArray<ReportDefinition["metric"]["operation"]> = [
  "sum",
  "count",
  "count_distinct",
  "avg",
  "max",
  "min"
];

const sortDirectionOptions: ReadonlyArray<ReportSortDirection> = [
  "desc",
  "asc",
  "largest_first",
  "smallest_first",
  "newest_first",
  "oldest_first",
  "az",
  "za"
];

export function ReportsBuilderWorkspace({
  menuGroups,
  openTabs,
  activeTabId,
  catalog,
  savedModels,
  lookupRows,
  isLoading,
  error,
  showMenuButton = false,
  isMenuOpen = false,
  onOpenMenu,
  onCloseMenu,
  onToggleMenu,
  onOpenSystemDefinition,
  onOpenSavedDefinition,
  onActivateTab,
  onCloseTab,
  onUpdateDefinition,
  onExecuteTab,
  onSaveTab
}: ReportsBuilderWorkspaceProps): JSX.Element {
  const activeTab = openTabs.find((tab) => tab.id === activeTabId) ?? null;
  const activeDefinition = activeTab?.definition ?? null;
  const [isBuilderCollapsed, setIsBuilderCollapsed] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [lookupState, setLookupState] = useState<LookupState | null>(null);
  const [lookupQuery, setLookupQuery] = useState("");
  const [filterEditor, setFilterEditor] = useState<FilterEditorState>(() =>
    createDefaultFilterEditor(null, null)
  );
  const [sortEditor, setSortEditor] = useState<SortEditorState>(() => createDefaultSortEditor(null));
  const [saveDraft, setSaveDraft] = useState({ name: "", description: "" });
  const filtersSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeDefinition || !catalog) {
      return;
    }

    setFilterEditor((current) => {
      const fallbackField = resolveFirstFilterableField(catalog, activeDefinition.base);
      const field = current.field && fieldBelongsToBase(catalog, current.field, activeDefinition.base)
        ? current.field
        : fallbackField;
      return {
        ...current,
        field,
        operator: resolveDefaultOperator(catalog, field)
      };
    });

    setSortEditor((current) => {
      const fallbackField = resolveFirstSortableField(catalog, activeDefinition.base);
      return {
        ...current,
        field: current.field && fieldBelongsToBase(catalog, current.field, activeDefinition.base)
          ? current.field
          : fallbackField
      };
    });

    setSaveDraft({
      name: activeDefinition.name,
      description: activeDefinition.description ?? ""
    });
  }, [activeDefinition, catalog]);

  const activeField = catalog && activeDefinition
    ? catalog.fields.find(
        (field) => field.id === filterEditor.field && field.bases.includes(activeDefinition.base)
      ) ?? null
    : null;

  const activeLookupRows = useMemo(() => {
    if (!lookupState) {
      return [];
    }
    const rows = lookupRows[lookupState.kind];
    const query = lookupQuery.trim().toLowerCase();
    return query ? rows.filter((row) => row.searchText.toLowerCase().includes(query)) : rows;
  }, [lookupQuery, lookupRows, lookupState]);

  const payloadPreview = activeDefinition ? JSON.stringify(activeDefinition, null, 2) : "";
  const canAddLookup =
    activeField?.lookupKind === "service" ||
    activeField?.lookupKind === "professional" ||
    activeField?.lookupKind === "client";

  function handleAddCondition(): void {
    if (!activeDefinition || !catalog || !filterEditor.field || !activeTab) {
      return;
    }

    const nextNode: ReportFilterConditionNode = {
      id: createLocalId(),
      kind: "condition",
      connective: activeDefinition.filters.length === 0 ? null : filterEditor.connective,
      level: 0,
      field: filterEditor.field,
      operator: filterEditor.operator,
      valueMode: filterEditor.valueMode,
      value:
        filterEditor.operator === "between"
          ? [filterEditor.valuePrimary, filterEditor.valueSecondary]
          : filterEditor.operator === "in" || filterEditor.operator === "not_in"
            ? filterEditor.valuePrimary
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean)
            : filterEditor.valuePrimary,
      parameterName:
        filterEditor.valueMode === "parameter" ? filterEditor.parameterName.trim() || undefined : undefined
    };

    onUpdateDefinition(activeTab.id, {
      ...activeDefinition,
      filters: [...activeDefinition.filters, nextNode]
    });

    setFilterEditor((current) => ({
      ...current,
      valuePrimary: "",
      valueSecondary: "",
      parameterName: ""
    }));
  }

  function handleRemoveFilter(filterId: string): void {
    if (!activeDefinition || !activeTab) {
      return;
    }

    onUpdateDefinition(activeTab.id, {
      ...activeDefinition,
      filters: activeDefinition.filters.filter((node) => node.id !== filterId)
    });
  }

  function handleRemoveSort(sortId: string): void {
    if (!activeDefinition || !activeTab) {
      return;
    }

    onUpdateDefinition(activeTab.id, {
      ...activeDefinition,
      orderBy: activeDefinition.orderBy.filter((entry) => entry.id !== sortId)
    });
  }

  function handleAddSort(): void {
    if (!activeDefinition || !activeTab || !sortEditor.field) {
      return;
    }

    const nextSort = {
      id: createLocalId(),
      field: sortEditor.field,
      direction: sortEditor.direction,
      priority: Math.max(Number(sortEditor.priority) || activeDefinition.orderBy.length + 1, 1)
    };

    onUpdateDefinition(activeTab.id, {
      ...activeDefinition,
      orderBy: [...activeDefinition.orderBy, nextSort].sort(
        (left, right) => left.priority - right.priority
      )
    });

    setSortEditor((current) => ({
      ...current,
      priority: String(activeDefinition.orderBy.length + 2)
    }));
  }

  function handleLookupSelect(value: string): void {
    setFilterEditor((current) => ({
      ...current,
      valuePrimary: value
    }));
    setLookupState(null);
    setLookupQuery("");
  }

  function handleSaveModel(): void {
    if (!activeDefinition || !activeTab) {
      return;
    }

    onSaveTab(
      activeTab.id,
      saveDraft.name.trim() || activeDefinition.name,
      saveDraft.description.trim()
    );
    setIsSaveModalOpen(false);
  }

  function openFiltersFocus(): void {
    setIsBuilderCollapsed(false);
    setIsFilterModalOpen(true);
  }

  return (
    <section className="reports-builder-shell">
      <header className="reports-builder-topbar">
        <div className="reports-builder-heading">
          <span className="eyebrow">Relatorios</span>
          <h1>Builder de relatorios</h1>
          <p>Monte, execute e salve definicoes reutilizaveis sem misturar filtros globais com a leitura do resultado.</p>
        </div>
        <div className="reports-builder-actions">
          {showMenuButton && onToggleMenu ? (
            <div
              className="reports-builder-menu-anchor"
              onMouseEnter={onOpenMenu}
              onMouseLeave={onCloseMenu}
            >
              <button
                className={isMenuOpen ? "dashboard-link-button is-active" : "dashboard-link-button"}
                onClick={onToggleMenu}
                type="button"
              >
                Visoes
              </button>
              {isMenuOpen ? (
                <div className="reports-builder-menu-popover">
                  {menuGroups.map(([group, items]) => (
                    <section className="reports-builder-menu-group" key={group}>
                      <span className="reports-builder-menu-group-title">{group}</span>
                      <div className="reports-builder-menu-items">
                        {items.map((item) => (
                          <button
                            className="reports-builder-menu-item"
                            key={item.code}
                            onClick={() => onOpenSystemDefinition(item.code)}
                            type="button"
                          >
                            <strong>{item.label}</strong>
                            <span>{item.description}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <button className="secondary-button" onClick={openFiltersFocus} type="button">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button className="secondary-button" onClick={() => setIsModelsModalOpen(true)} type="button">
            <FolderOpen className="w-4 h-4" />
            Modelos salvos
          </button>
          <button
            className="secondary-button"
            disabled={!activeTab}
            onClick={() => setIsSaveModalOpen(true)}
            type="button"
          >
            <Save className="w-4 h-4" />
            Salvar modelo
          </button>
          <button
            className="primary-button"
            disabled={!activeTab || activeTab.isLoading}
            onClick={() => activeTab && onExecuteTab(activeTab.id)}
            type="button"
          >
            <Play className="w-4 h-4" />
            {activeTab?.isLoading ? "Executando..." : "Executar"}
          </button>
        </div>
      </header>

      <div className="reports-builder-dock-tabs">
        {openTabs.length > 0 ? (
          openTabs.map((tab) => (
            <button
              className={tab.id === activeTabId ? "reports-builder-dock-tab is-active" : "reports-builder-dock-tab"}
              key={tab.id}
              onClick={() => onActivateTab(tab.id)}
              type="button"
            >
              <div className="reports-builder-dock-copy">
                <strong>{tab.label}</strong>
                <small>{tab.dirty ? "Alterado" : tab.definition.source === "saved" ? "Modelo salvo" : "Sistema"}</small>
              </div>
              {openTabs.length > 1 ? (
                <span
                  className="reports-builder-dock-close"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </span>
              ) : null}
            </button>
          ))
        ) : (
          <div className="reports-builder-dock-empty">
            Passe o mouse em <strong>Relatorios</strong> no shell lateral e abra uma visao dedicada.
          </div>
        )}
      </div>

      <div className={`reports-builder-workspace${isBuilderCollapsed ? " is-collapsed" : ""}`}>
        <section className="reports-builder-panel">
          <div className="reports-builder-panel-header">
            <div>
              <h2>Builder</h2>
              <p>Metrica, filtros, agrupamento e ordenacao do relatorio atual.</p>
            </div>
            <button
              className="ghost-button"
              onClick={() => setIsBuilderCollapsed((current) => !current)}
              type="button"
            >
              {isBuilderCollapsed ? "Mostrar builder" : "Ocultar builder"}
            </button>
          </div>

          {activeDefinition && catalog ? (
            <div className="reports-builder-panel-body">
              <section className="reports-builder-section-card">
                <div className="reports-builder-section-head">
                  <h3>Estrutura base</h3>
                </div>
                <div className="reports-builder-section-body">
                  <div className="reports-builder-grid reports-builder-grid-2">
                    <label className="field">
                      <span>Titulo do relatorio</span>
                      <input
                        type="text"
                        value={activeDefinition.name}
                        onChange={(event) =>
                          onUpdateDefinition(activeTabId, {
                            ...activeDefinition,
                            name: event.target.value
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Visualizacao</span>
                      <select
                        value={activeDefinition.visualization}
                        onChange={(event) =>
                          onUpdateDefinition(activeTabId, {
                            ...activeDefinition,
                            visualization: event.target.value as ReportDefinition["visualization"]
                          })
                        }
                      >
                        {visualizationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="field">
                    <span>Descricao</span>
                    <textarea
                      rows={3}
                      value={activeDefinition.description ?? ""}
                      onChange={(event) =>
                        onUpdateDefinition(activeTabId, {
                          ...activeDefinition,
                          description: event.target.value
                        })
                      }
                    />
                  </label>

                  <div className="reports-builder-grid reports-builder-grid-4">
                    <label className="field">
                      <span>Base</span>
                      <input type="text" readOnly value={activeDefinition.base} />
                    </label>
                    <label className="field">
                      <span>Variavel</span>
                      <input
                        type="text"
                        value={activeDefinition.metric.name}
                        onChange={(event) =>
                          onUpdateDefinition(activeTabId, {
                            ...activeDefinition,
                            metric: {
                              ...activeDefinition.metric,
                              name: event.target.value
                            }
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Operacao</span>
                      <select
                        value={activeDefinition.metric.operation}
                        onChange={(event) =>
                          onUpdateDefinition(activeTabId, {
                            ...activeDefinition,
                            metric: {
                              ...activeDefinition.metric,
                              operation: event.target.value as ReportDefinition["metric"]["operation"]
                            }
                          })
                        }
                      >
                        {metricOperationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Campo base</span>
                      <select
                        value={activeDefinition.metric.field}
                        onChange={(event) =>
                          onUpdateDefinition(activeTabId, {
                            ...activeDefinition,
                            metric: {
                              ...activeDefinition.metric,
                              field: event.target.value
                            }
                          })
                        }
                      >
                        {catalog.fields
                          .filter((field) => field.bases.includes(activeDefinition.base))
                          .map((field) => (
                            <option key={field.id} value={field.id}>
                              {field.label}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>

                  <div className="reports-builder-grid reports-builder-grid-2">
                    <label className="field">
                      <span>Agrupar por</span>
                      <select
                        value={activeDefinition.groupBy[0] ?? ""}
                        onChange={(event) =>
                          onUpdateDefinition(activeTabId, {
                            ...activeDefinition,
                            groupBy: event.target.value ? [event.target.value] : []
                          })
                        }
                      >
                        <option value="">Sem agrupamento</option>
                        {catalog.groupByOptions
                          .filter((option) => option.bases.includes(activeDefinition.base))
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                      </select>
                    </label>
                    <div className="reports-builder-code-card">
                      <span className="eyebrow">Modelo</span>
                      <strong>{activeDefinition.code}</strong>
                      <small>{activeDefinition.source === "saved" ? "Modelo salvo do tenant" : "Definicao do sistema"}</small>
                    </div>
                  </div>
                </div>
              </section>

              <section className="reports-builder-section-card" ref={filtersSectionRef}>
                <div className="reports-builder-section-head">
                  <h3>Filtros e expressoes</h3>
                </div>
                <div className="reports-builder-section-body">
                  <div className="reports-builder-grid reports-builder-grid-4">
                    <label className="field">
                      <span>Conectar com</span>
                      <select
                        value={filterEditor.connective}
                        onChange={(event) =>
                          setFilterEditor((current) => ({
                            ...current,
                            connective: event.target.value as "AND" | "OR"
                          }))
                        }
                      >
                        <option value="AND">E</option>
                        <option value="OR">OU</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Campo</span>
                      <select
                        value={filterEditor.field}
                        onChange={(event) => {
                          const field = event.target.value;
                          setFilterEditor((current) => ({
                            ...current,
                            field,
                            operator: resolveDefaultOperator(catalog, field)
                          }));
                        }}
                      >
                        {catalog.fields
                          .filter((field) => field.filterable && field.bases.includes(activeDefinition.base))
                          .map((field) => (
                            <option key={field.id} value={field.id}>
                              {field.label}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Operador</span>
                      <select
                        value={filterEditor.operator}
                        onChange={(event) =>
                          setFilterEditor((current) => ({
                            ...current,
                            operator: event.target.value as ReportOperator
                          }))
                        }
                      >
                        {(activeField?.operators ?? []).map((operator) => (
                          <option key={operator} value={operator}>
                            {operator}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Modo</span>
                      <select
                        value={filterEditor.valueMode}
                        onChange={(event) =>
                          setFilterEditor((current) => ({
                            ...current,
                            valueMode: event.target.value as FilterEditorState["valueMode"]
                          }))
                        }
                      >
                        <option value="value">Valor fixo</option>
                        <option value="parameter">Parametro</option>
                      </select>
                    </label>
                  </div>

                  <div className="reports-builder-grid reports-builder-grid-3">
                    <label className="field">
                      <span>Valor</span>
                      <div className="reports-builder-input-with-action">
                        <input
                          type="text"
                          value={filterEditor.valuePrimary}
                          onChange={(event) =>
                            setFilterEditor((current) => ({
                              ...current,
                              valuePrimary: event.target.value
                            }))
                          }
                        />
                        {canAddLookup ? (
                          <button
                            className="icon-button"
                            onClick={() => setLookupState({ kind: activeField.lookupKind as LookupKind })}
                            type="button"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </label>

                    {filterEditor.operator === "between" ? (
                      <label className="field">
                        <span>Ate</span>
                        <input
                          type="text"
                          value={filterEditor.valueSecondary}
                          onChange={(event) =>
                            setFilterEditor((current) => ({
                              ...current,
                              valueSecondary: event.target.value
                            }))
                          }
                        />
                      </label>
                    ) : (
                      <div />
                    )}

                    <label className="field">
                      <span>Nome do parametro</span>
                      <input
                        type="text"
                        value={filterEditor.parameterName}
                        onChange={(event) =>
                          setFilterEditor((current) => ({
                            ...current,
                            parameterName: event.target.value
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="button-row">
                    <button className="secondary-button" onClick={handleAddCondition} type="button">
                      Adicionar condicao
                    </button>
                  </div>

                  <div className="reports-builder-tree-list">
                    {activeDefinition.filters.length > 0 ? (
                      activeDefinition.filters.map((node) => (
                        <FilterNodeView
                          catalog={catalog}
                          key={node.id}
                          node={node}
                          onRemove={handleRemoveFilter}
                        />
                      ))
                    ) : (
                      <div className="empty-state">Nenhuma condicao adicionada ainda.</div>
                    )}
                  </div>
                </div>
              </section>

              <section className="reports-builder-section-card">
                <div className="reports-builder-section-head">
                  <h3>Ordenacao</h3>
                </div>
                <div className="reports-builder-section-body">
                  <div className="reports-builder-grid reports-builder-grid-3">
                    <label className="field">
                      <span>Campo</span>
                      <select
                        value={sortEditor.field}
                        onChange={(event) =>
                          setSortEditor((current) => ({
                            ...current,
                            field: event.target.value
                          }))
                        }
                      >
                        {catalog.fields
                          .filter((field) => field.sortable && field.bases.includes(activeDefinition.base))
                          .map((field) => (
                            <option key={field.id} value={field.id}>
                              {field.label}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Direcao</span>
                      <select
                        value={sortEditor.direction}
                        onChange={(event) =>
                          setSortEditor((current) => ({
                            ...current,
                            direction: event.target.value as ReportSortDirection
                          }))
                        }
                      >
                        {sortDirectionOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Prioridade</span>
                      <input
                        type="number"
                        min={1}
                        value={sortEditor.priority}
                        onChange={(event) =>
                          setSortEditor((current) => ({
                            ...current,
                            priority: event.target.value
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="button-row">
                    <button className="secondary-button" onClick={handleAddSort} type="button">
                      Adicionar order by
                    </button>
                  </div>

                  <div className="reports-builder-tree-list">
                    {activeDefinition.orderBy.length > 0 ? (
                      activeDefinition.orderBy
                        .slice()
                        .sort((left, right) => left.priority - right.priority)
                        .map((entry) => (
                          <div className="reports-builder-tree-node" key={entry.id}>
                            <div>
                              <strong>{resolveFieldLabel(catalog, entry.field)}</strong>
                              <span>{entry.direction} • prioridade {entry.priority}</span>
                            </div>
                            <button className="icon-button" onClick={() => handleRemoveSort(entry.id)} type="button">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                    ) : (
                      <div className="empty-state">Nenhuma ordenacao adicionada.</div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="empty-state">
              Abra uma visao do shell lateral para iniciar o builder.
            </div>
          )}
        </section>

        <section className="reports-builder-results-panel">
          <div className="reports-builder-results-header">
            <div>
              <h2>{activeTab?.label ?? "Relatorio"}</h2>
              <p>
                {activeDefinition?.description ??
                  "Abra uma visao do shell lateral para criar ou editar um relatorio dedicado."}
              </p>
            </div>
            {activeTab?.error ? <div className="feedback-banner is-error">{activeTab.error}</div> : null}
            {error ? <div className="feedback-banner is-error">{error}</div> : null}
          </div>

          {!activeTab && !isLoading ? (
            <div className="reports-builder-empty-route">
              <article className="reports-builder-preview-card">
                <h3>Nenhuma dock tab aberta</h3>
                <p>
                  Passe o mouse em <strong>Relatorios</strong> no shell lateral e abra uma das visoes gerenciais.
                </p>
                <div className="reports-builder-empty-actions">
                  {menuGroups
                    .flatMap(([, items]) => items)
                    .slice(0, 4)
                    .map((item) => (
                      <button
                        className="secondary-button"
                        key={item.code}
                        onClick={() => onOpenSystemDefinition(item.code)}
                        type="button"
                      >
                        {item.label}
                      </button>
                    ))}
                </div>
              </article>
            </div>
          ) : null}

          {isLoading ? <div className="empty-state">Carregando relatorios...</div> : null}

          {activeTab?.result ? (
            <div className="reports-builder-results-body">
              {activeTab.result.appliedFilters.length > 0 ? (
                <div className="reports-builder-chip-row">
                  {activeTab.result.appliedFilters.map((chip) => (
                    <span className="chip neutral" key={chip.id}>
                      {chip.label}: {chip.value}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="reports-builder-kpi-grid">
                {activeTab.result.kpis.map((item) => (
                  <article className="reports-builder-kpi-card" key={item.id}>
                    <label>{item.label}</label>
                    <strong>{item.value}</strong>
                    <span>{item.helper}</span>
                  </article>
                ))}
              </div>

              <section className="reports-builder-preview-card">
                <h3>Expressao literal</h3>
                <p>{activeTab.result.previewExpression}</p>
              </section>

              {activeTab.result.table ? <ResultsTable table={activeTab.result.table} /> : null}

              <section className="reports-builder-preview-card">
                <h3>Payload tecnico</h3>
                <pre>{payloadPreview}</pre>
              </section>
            </div>
          ) : activeTab && !activeTab.isLoading ? (
            <div className="empty-state">Execute o relatorio para ver o resultado real do backend.</div>
          ) : null}
        </section>
      </div>

      {isModelsModalOpen ? (
        <Modal
          title="Modelos salvos"
          subtitle="Definicoes reutilizaveis do tenant."
          onClose={() => setIsModelsModalOpen(false)}
        >
          <div className="reports-builder-modal-list">
            {savedModels.length > 0 ? (
              savedModels.map((definition) => (
                <button
                  className="reports-builder-model-item"
                  key={definition.id}
                  onClick={() => {
                    onOpenSavedDefinition(definition.id);
                    setIsModelsModalOpen(false);
                  }}
                  type="button"
                >
                  <div>
                    <strong>{definition.name}</strong>
                    <span>{definition.description || "Sem descricao informada."}</span>
                    <span>
                      {definition.authorName || "AgendaAI"} • atualizado em {formatRelativeDateTime(definition.updatedAt)}
                    </span>
                  </div>
                  <small>{definition.code}</small>
                </button>
              ))
            ) : (
              <div className="empty-state">Nenhum modelo salvo ainda.</div>
            )}
          </div>
        </Modal>
      ) : null}

      {isFilterModalOpen && activeDefinition && catalog ? (
        <Modal
          title={`Filtros | ${activeDefinition.name}`}
          subtitle="Preencha os filtros e aplique apenas no relatorio atual."
          footer={
            <Fragment>
              <button
                className="secondary-button"
                onClick={() =>
                  onUpdateDefinition(activeTabId, {
                    ...activeDefinition,
                    filters: []
                  })
                }
                type="button"
              >
                Limpar filtros
              </button>
              <button className="primary-button" onClick={() => setIsFilterModalOpen(false)} type="button">
                Aplicar filtros
              </button>
            </Fragment>
          }
          onClose={() => setIsFilterModalOpen(false)}
        >
          <div className="stack-form">
            <div className="reports-builder-grid reports-builder-grid-4">
              <label className="field">
                <span>Conectar com</span>
                <select
                  value={filterEditor.connective}
                  onChange={(event) =>
                    setFilterEditor((current) => ({
                      ...current,
                      connective: event.target.value as "AND" | "OR"
                    }))
                  }
                >
                  <option value="AND">E</option>
                  <option value="OR">OU</option>
                </select>
              </label>
              <label className="field">
                <span>Campo</span>
                <select
                  value={filterEditor.field}
                  onChange={(event) => {
                    const field = event.target.value;
                    setFilterEditor((current) => ({
                      ...current,
                      field,
                      operator: resolveDefaultOperator(catalog, field)
                    }));
                  }}
                >
                  {catalog.fields
                    .filter((field) => field.filterable && field.bases.includes(activeDefinition.base))
                    .map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                <span>Operador</span>
                <select
                  value={filterEditor.operator}
                  onChange={(event) =>
                    setFilterEditor((current) => ({
                      ...current,
                      operator: event.target.value as ReportOperator
                    }))
                  }
                >
                  {(activeField?.operators ?? []).map((operator) => (
                    <option key={operator} value={operator}>
                      {operator}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Modo</span>
                <select
                  value={filterEditor.valueMode}
                  onChange={(event) =>
                    setFilterEditor((current) => ({
                      ...current,
                      valueMode: event.target.value as FilterEditorState["valueMode"]
                    }))
                  }
                >
                  <option value="value">Valor fixo</option>
                  <option value="parameter">Parametro</option>
                </select>
              </label>
            </div>

            <div className="reports-builder-grid reports-builder-grid-3">
              <label className="field">
                <span>Valor</span>
                <div className="reports-builder-input-with-action">
                  <input
                    type="text"
                    value={filterEditor.valuePrimary}
                    onChange={(event) =>
                      setFilterEditor((current) => ({
                        ...current,
                        valuePrimary: event.target.value
                      }))
                    }
                  />
                  {canAddLookup ? (
                    <button
                      className="icon-button"
                      onClick={() => setLookupState({ kind: activeField.lookupKind as LookupKind })}
                      type="button"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </label>

              {filterEditor.operator === "between" ? (
                <label className="field">
                  <span>Ate</span>
                  <input
                    type="text"
                    value={filterEditor.valueSecondary}
                    onChange={(event) =>
                      setFilterEditor((current) => ({
                        ...current,
                        valueSecondary: event.target.value
                      }))
                    }
                  />
                </label>
              ) : (
                <div />
              )}

              <label className="field">
                <span>Nome do parametro</span>
                <input
                  type="text"
                  value={filterEditor.parameterName}
                  onChange={(event) =>
                    setFilterEditor((current) => ({
                      ...current,
                      parameterName: event.target.value
                    }))
                  }
                />
              </label>
            </div>

            <div className="button-row">
              <button className="secondary-button" onClick={handleAddCondition} type="button">
                Adicionar condicao
              </button>
            </div>

            <div className="reports-builder-tree-list">
              {activeDefinition.filters.length > 0 ? (
                activeDefinition.filters.map((node) => (
                  <FilterNodeView
                    catalog={catalog}
                    key={node.id}
                    node={node}
                    onRemove={handleRemoveFilter}
                  />
                ))
              ) : (
                <div className="empty-state">Nenhuma condicao adicionada ainda.</div>
              )}
            </div>
          </div>
        </Modal>
      ) : null}

      {isSaveModalOpen ? (
        <Modal
          title="Salvar modelo"
          subtitle="Persistir apenas a definicao reutilizavel."
          footer={
            <Fragment>
              <button className="secondary-button" onClick={() => setIsSaveModalOpen(false)} type="button">
                Cancelar
              </button>
              <button className="primary-button" onClick={handleSaveModel} type="button">
                Salvar
              </button>
            </Fragment>
          }
          onClose={() => setIsSaveModalOpen(false)}
        >
          <div className="stack-form">
            <label className="field">
              <span>Nome</span>
              <input
                type="text"
                value={saveDraft.name}
                onChange={(event) => setSaveDraft({ ...saveDraft, name: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Descricao</span>
              <textarea
                rows={4}
                value={saveDraft.description}
                onChange={(event) => setSaveDraft({ ...saveDraft, description: event.target.value })}
              />
            </label>
          </div>
        </Modal>
      ) : null}

      {lookupState ? (
        <Modal
          title="Consulta padrao"
          subtitle="Selecione um registro para preencher o filtro atual."
          onClose={() => {
            setLookupState(null);
            setLookupQuery("");
          }}
        >
          <div className="stack-form">
            <label className="field">
              <span>Buscar</span>
              <div className="reports-builder-input-with-action">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(event) => setLookupQuery(event.target.value)}
                />
                <Search className="w-4 h-4" />
              </div>
            </label>

            <div className="reports-builder-lookup-table">
              <div className="reports-builder-lookup-head">
                {resolveLookupColumns(lookupState.kind).map((column) => (
                  <span key={column}>{column}</span>
                ))}
              </div>
              {activeLookupRows.length > 0 ? (
                activeLookupRows.map((row) => (
                  <button
                    className="reports-builder-lookup-row"
                    key={row.id}
                    onClick={() => handleLookupSelect(row.value)}
                    type="button"
                  >
                    <span className="reports-builder-lookup-row-code">{row.code}</span>
                    <span className="reports-builder-lookup-row-primary">{row.primary}</span>
                    <span className="reports-builder-lookup-row-secondary">{row.secondary ?? "—"}</span>
                  </button>
                ))
              ) : (
                <div className="empty-state">Nenhum registro encontrado para a busca informada.</div>
              )}
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

function createDefaultFilterEditor(
  catalog: ReportBuilderCatalog | null,
  definition: ReportDefinition | null
): FilterEditorState {
  const field = catalog && definition
    ? resolveFirstFilterableField(catalog, definition.base)
    : "";
  return {
    connective: "AND",
    field,
    operator: resolveDefaultOperator(catalog, field),
    valueMode: "value",
    valuePrimary: "",
    valueSecondary: "",
    parameterName: ""
  };
}

function createDefaultSortEditor(definition: ReportDefinition | null): SortEditorState {
  return {
    field: definition?.metric.field ?? "",
    direction: "desc",
    priority: "1"
  };
}

function resolveFirstFilterableField(catalog: ReportBuilderCatalog, base: ReportDefinition["base"]): string {
  return catalog.fields.find((field) => field.filterable && field.bases.includes(base))?.id ?? "";
}

function resolveFirstSortableField(catalog: ReportBuilderCatalog, base: ReportDefinition["base"]): string {
  return catalog.fields.find((field) => field.sortable && field.bases.includes(base))?.id ?? "";
}

function fieldBelongsToBase(
  catalog: ReportBuilderCatalog,
  fieldId: string,
  base: ReportDefinition["base"]
): boolean {
  return catalog.fields.some((field) => field.id === fieldId && field.bases.includes(base));
}

function resolveDefaultOperator(
  catalog: ReportBuilderCatalog | null,
  fieldId: string
): ReportOperator {
  if (!catalog || !fieldId) {
    return "equals";
  }
  return catalog.fields.find((field) => field.id === fieldId)?.operators[0] ?? "equals";
}

function resolveFieldLabel(catalog: ReportBuilderCatalog, fieldId: string): string {
  return catalog.fields.find((field) => field.id === fieldId)?.label ?? fieldId;
}

function resolveValueLabel(value: ReportFilterConditionNode["value"]): string {
  if (Array.isArray(value)) {
    return value.join(" | ");
  }
  return String(value);
}

function resolveLookupColumns(kind: LookupKind): readonly string[] {
  if (kind === "service") {
    return ["Codigo", "Descricao", "Auxiliar"];
  }
  if (kind === "professional") {
    return ["Codigo", "Nome", "Auxiliar"];
  }
  return ["Codigo", "Nome", "Telefone"];
}

function createLocalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `tmp-${Math.random().toString(36).slice(2, 10)}`;
}

function formatRelativeDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(parsed);
}

function FilterNodeView({
  node,
  catalog,
  onRemove
}: {
  readonly node: ReportFilterNode;
  readonly catalog: ReportBuilderCatalog;
  readonly onRemove: (filterId: string) => void;
}): JSX.Element {
  if (node.kind !== "condition") {
    return (
      <div className="reports-builder-tree-node">
        <div>
          <strong>{node.kind === "group_start" ? "Abrir grupo" : "Fechar grupo"}</strong>
          <span>Nivel {node.level}</span>
        </div>
        <button className="icon-button" onClick={() => onRemove(node.id)} type="button">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="reports-builder-tree-node">
      <div>
        <strong>
          {node.connective ? `${node.connective} ` : ""}
          {resolveFieldLabel(catalog, node.field)}
        </strong>
        <span>
          {node.operator} • {resolveValueLabel(node.value)}
          {node.valueMode === "parameter" && node.parameterName ? ` • parametro ${node.parameterName}` : ""}
        </span>
      </div>
      <button className="icon-button" onClick={() => onRemove(node.id)} type="button">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ResultsTable({ table }: { readonly table: ReportExecutionTable }): JSX.Element {
  return (
    <section className="reports-builder-preview-card">
      <h3>Resultado</h3>
      {table.rows.length > 0 ? (
        <div className="reports-builder-results-table">
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
                    <td key={`${row.id}:${index}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">{table.emptyMessage ?? "Nenhum dado encontrado."}</div>
      )}
    </section>
  );
}

function Modal({
  title,
  subtitle,
  children,
  footer,
  onClose
}: {
  readonly title: string;
  readonly subtitle?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <div className="reports-builder-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="reports-builder-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="reports-builder-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="reports-builder-modal-body">{children}</div>
        {footer ? <div className="reports-builder-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
