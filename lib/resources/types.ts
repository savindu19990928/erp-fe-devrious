export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "decimal"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "json"
  | "password"
  | "relation"
  | "lines"
  | "file";

export interface SelectOption {
  value: string;
  label: string;
}

export interface LineColumnDef {
  name: string;
  label: string;
  type: "text" | "number" | "decimal" | "boolean" | "select" | "relation";
  required?: boolean;
  defaultValue?: unknown;
  options?: SelectOption[];
  relationEndpoint?: string;
  relationLabelKey?: string;
  relationSecondaryKey?: string;
  placeholder?: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  defaultValue?: unknown;
  placeholder?: string;
  helpText?: string;
  options?: SelectOption[];
  relationEndpoint?: string;
  relationLabelKey?: string;
  relationSecondaryKey?: string;
  lineColumns?: LineColumnDef[];
  autoFillContext?: "tenant" | "company" | "branch";
  fullWidth?: boolean;
  hideOnEdit?: boolean;
}

export type ColumnFormat =
  | "text"
  | "currency"
  | "number"
  | "date"
  | "datetime"
  | "badge"
  | "boolean"
  | "code";

export interface ColumnDef {
  key: string;
  label: string;
  format?: ColumnFormat;
  currencyKey?: string;
  align?: "left" | "right";
}

export interface RowActionDef {
  key: string;
  label: string;
  endpointSuffix: string;
  method?: "POST" | "GET";
  variant?: "primary" | "secondary" | "outline" | "danger";
  fields?: FieldDef[];
  confirmMessage?: string;
  showResultModal?: boolean;
  resultTitle?: string;
  isVisible?: (row: Record<string, unknown>) => boolean;
}

export interface CollectionActionDef {
  key: string;
  label: string;
  endpointSuffix: string;
  method?: "POST" | "GET";
  variant?: "primary" | "secondary" | "outline" | "danger";
  fields?: FieldDef[];
  confirmMessage?: string;
  showResultModal?: boolean;
  resultTitle?: string;
}

export interface ResourceConfig {
  id: string;
  title: string;
  singularTitle: string;
  description: string;
  endpoint: string;
  searchPlaceholder?: string;
  readOnly?: boolean;
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  multipart?: boolean;
  columns: ColumnDef[];
  fields: FieldDef[];
  rowActions?: RowActionDef[];
  collectionActions?: CollectionActionDef[];
  defaultFilters?: Record<string, string | number>;
}
