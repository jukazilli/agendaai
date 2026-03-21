import {
  Filter,
  FolderOpen,
  Play,
  Save,
  Search,
  X
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState, type JSX, type ReactNode } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type {
  ReportBuilderCatalog,
  ReportCatalogField,
  ReportDefinition,
  ReportExecutionTable,
  ReportExecutionResponse,
  ReportFieldOption,
  ReportFilterConditionNode,
  ReportFilterNode,
  ReportOperator,
  ReportRelationMode,
  ReportSortDirection
} from "@agendaai/contracts";

import { createFallbackReportBuilderCatalog } from "./lib/report-builder-fallback";

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

type LookupKind = "base" | "service" | "professional" | "client";

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

type ChartValueFormat = "currency" | "count" | "hours" | "minutes" | "percent";

interface CartesianChartModel {
  readonly kind: "bar" | "line";
  readonly title: string;
  readonly format: ChartValueFormat;
  readonly categories: readonly string[];
  readonly series: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly values: readonly number[];
    readonly color: string;
  }>;
}

interface PieChartModel {
  readonly kind: "pie";
  readonly title: string;
  readonly format: ChartValueFormat;
  readonly slices: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly value: number;
    readonly color: string;
  }>;
}

interface GaugeChartModel {
  readonly kind: "gauge";
  readonly title: string;
  readonly format: ChartValueFormat;
  readonly value: number;
  readonly maxValue: number;
  readonly helper?: string;
}

type ReportChartModel = CartesianChartModel | PieChartModel | GaugeChartModel;
type ParsedChartNumber = { readonly value: number; readonly format: ChartValueFormat };
type NumericChartColumn = {
  readonly index: number;
  readonly label: string;
  readonly values: readonly number[];
  readonly format: ChartValueFormat;
  readonly score: number;
};

