export type ErpRole =
  | "PLATFORM_ADMIN"
  | "SYSTEM_ADMIN"
  | "COMPANY_MANAGER"
  | "BRANCH_MANAGER"
  | "ACCOUNTANT"
  | "CASHIER"
  | "INVENTORY_CLERK"
  | "WAREHOUSE_MANAGER"
  | "PROCUREMENT_OFFICER"
  | "FLEET_MANAGER"
  | "DRIVER"
  | "MECHANIC"
  | "SALES_CLERK"
  | "HR_MANAGER"
  | "EMPLOYEE"
  | "SUPPORT_AGENT"
  | "CUSTOMER_PORTAL"
  | "SUPPLIER_PORTAL"
  | "AUDITOR";

export interface PaginatedResponse<T = Record<string, unknown>> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserProfile {
  id: number;
  public_id?: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  tenant: number | null;
  tenant_name?: string;
  company: number | null;
  company_name?: string;
  branch: number | null;
  branch_name?: string;
  role: ErpRole | string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_banned?: boolean;
  banned_reason?: string;
  is_suspended?: boolean;
  suspended_until?: string | null;
  two_factor_enabled?: boolean;
  must_change_password?: boolean;
  last_login?: string | null;
  date_joined?: string;
}

export interface Tenant {
  id: number;
  public_id?: string;
  name: string;
  slug: string;
  owner_name: string;
  owner_email: string;
  owner_phone?: string;
  tax_id?: string;
  br_number?: string;
  address?: string;
  country?: string;
  subscription_plan: number | null;
  subscription_plan_name?: string;
  enabled_modules?: Record<string, boolean>;
  subscription_status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "DISCONTINUED" | string;
  is_service_active: boolean;
  billing_start_date?: string;
  last_payment_date?: string | null;
  next_payment_due_date?: string | null;
  auto_discontinue_months?: number;
  auto_discontinue_cutoff_date?: string | null;
  days_overdue?: number;
  is_overdue_for_discontinuation?: boolean;
  discontinued_at?: string | null;
  discontinued_reason?: string;
  is_banned: boolean;
  banned_reason?: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  code: string;
  description?: string;
  billing_cycle: "MONTHLY" | "QUARTERLY" | "YEARLY" | string;
  price: string;
  currency: string;
  included_modules?: Record<string, boolean>;
  max_companies: number;
  max_branches: number;
  max_users: number;
  is_active: boolean;
}

export interface Company {
  id: number;
  tenant: number;
  name: string;
  code: string;
  legal_name?: string;
  br_number?: string;
  tin_number?: string;
  vat_reg_number?: string;
  svat_number?: string;
  is_vat_registered?: boolean;
  base_currency: string;
  language?: string;
  fiscal_year_start_month?: number;
  default_vat_rate?: string;
  default_nbt_rate?: string;
  round_to_nearest_rupee?: boolean;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

export interface Branch {
  id: number;
  tenant: number;
  company: number;
  name: string;
  code: string;
  branch_type: string;
  address?: string;
  city?: string;
  phone?: string;
  store_hours?: string;
  is_active: boolean;
}

export interface NotificationItem {
  id: number;
  recipient_address?: string;
  channel: string;
  subject: string;
  message: string;
  status: string;
  related_model?: string;
  related_object_id?: string;
  created_at: string;
}

export interface FinanceStatements {
  trial_balance: Array<{
    code: string;
    name: string;
    account_type: string;
    balance: string;
  }>;
  income_statement_pnl: {
    total_revenue: string;
    total_expenses: string;
    net_profit_or_loss: string;
  };
  balance_sheet: {
    total_assets: string;
    total_liabilities: string;
    total_equity_plus_current_profit: string;
  };
  aging_summary: {
    accounts_receivable_outstanding: string;
    accounts_payable_outstanding: string;
  };
  sri_lanka_ird_vat_200_return?: Record<string, string | number>;
}

export interface EpfCalculatorResult {
  basic_salary: string;
  allowances: string;
  gross_salary: string;
  epf_employee_8_percent: string;
  epf_employer_12_percent: string;
  etf_employer_3_percent: string;
  apit_tax: string;
  net_salary: string;
}

export interface UniversalScanResult {
  matched_type: string;
  batch_serial?: Record<string, unknown> | null;
  product?: Record<string, unknown> | null;
  variant?: Record<string, unknown> | null;
  bin_location?: Record<string, unknown> | null;
  quantity?: string | number;
  bin_location_path?: string;
}