const chartPalette = ["#5c5cff", "#0f8a88", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"] as const;

const visualizationOptions: ReadonlyArray<ReportDefinition["visualization"]> = [
  "kpi_table",
  "kpi",
  "bar",
  "line",
  "pie",
  "gauge"
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

const visualizationLabels: Record<ReportDefinition["visualization"], string> = {
  kpi_table: "Resumo com tabela",
  kpi: "Resumo",
  bar: "Barras",
  line: "Linhas",
  pie: "Pizza",
  gauge: "Medidor",
  time_series: "Linhas",
  ranking: "Barras"
};

const metricOperationLabels: Record<ReportDefinition["metric"]["operation"], string> = {
  sum: "Soma",
  count: "Quantidade",
  count_distinct: "Quantidade unica",
  avg: "Media",
  max: "Maior valor",
  min: "Menor valor"
};

export function ReportsBuilderWorkspace({
  menuGroups,
  openTabs,
  activeTabId,
  catalog: rawCatalog,
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
  const fallbackCatalog = useMemo(
    () =>
      createFallbackReportBuilderCatalog(
        activeDefinition?.tenantId ?? savedModels[0]?.tenantId ?? "fallback-tenant"
      ),
    [activeDefinition?.tenantId, savedModels]
  );
  const catalog = useMemo(
    () => mergeReportBuilderCatalog(rawCatalog, fallbackCatalog),
    [fallbackCatalog, rawCatalog]
  );
  const catalogFields = catalog.fields;
  const catalogBaseOptions = catalog.baseOptions;
  const catalogGroupByOptions = catalog.groupByOptions;
  const catalogRelationOptions = catalog.relationOptions;
  const catalogSystemDefinitions = catalog.systemDefinitions;
  const [isBuilderCollapsed, setIsBuilderCollapsed] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [lookupState, setLookupState] = useState<LookupState | null>(null);
  const [lookupQuery, setLookupQuery] = useState("");
  const [filterEditor, setFilterEditor] = useState<FilterEditorState>(() =>
    createDefaultFilterEditor(null, null)
  );
  const [sortEditor, setSortEditor] = useState<SortEditorState>(() => createDefaultSortEditor(null, null));
  const [saveDraft, setSaveDraft] = useState({ name: "", description: "" });

  useEffect(() => {
    if (!activeDefinition) {
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

  const activeField = activeDefinition
    ? catalogFields.find(
        (field) => field.id === filterEditor.field && field.bases.includes(activeDefinition.base)
      ) ?? null
    : null;
  const filterableFields = useMemo(
    () =>
      activeDefinition
        ? catalogFields.filter((field) => field.filterable && field.bases.includes(activeDefinition.base))
        : [],
    [activeDefinition, catalog, catalogFields]
  );
  const sortableFields = useMemo(
    () =>
      activeDefinition
        ? catalogFields.filter((field) => field.sortable && field.bases.includes(activeDefinition.base))
        : [],
    [activeDefinition, catalog, catalogFields]
  );
  const groupableOptions = useMemo(
    () =>
      activeDefinition
        ? catalogGroupByOptions.filter((option) => option.bases.includes(activeDefinition.base))
        : [],
    [activeDefinition, catalog, catalogGroupByOptions]
  );
  const relationOptions = useMemo(
    () =>
      activeDefinition
        ? catalogRelationOptions.filter((option) => option.base === activeDefinition.base)
        : [],
    [activeDefinition, catalog, catalogRelationOptions]
  );
  const activeFieldOptions = activeField?.options ?? [];

  const baseLookupRows = useMemo(
    () =>
      catalogBaseOptions.map((option) => ({
        id: option.id,
        value: option.id,
        code: option.id,
        primary: option.label,
        secondary: option.description ?? "",
        searchText: `${option.id} ${option.label} ${option.description ?? ""}`
      })),
    [catalogBaseOptions]
  );

  const activeLookupRows = useMemo(() => {
    if (!lookupState) {
      return [];
    }
    const rows = lookupState.kind === "base" ? baseLookupRows : lookupRows[lookupState.kind];
    const query = lookupQuery.trim().toLowerCase();
    return query ? rows.filter((row) => row.searchText.toLowerCase().includes(query)) : rows;
  }, [baseLookupRows, lookupQuery, lookupRows, lookupState]);

  const modelOptions = useMemo(
    () => [...catalogSystemDefinitions, ...savedModels],
    [catalogSystemDefinitions, savedModels]
  );
  const systemModels = useMemo(
    () => modelOptions.filter((definition) => definition.source === "system"),
    [modelOptions]
  );
  const userModels = useMemo(
    () => modelOptions.filter((definition) => definition.source === "saved"),
    [modelOptions]
  );

  const payloadPreview = activeDefinition ? JSON.stringify(activeDefinition, null, 2) : "";
  const activeChartModel = useMemo(
    () =>
      activeTab?.result && activeDefinition
        ? buildChartModel(activeDefinition, activeTab.result)
        : null,
    [activeDefinition, activeTab?.result]
  );
  const canAddLookup =
    activeField?.lookupKind === "service" ||
    activeField?.lookupKind === "professional" ||
    activeField?.lookupKind === "client";

  function handleAddCondition(): void {
    if (!activeDefinition || !filterEditor.field || !activeTab) {
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
    if (lookupState?.kind === "base" && activeDefinition) {
      const nextBase = value as ReportDefinition["base"];
      const nextDefinition = normalizeDefinitionForBase(catalog, activeDefinition, nextBase);
      onUpdateDefinition(activeTabId, nextDefinition);
      setFilterEditor(createDefaultFilterEditor(catalog, nextDefinition));
      setSortEditor(createDefaultSortEditor(catalog, nextDefinition));
      setLookupState(null);
      setLookupQuery("");
      return;
    }

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

      <section className="reports-builder-topbar">
        <div className="reports-builder-actions">
          <button
            className={isBuilderCollapsed ? "secondary-button is-active" : "secondary-button"}
            disabled={!activeTab}
            onClick={() => setIsBuilderCollapsed((current) => !current)}
            type="button"
          >
            {isBuilderCollapsed ? "Mostrar montagem" : "Ocultar montagem"}
          </button>
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

        {activeDefinition && !isBuilderCollapsed ? (
          <div className="reports-builder-inline-builder">
            <div className="reports-builder-grid reports-builder-grid-4">
              <label className="field">
                <span>Nome</span>
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
                  value={normalizeVisualization(activeDefinition.visualization)}
                  onChange={(event) =>
                    onUpdateDefinition(activeTabId, {
                      ...activeDefinition,
                      visualization: event.target.value as ReportDefinition["visualization"]
                    })
                  }
                >
                  {visualizationOptions.map((option) => (
                    <option key={option} value={option}>
                      {resolveVisualizationLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Objeto de negocio</span>
                <div className="reports-builder-input-with-action">
                  <input
                    type="text"
                    readOnly
                    value={resolveBaseLabel(catalog, activeDefinition.base)}
                  />
                  <button
                    className="icon-button"
                    onClick={() => setLookupState({ kind: "base" })}
                    type="button"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </label>
              <label className="field">
                <span>Indicador</span>
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
            </div>

            <div className="reports-builder-grid reports-builder-grid-4">
              <label className="field">
                <span>Calculo</span>
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
                      {resolveMetricOperationLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Campo do indicador</span>
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
                  {catalogFields
                    .filter((field) => field.bases.includes(activeDefinition.base))
                    .map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                <span>Agrupar / quebrar por</span>
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
                  {groupableOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Descricao</span>
                <input
                  type="text"
                  value={activeDefinition.description ?? ""}
                  onChange={(event) =>
                    onUpdateDefinition(activeTabId, {
                      ...activeDefinition,
                      description: event.target.value
                    })
                  }
                />
              </label>
            </div>

            <div className="reports-builder-grid reports-builder-grid-4">
              <label className="field">
                <span>Relacionar com</span>
                <select
                  disabled={relationOptions.length === 0}
                  value={activeDefinition.relation?.relationId ?? ""}
                  onChange={(event) => {
                    const relationId = event.target.value;
                    if (!relationId) {
                      onUpdateDefinition(activeTabId, {
                        ...activeDefinition,
                        relation: null
                      });
                      return;
                    }

                    const relation = relationOptions.find((option) => option.id === relationId);
                    if (!relation) {
                      return;
                    }

                    onUpdateDefinition(activeTabId, {
                      ...activeDefinition,
                      relation: {
                        relationId: relation.id,
                        targetBase: relation.targetBase,
                        mode: relation.modes[0] as ReportRelationMode
                      }
                    });
                  }}
                >
                  <option value="">Sem vinculo extra</option>
                  {relationOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Modo do vinculo</span>
                <select
                  disabled={!activeDefinition.relation}
                  value={activeDefinition.relation?.mode ?? "inner"}
                  onChange={(event) =>
                    onUpdateDefinition(activeTabId, {
                      ...activeDefinition,
                      relation: activeDefinition.relation
                        ? {
                            ...activeDefinition.relation,
                            mode: event.target.value as ReportRelationMode
                          }
                        : null
                    })
                  }
                >
                  {resolveRelationModeOptions(
                    relationOptions.find((option) => option.id === activeDefinition.relation?.relationId)
                  ).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Ordenar por</span>
                <select
                  value={sortEditor.field}
                  onChange={(event) =>
                    setSortEditor((current) => ({
                      ...current,
                      field: event.target.value
                    }))
                  }
                >
                  {sortableFields.map((field) => (
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
                      {resolveSortDirectionLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="reports-builder-order-row">
              <label className="field reports-builder-order-priority">
                <span>Ordem</span>
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
              <button className="secondary-button" onClick={handleAddSort} type="button">
                Adicionar ordenacao
              </button>
            </div>

            {activeDefinition.orderBy.length > 0 ? (
              <div className="reports-builder-tree-list">
                {activeDefinition.orderBy
                  .slice()
                  .sort((left, right) => left.priority - right.priority)
                  .map((entry) => (
                    <div className="reports-builder-tree-node" key={entry.id}>
                      <div>
                        <strong>{resolveFieldLabel(catalog, entry.field)}</strong>
                        <span>{resolveSortDirectionLabel(entry.direction)} • ordem {entry.priority}</span>
                      </div>
                      <button className="icon-button" onClick={() => handleRemoveSort(entry.id)} type="button">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="reports-builder-results-panel">
          <div className="reports-builder-results-header">
            <div>
              <h2>{activeTab?.label ?? "Relatorio"}</h2>
            </div>
            {activeTab?.error ? <div className="feedback-banner is-error">{activeTab.error}</div> : null}
            {error ? <div className="feedback-banner is-error">{error}</div> : null}
          </div>

          {!activeTab && !isLoading ? (
            <div className="reports-builder-empty-route">
              <article className="reports-builder-preview-card">
                <h3>Abra um relatorio</h3>
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
                    <label>{resolveResultLabel(item.label)}</label>
                    <strong>{item.value}</strong>
                    <span>{item.helper}</span>
                  </article>
                ))}
              </div>

              <section className="reports-builder-preview-card reports-builder-preview-card-compact">
                <h3>Expressao literal</h3>
                <p>{activeTab.result.previewExpression}</p>
              </section>

              {activeChartModel ? <ReportChart model={activeChartModel} /> : null}
              {!activeChartModel && isChartVisualization(activeTab.definition.visualization) ? (
                <section className="reports-builder-preview-card reports-builder-chart-empty">
                  <h3>Grafico</h3>
                  <p>Esse visual precisa de dados comparaveis no resultado atual. Ajuste o indicador ou o agrupamento e execute novamente.</p>
                </section>
              ) : null}

              {activeTab.result.table ? <ResultsTable table={activeTab.result.table} /> : null}

              <details className="reports-builder-technical-details">
                <summary>Detalhes tecnicos</summary>
                <pre>{payloadPreview}</pre>
              </details>
            </div>
          ) : activeTab && !activeTab.isLoading ? (
            <div className="empty-state">Execute para ver o resultado.</div>
          ) : null}
      </section>

      {isModelsModalOpen ? (
        <Modal
          title="Modelos salvos"
          subtitle="Modelos do sistema e modelos que voce salvou para reutilizar."
          onClose={() => setIsModelsModalOpen(false)}
        >
          <div className="stack-form">
            {systemModels.length > 0 ? (
              <div className="reports-builder-modal-list">
                <div className="reports-builder-section-head">
                  <h3>Modelos do sistema</h3>
                </div>
                {systemModels.map((definition) => (
                  <button
                    className="reports-builder-model-item"
                    key={`${definition.source}:${definition.id}:${definition.code}`}
                    onClick={() => {
                      onOpenSystemDefinition(definition.code);
                      setIsModelsModalOpen(false);
                    }}
                    type="button"
                  >
                    <div>
                      <strong>{definition.name}</strong>
                      <span>{definition.description || "Sem descricao informada."}</span>
                      <span>Sistema • atualizado em {formatRelativeDateTime(definition.updatedAt)}</span>
                    </div>
                    <small>{definition.code}</small>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="reports-builder-modal-list">
              <div className="reports-builder-section-head">
                <h3>Modelos salvos por voce e equipe</h3>
              </div>
              {userModels.length > 0 ? (
                userModels.map((definition) => (
                  <button
                    className="reports-builder-model-item"
                    key={`${definition.source}:${definition.id}:${definition.code}`}
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
                <div className="empty-state">Nenhum modelo salvo pela equipe ainda.</div>
              )}
            </div>
          </div>
        </Modal>
      ) : null}

      {isFilterModalOpen && activeDefinition ? (
        <Modal
          title={`Filtros | ${activeDefinition.name}`}
          subtitle={`Preencha os filtros do objeto de negocio ${resolveBaseLabel(catalog, activeDefinition.base)} e aplique apenas neste relatorio.`}
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
            {filterableFields.length > 0 ? (
              <>
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
                          operator: resolveDefaultOperator(catalog, field),
                          valuePrimary: "",
                          valueSecondary: ""
                        }));
                      }}
                    >
                      {filterableFields.map((field) => (
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
                          operator: event.target.value as ReportOperator,
                          valuePrimary: "",
                          valueSecondary: ""
                        }))
                      }
                    >
                      {(activeField?.operators ?? []).map((operator) => (
                        <option key={operator} value={operator}>
                          {resolveOperatorLabel(operator)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Modo do valor</span>
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

                {renderFilterValueEditor({
                  activeField,
                  activeFieldOptions,
                  canAddLookup,
                  filterEditor,
                  lookupKind: activeField?.lookupKind as LookupKind | undefined,
                  onLookup: (kind) => setLookupState({ kind }),
                  onChangePrimary: (value) =>
                    setFilterEditor((current) => ({
                      ...current,
                      valuePrimary: value
                    })),
                  onChangeSecondary: (value) =>
                    setFilterEditor((current) => ({
                      ...current,
                      valueSecondary: value
                    })),
                  onChangeParameterName: (value) =>
                    setFilterEditor((current) => ({
                      ...current,
                      parameterName: value
                    }))
                })}

                <div className="button-row">
                  <button className="secondary-button" onClick={handleAddCondition} type="button">
                    Adicionar filtro
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
                    <div className="empty-state">Nenhum filtro aplicado ainda.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">Esse objeto de negocio ainda nao tem filtros disponiveis.</div>
            )}
          </div>
        </Modal>
      ) : null}

      {isSaveModalOpen ? (
        <Modal
          title="Salvar modelo"
          subtitle="Sempre cria uma nova definicao reutilizavel, sem sobrescrever o modelo anterior."
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
          subtitle={
            lookupState.kind === "base"
              ? "Selecione o objeto de negocio que deseja analisar."
              : "Selecione um registro para preencher o filtro atual."
          }
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

function createDefaultSortEditor(
  catalog: ReportBuilderCatalog | null,
  definition: ReportDefinition | null
): SortEditorState {
  return {
    field:
      catalog && definition
        ? resolveFirstSortableField(catalog, definition.base)
        : definition?.metric.field ?? "",
    direction: "desc",
    priority: "1"
  };
}

function normalizeDefinitionForBase(
  catalog: ReportBuilderCatalog,
  definition: ReportDefinition,
  nextBase: ReportDefinition["base"]
): ReportDefinition {
  const firstMetricField =
    catalog.fields.find((field) => field.bases.includes(nextBase))?.id ?? definition.metric.field;
  const nextGroupBy = definition.groupBy.filter((groupId) =>
    catalog.groupByOptions.some((option) => option.id === groupId && option.bases.includes(nextBase))
  );
  const nextFilters = definition.filters.filter((node) =>
    node.kind === "condition"
      ? fieldBelongsToBase(catalog, node.field, nextBase)
      : false
  );
  const nextOrderBy = definition.orderBy
    .filter((entry) => fieldBelongsToBase(catalog, entry.field, nextBase))
    .map((entry, index) => ({
      ...entry,
      priority: index + 1
    }));
  const nextRelation = definition.relation &&
      catalog.relationOptions.some(
        (option) =>
          option.id === definition.relation?.relationId &&
          option.base === nextBase &&
          option.targetBase === definition.relation?.targetBase
      )
    ? definition.relation
    : null;

  return {
    ...definition,
    base: nextBase,
    metric: {
      ...definition.metric,
      field: fieldBelongsToBase(catalog, definition.metric.field, nextBase)
        ? definition.metric.field
        : firstMetricField
    },
    relation: nextRelation,
    groupBy: nextGroupBy,
    filters: nextFilters,
    orderBy:
      nextOrderBy.length > 0
        ? nextOrderBy
        : [
            {
              id: createLocalId(),
              field: firstMetricField,
              direction: "desc",
              priority: 1
            }
          ]
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

function resolveOperatorLabel(operator: ReportOperator): string {
  if (operator === "equals") return "Igual a";
  if (operator === "not_equals") return "Diferente de";
  if (operator === "gt") return "Maior que";
  if (operator === "gte") return "Maior ou igual a";
  if (operator === "lt") return "Menor que";
  if (operator === "lte") return "Menor ou igual a";
  if (operator === "between") return "Entre";
  if (operator === "in") return "Dentro da lista";
  if (operator === "not_in") return "Fora da lista";
  if (operator === "contains") return "Contem";
  return "Comeca com";
}

function resolveSortDirectionLabel(direction: ReportSortDirection): string {
  if (direction === "desc" || direction === "largest_first") return "Maior para menor";
  if (direction === "asc" || direction === "smallest_first") return "Menor para maior";
  if (direction === "newest_first") return "Mais recente primeiro";
  if (direction === "oldest_first") return "Mais antigo primeiro";
  if (direction === "za") return "Z para A";
  return "A para Z";
}

function resolveVisualizationLabel(visualization: ReportDefinition["visualization"]): string {
  return visualizationLabels[visualization];
}

function resolveMetricOperationLabel(operation: ReportDefinition["metric"]["operation"]): string {
  return metricOperationLabels[operation];
}

function resolveResultLabel(label: string): string {
  if (label === "Booking") return "Atendimento";
  if (label === "Bookings") return "Atendimentos";
  return label;
}

function resolveLookupColumns(kind: LookupKind): readonly string[] {
  if (kind === "base") {
    return ["Codigo", "Base", "Descricao"];
  }
  if (kind === "service") {
    return ["Codigo", "Descricao", "Auxiliar"];
  }
  if (kind === "professional") {
    return ["Codigo", "Nome", "Auxiliar"];
  }
  return ["Codigo", "Nome", "Telefone"];
}

function resolveBaseLabel(catalog: ReportBuilderCatalog, base: ReportDefinition["base"]): string {
  return catalog.baseOptions.find((option) => option.id === base)?.label ?? base;
}

function resolveRelationModeOptions(
  relation:
    | ReportBuilderCatalog["relationOptions"][number]
    | undefined
): ReadonlyArray<{ readonly value: ReportRelationMode; readonly label: string }> {
  const modes = (relation?.modes ?? ["inner", "left"]).filter(
    (mode): mode is ReportRelationMode => mode === "inner" || mode === "left"
  );
  return modes.map((mode) => ({
    value: mode,
    label:
      mode === "inner"
        ? "Somente quando houver vinculo"
        : "Manter o item principal mesmo sem vinculo"
  }));
}

function mergeReportBuilderCatalog(
  primary: ReportBuilderCatalog | null,
  fallback: ReportBuilderCatalog
): ReportBuilderCatalog {
  if (!primary) {
    return fallback;
  }

  return {
    ...fallback,
    ...primary,
    baseOptions: mergeEntriesById(fallback.baseOptions, primary.baseOptions),
    fields: mergeEntriesById(fallback.fields, primary.fields),
    relationOptions: mergeEntriesById(fallback.relationOptions, primary.relationOptions),
    groupByOptions: mergeEntriesById(fallback.groupByOptions, primary.groupByOptions),
    systemDefinitions: mergeDefinitionsByCode(fallback.systemDefinitions, primary.systemDefinitions)
  };
}

function mergeEntriesById<T extends { readonly id: string }>(
  fallback: readonly T[],
  primary: readonly T[] | undefined
): T[] {
  const orderedIds = new Set<string>();
  const merged = new Map<string, T>();

  for (const entry of fallback) {
    orderedIds.add(entry.id);
    merged.set(entry.id, entry);
  }

  for (const entry of primary ?? []) {
    orderedIds.add(entry.id);
    merged.set(entry.id, {
      ...entry,
      ...(merged.get(entry.id) ?? {})
    } as T);
  }

  return [...orderedIds].map((id) => merged.get(id)).filter((entry): entry is T => Boolean(entry));
}

function mergeDefinitionsByCode(
  fallback: readonly ReportDefinition[],
  primary: readonly ReportDefinition[] | undefined
): ReportDefinition[] {
  const orderedCodes = new Set<string>();
  const merged = new Map<string, ReportDefinition>();

  for (const definition of fallback) {
    orderedCodes.add(definition.code);
    merged.set(definition.code, definition);
  }

  for (const definition of primary ?? []) {
    orderedCodes.add(definition.code);
    merged.set(definition.code, {
      ...definition,
      ...(merged.get(definition.code) ?? {})
    });
  }

  return [...orderedCodes]
    .map((code) => merged.get(code))
    .filter((definition): definition is ReportDefinition => Boolean(definition));
}

function renderFilterValueEditor({
  activeField,
  activeFieldOptions,
  canAddLookup,
  filterEditor,
  lookupKind,
  onLookup,
  onChangePrimary,
  onChangeSecondary,
  onChangeParameterName
}: {
  readonly activeField: ReportCatalogField | null;
  readonly activeFieldOptions: readonly ReportFieldOption[];
  readonly canAddLookup: boolean;
  readonly filterEditor: FilterEditorState;
  readonly lookupKind?: LookupKind;
  readonly onLookup: (kind: LookupKind) => void;
  readonly onChangePrimary: (value: string) => void;
  readonly onChangeSecondary: (value: string) => void;
  readonly onChangeParameterName: (value: string) => void;
}): JSX.Element {
  const inputType = activeField?.type === "date"
    ? "date"
    : activeField?.type === "number"
      ? "number"
      : "text";

  const isMultiEnum = activeField?.type === "enum" && (filterEditor.operator === "in" || filterEditor.operator === "not_in");

  return (
    <div className="reports-builder-grid reports-builder-grid-3">
      <label className="field">
        <span>Valor</span>
        {activeField?.type === "enum" ? (
          isMultiEnum ? (
            <select
              multiple
              value={filterEditor.valuePrimary ? filterEditor.valuePrimary.split(",").filter(Boolean) : []}
              onChange={(event) =>
                onChangePrimary(
                  [...event.target.selectedOptions].map((option) => option.value).join(",")
                )
              }
            >
              {activeFieldOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <select value={filterEditor.valuePrimary} onChange={(event) => onChangePrimary(event.target.value)}>
              <option value="">Selecione</option>
              {activeFieldOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )
        ) : (
          <div className="reports-builder-input-with-action">
            <input
              readOnly={canAddLookup && filterEditor.valueMode === "value"}
              type={inputType}
              value={filterEditor.valuePrimary}
              onChange={(event) => onChangePrimary(event.target.value)}
            />
            {canAddLookup && lookupKind ? (
              <button className="icon-button" onClick={() => onLookup(lookupKind)} type="button">
                <Search className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        )}
      </label>

      {filterEditor.operator === "between" ? (
        <label className="field">
          <span>Ate</span>
          <input
            type={inputType}
            value={filterEditor.valueSecondary}
            onChange={(event) => onChangeSecondary(event.target.value)}
          />
        </label>
      ) : (
        <div />
      )}

      <label className="field">
        <span>Nome do parametro</span>
        <input
          disabled={filterEditor.valueMode !== "parameter"}
          type="text"
          value={filterEditor.parameterName}
          onChange={(event) => onChangeParameterName(event.target.value)}
        />
      </label>
    </div>
  );
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
          {node.connective ? `${node.connective === "AND" ? "E" : "OU"} ` : ""}
          {resolveFieldLabel(catalog, node.field)}
        </strong>
        <span>
          {resolveOperatorLabel(node.operator)} • {resolveValueLabel(node.value)}
          {node.valueMode === "parameter" && node.parameterName ? ` • parametro ${node.parameterName}` : ""}
        </span>
      </div>
      <button className="icon-button" onClick={() => onRemove(node.id)} type="button">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function normalizeVisualization(
  visualization: ReportDefinition["visualization"]
): "kpi" | "kpi_table" | "bar" | "line" | "pie" | "gauge" {
  if (visualization === "ranking") {
    return "bar";
  }
  if (visualization === "time_series") {
    return "line";
  }
  return visualization;
}

function isChartVisualization(visualization: ReportDefinition["visualization"]): boolean {
  const normalized = normalizeVisualization(visualization);
  return normalized === "bar" || normalized === "line" || normalized === "pie" || normalized === "gauge";
}

function buildChartModel(
  definition: ReportDefinition,
  result: ReportExecutionResponse
): ReportChartModel | null {
  const visualization = normalizeVisualization(definition.visualization);
  if (visualization === "kpi" || visualization === "kpi_table") {
    return null;
  }
  if (visualization === "gauge") {
    return buildGaugeChartModel(result);
  }
  const tableModel = buildTableChartModel(visualization, result.table);
  if (tableModel) {
    return tableModel;
  }
  if (visualization === "bar" || visualization === "pie") {
    return buildKpiChartModel(visualization, result);
  }
  return null;
}

function buildTableChartModel(
  kind: "bar" | "line" | "pie",
  table: ReportExecutionTable | undefined
): ReportChartModel | null {
  if (!table || table.rows.length === 0 || table.columns.length < 2) {
    return null;
  }

  const numericColumns = analyzeNumericColumns(table);
  if (numericColumns.length === 0) {
    return null;
  }

  const categories = table.rows.map((row) => String(row.cells[0]));
  const title = kind === "pie" ? "Distribuicao do resultado" : kind === "line" ? "Evolucao do resultado" : "Comparativo do resultado";

  if (kind === "pie") {
    const mainColumn = numericColumns[0];
    return {
      kind: "pie",
      title,
      format: mainColumn.format,
      slices: categories.map((label, index) => ({
        id: `${mainColumn.label}:${index}`,
        label,
        value: mainColumn.values[index] ?? 0,
        color: chartPalette[index % chartPalette.length]
      }))
    };
  }

  const selectedColumns = kind === "line" ? numericColumns.slice(0, 3) : numericColumns.slice(0, 2);
  return {
    kind,
    title,
    format: selectedColumns[0]?.format ?? "count",
    categories,
    series: selectedColumns.map((column, index) => ({
      id: column.label,
      label: column.label,
      values: column.values,
      color: chartPalette[index % chartPalette.length]
    }))
  };
}

function buildKpiChartModel(
  kind: "bar" | "pie",
  result: ReportExecutionResponse
): ReportChartModel | null {
  const numericKpis = result.kpis
    .map((item, index) => {
      const parsed = parseChartNumber(item.value);
      if (!parsed) {
        return null;
      }
      return {
        id: item.id || `kpi-${index}`,
        label: resolveResultLabel(item.label),
        value: parsed.value,
        format: parsed.format
      };
    })
    .filter((item): item is { id: string; label: string; value: number; format: ChartValueFormat } => Boolean(item));

  if (numericKpis.length < 2) {
    return null;
  }

  const format = numericKpis[0]?.format ?? "count";
  if (kind === "pie") {
    return {
      kind: "pie",
      title: "Distribuicao dos indicadores",
      format,
      slices: numericKpis.map((item, index) => ({
        id: item.id,
        label: item.label,
        value: item.value,
        color: chartPalette[index % chartPalette.length]
      }))
    };
  }

  return {
    kind: "bar",
    title: "Comparativo dos indicadores",
    format,
    categories: numericKpis.map((item) => item.label),
    series: [
      {
        id: "Indicadores",
        label: "Indicadores",
        values: numericKpis.map((item) => item.value),
        color: chartPalette[0]
      }
    ]
  };
}

function buildGaugeChartModel(result: ReportExecutionResponse): ReportChartModel | null {
  const occupiedKpi = findKpiByLabel(result, /(horas ocupadas|ocupado)/i);
  const capacityKpi = findKpiByLabel(result, /(capacidade total|capacidade)/i);
  if (occupiedKpi && capacityKpi && capacityKpi.value > 0) {
    return {
      kind: "gauge",
      title: "Ocupacao da capacidade",
      format: occupiedKpi.format,
      value: occupiedKpi.value,
      maxValue: capacityKpi.value,
      helper: `${formatChartValue((occupiedKpi.value / capacityKpi.value) * 100, "percent")} da capacidade usada`
    };
  }

  const percentKpi = result.kpis.find((item) => parseChartNumber(item.value)?.format === "percent");
  if (!percentKpi) {
    return null;
  }
  const parsed = parseChartNumber(percentKpi.value);
  if (!parsed) {
    return null;
  }
  return {
    kind: "gauge",
    title: resolveResultLabel(percentKpi.label),
    format: "percent",
    value: parsed.value,
    maxValue: 100,
    helper: percentKpi.helper ?? undefined
  };
}

function findKpiByLabel(
  result: ReportExecutionResponse,
  pattern: RegExp
): { readonly value: number; readonly format: ChartValueFormat } | null {
  for (const item of result.kpis) {
    if (!pattern.test(item.label)) {
      continue;
    }
    const parsed = parseChartNumber(item.value);
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

function analyzeNumericColumns(
  table: ReportExecutionTable
): ReadonlyArray<NumericChartColumn> {
  const minimumValidRows = Math.max(1, Math.floor(table.rows.length * 0.6));
  const columns = table.columns
    .map((column, index) => {
      if (index === 0) {
        return null;
      }
      const parsedValues = table.rows.map((row) => parseChartNumber(row.cells[index]));
      const validValues = parsedValues.filter((entry): entry is ParsedChartNumber => Boolean(entry));
      if (validValues.length < minimumValidRows) {
        return null;
      }
      const nextColumn: NumericChartColumn = {
        index,
        label: resolveResultLabel(column.label),
        values: parsedValues.map((entry) => entry?.value ?? 0),
        format: detectColumnFormat(resolveResultLabel(column.label), validValues.map((entry) => entry.format)),
        score: scoreColumnForChart(resolveResultLabel(column.label), index)
      };
      return nextColumn;
    })
    .filter((column): column is NumericChartColumn => column !== null);

  return columns.sort((left, right) => right.score - left.score || left.index - right.index);
}

function detectColumnFormat(label: string, formats: readonly ChartValueFormat[]): ChartValueFormat {
  const lowered = label.toLowerCase();
  if (lowered.includes("receita") || lowered.includes("valor") || lowered.includes("faturamento") || lowered.includes("preco")) {
    return "currency";
  }
  if (lowered.includes("capacidade") || lowered.includes("ocupado") || lowered.includes("livre")) {
    return "hours";
  }
  if (lowered.includes("taxa") || lowered.includes("%")) {
    return "percent";
  }
  const first = formats[0];
  return first ?? "count";
}

function scoreColumnForChart(label: string, index: number): number {
  const lowered = label.toLowerCase();
  let score = Math.max(0, 10 - index);
  if (lowered.includes("metrica")) score += 40;
  if (lowered.includes("receita") || lowered.includes("valor") || lowered.includes("faturamento") || lowered.includes("preco")) score += 32;
  if (lowered.includes("capacidade") || lowered.includes("ocupado") || lowered.includes("livre")) score += 26;
  if (lowered.includes("quantidade") || lowered.includes("atendimentos") || lowered.includes("pagamentos") || lowered.includes("clientes")) score += 20;
  return score;
}

function parseChartNumber(cell: string | number): ParsedChartNumber | null {
  if (typeof cell === "number" && Number.isFinite(cell)) {
    return { value: cell, format: "count" };
  }

  const raw = String(cell ?? "").trim();
  if (!raw || raw === "-" || raw.toLowerCase() === "n/d") {
    return null;
  }

  if (raw.includes("R$")) {
    const parsed = parseLocaleNumber(raw);
    return Number.isFinite(parsed) ? { value: parsed, format: "currency" } : null;
  }

  const hourMatch = raw.match(/^(\d+)h(?:(\d{1,2}))?$/i);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    const minutes = Number(hourMatch[2] ?? "0");
    return { value: hours + minutes / 60, format: "hours" };
  }

  const minutesMatch = raw.match(/^(\d+)\s*min$/i);
  if (minutesMatch) {
    return { value: Number(minutesMatch[1]), format: "minutes" };
  }

  if (raw.endsWith("%")) {
    const parsed = parseLocaleNumber(raw.slice(0, -1));
    return Number.isFinite(parsed) ? { value: parsed, format: "percent" } : null;
  }

  const parsed = parseLocaleNumber(raw);
  return Number.isFinite(parsed) ? { value: parsed, format: "count" } : null;
}

function parseLocaleNumber(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, "");
  if (!cleaned) {
    return Number.NaN;
  }
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  return Number(normalized);
}

function formatChartValue(value: number, format: ChartValueFormat): string {
  if (format === "currency") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2
    }).format(value);
  }
  if (format === "percent") {
    return `${Math.round(value)}%`;
  }
  if (format === "hours") {
    const totalMinutes = Math.round(value * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, "0")}`;
  }
  if (format === "minutes") {
    return `${Math.round(value)} min`;
  }
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatTooltipValue(format: ChartValueFormat) {
  return (value: string | number | readonly (string | number)[] | undefined): string => {
    const source = Array.isArray(value) ? value[0] : value;
    return formatChartValue(Number(source ?? 0), format);
  };
}

function ReportChart({ model }: { readonly model: ReportChartModel }): JSX.Element {
  if (model.kind === "pie") {
    return (
      <section className="reports-builder-preview-card reports-builder-chart-card">
        <h3>{model.title}</h3>
        <div className="reports-builder-chart-frame">
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={model.slices}
                dataKey="value"
                nameKey="label"
                innerRadius={64}
                outerRadius={112}
                paddingAngle={2}
              >
                {model.slices.map((slice) => (
                  <Cell fill={slice.color} key={slice.id} />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltipValue(model.format)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    );
  }

  if (model.kind === "gauge") {
    const percent = model.maxValue > 0 ? Math.min(100, (model.value / model.maxValue) * 100) : 0;
    return (
      <section className="reports-builder-preview-card reports-builder-chart-card">
        <h3>{model.title}</h3>
        <div className="reports-builder-gauge-wrap">
          <div className="reports-builder-chart-frame reports-builder-chart-frame-gauge">
            <ResponsiveContainer width="100%" height={280}>
              <RadialBarChart
                cx="50%"
                cy="75%"
                innerRadius="58%"
                outerRadius="100%"
                barSize={20}
                data={[{ name: "Valor", value: percent }]}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" fill={chartPalette[0]} cornerRadius={16} />
                <Tooltip formatter={formatTooltipValue("percent")} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="reports-builder-gauge-copy">
            <strong>{formatChartValue(model.value, model.format)}</strong>
            <span>{model.helper ?? `Limite ${formatChartValue(model.maxValue, model.format)}`}</span>
          </div>
        </div>
      </section>
    );
  }

  const data = model.categories.map((category, index) =>
    model.series.reduce<Record<string, string | number>>(
      (current, series) => ({
        ...current,
        category,
        [series.id]: series.values[index] ?? 0
      }),
      { category }
    )
  );

  return (
    <section className="reports-builder-preview-card reports-builder-chart-card">
      <h3>{model.title}</h3>
      <div className="reports-builder-chart-frame">
        <ResponsiveContainer width="100%" height={340}>
          {model.kind === "bar" ? (
            <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7edf6" />
              <XAxis dataKey="category" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value: number) => formatChartValue(Number(value), model.format)} />
              <Tooltip formatter={formatTooltipValue(model.format)} />
              {model.series.map((series) => (
                <Bar
                  dataKey={series.id}
                  fill={series.color}
                  key={series.id}
                  name={series.label}
                  radius={[10, 10, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7edf6" />
              <XAxis dataKey="category" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value: number) => formatChartValue(Number(value), model.format)} />
              <Tooltip formatter={formatTooltipValue(model.format)} />
              {model.series.map((series) => (
                <Line
                  dataKey={series.id}
                  dot={false}
                  key={series.id}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={3}
                  type="monotone"
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
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
                  <th key={column.id}>{resolveResultLabel(column.label)}</th>
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

