# All-in-One ERP System — Functional Requirements Specification

## Table of Contents

- [Product Scope and Principles](#product-scope-and-principles)  
- [Technical Stack and Platform Architecture](#technical-stack-and-platform-architecture)  
- [Actors and Roles](#actors-and-roles)  
- [Shared Platform Requirements (ERP-PLAT)](#shared-platform-requirements-erp-plat)  
  - [Tenant/Company/Branch Structure](#tenantcompanybranch-structure)  
  - [SaaS Subscription Billing, Admin-Recorded Payments & 2-Month Auto-Discontinuation](#saas-subscription-billing-admin-recorded-payments--2-month-auto-discontinuation)  
  - [Identity, Authentication, User Management, Customer Banning & Granular Permissions](#identity-authentication-user-management-customer-banning--granular-permissions)  
  - [Workflow, Approvals, and Notifications](#workflow-approvals-and-notifications)  
  - [Audit, Logging, and Security](#audit-logging-and-security)  
  - [Document and Data Management](#document-and-data-management)  
  - [Reporting and Analytics Services](#reporting-and-analytics-services)  
  - [Configuration and Localization](#configuration-and-localization)  
  - [Integration & APIs (REST, Swagger/OpenAPI & Jazzmin Admin)](#integration--apis-rest-swaggeropenapi--jazzmin-admin)  
- [Functional Modules](#functional-modules)  
  - [Finance & Accounting (ERP-FIN)](#finance--accounting-erp-fin)  
  - [Human Resources & Payroll (ERP-HR)](#human-resources--payroll-erp-hr)  
  - [Customer Support / Service Desk (ERP-SD)](#customer-support--service-desk-erp-sd)  
  - [Retail & Inventory Management (ERP-INV / STK / FLT / POS / ECOM)](#retail--inventory-management-erp-inv--stk--flt--pos--ecom)  
    - [Point of Sale (ERP-POS)](#point-of-sale-erp-pos)  
    - [Advanced Stock, Inventory, Warehousing & Procurement (ERP-INV & STK-01 to STK-45)](#advanced-stock-inventory-warehousing--procurement-erp-inv--stk-01-to-stk-45)  
    - [Fleet and Transportation Management (ERP-INV-FLEET & FLT-01 to FLT-42)](#fleet-and-transportation-management-erp-inv-fleet--flt-01-to-flt-42)  
    - [E-commerce (ERP-ECOM)](#e-commerce-erp-ecom)  
- [Roles and Permissions Matrix (Inventory, Warehouse & Fleet)](#roles-and-permissions-matrix-inventory-warehouse--fleet)  
- [Core Data Entities and Business Rules](#core-data-entities-and-business-rules)  
- [End-to-End Workflows](#end-to-end-workflows)  
- [Reporting Requirements](#reporting-requirements)  
- [Security, Privacy, and Audit](#security-privacy-and-audit)  
- [Sri Lanka Localization and Compliance (ERP-SL)](#sri-lanka-localization-and-compliance-erp-sl)  
- [Module Priorities (MVP / Phase 2 / Phase 3 / Phase 4)](#module-priorities-mvp--phase-2--phase-3--phase-4)  
- [Acceptance Criteria / Checklist](#acceptance-criteria--checklist)  
- [Open Questions and Assumptions](#open-questions-and-assumptions)  
- [Source Traceability](#source-traceability)  

---

## Product Scope and Principles

This document specifies the functional requirements for an **All-in-One ERP** system designed for multi-branch retailers, distributors, logistics operators, and SMEs. The ERP combines **SaaS Tenant Subscription & Billing Management**, **Retail Business Management** (including POS, hierarchical warehouse inventory, procurement, MRP, fleet/transport, and e-commerce), **Accounting & Finance**, **Human Resources & Payroll (HRMS)**, and **Customer Support/Helpdesk** into a unified SaaS platform. The core principles include:

- **Integration and Single Source of Truth:** Shared master data (customers, suppliers, products, UOMs, employees, stock, warehouse locations, fleet vehicles, drivers, orders, payments) shall be maintained so all modules reference a single source of truth. For example, a customer created in Sales (POS/E-commerce) is the same entity used in Finance and Support, and a driver in Fleet is linked directly to their HR Employee record.
- **Modular Subscription Model & SaaS Billing Enforcement:** Customers who buy an account on the ERP system can enable or disable modules independently (e.g., Platform, Finance, HR, Service Desk, Retail POS, Inventory, Fleet, E-commerce) as per their subscription plan. Customer payments are verified and recorded by the Platform Administrator. If a customer's subscription payment becomes overdue by **2 or more months**, their ERP services are **automatically discontinued** until payment is recorded by an administrator. The platform also gracefully handles workflows when optional modules are disabled (for instance, if Finance is disabled, POS orders record provisional receipts without General Ledger posting).
- **Multi-Tenancy and Scalability:** The system is a SaaS product supporting multiple tenants (ERP customer organizations) with isolated data. Each tenant may have multiple legal entities or companies, and each company can have multiple regions, sub-regions, branches, warehouses, zones, and bins. Features like chart of accounts, tax settings, and reporting accommodate multi-company and multi-currency consolidation.
- **Configurable and Localizable:** The system supports local (Sri Lankan) settings and allows configuration for different markets. This includes currency (`LKR`, `USD`, `GBP`, etc.), language (English, Sinhala, Tamil), date formats, fiscal year calendar (April–March or January–December), per company.
- **User-Friendly and Workflows:** Interfaces and APIs support defined workflows (e.g., requisition→RFQ/PO→GRN→QC/Put-away→pick/pack/ship→POD→invoice), with in-built validation, approval processes, three-way matching, and immutable audit trails.
- **Compliance and Standards:** The system embeds local compliance (Sri Lanka) for taxes (18% VAT, SVAT, 2% NBT, withholding tax, RAMIS e-invoicing, EPF 12%/8%, ETF 3%, APIT progressive tax tables, gratuity) and adheres to strict data protection and security best practices (JWT authentication, RBAC + granular object/module permissions, customer/user/tenant banning, and immutable audit logs).

---

## Technical Stack and Platform Architecture

- **Backend Framework:** Django 6.1.x & Django REST Framework (DRF 3.18.x).
- **Database:** MySQL (`utf8mb4`, InnoDB, connection health checks, strict transactional integrity with `transaction.atomic()` and row locking via `select_for_update()`).
- **Admin Console:** **Django Jazzmin** (`/admin/`) with custom bulk actions for recording customer subscription payments, running the 2-month overdue auto-discontinuation check, and banning/unbanning tenants, users, and customers.
- **API Documentation:** **Swagger UI** (`/api/docs/` and `/swagger/`), **ReDoc** (`/api/redoc/`), and **OpenAPI 3 Schema** (`/api/schema/`) powered by `drf-spectacular`, plus static reference documentation in [API_DOCUMENTATION.md](file:///c:/Users/User/Desktop/erp_devrious/API_DOCUMENTATION.md).
- **Authentication:** JWT Bearer tokens (`djangorestframework-simplejwt` with token rotation and blacklisting) for REST API clients and Django Session Authentication for Jazzmin Admin and interactive Swagger browsing.

---

## Actors and Roles

The ERP system shall support the following user roles (`User.Role`):

- **SaaS Platform Super Administrator (`PLATFORM_ADMIN`):** Global SaaS administrator who manages subscription plans, onboards ERP customer accounts (tenants), records customer subscription payments, runs or oversees 2-month overdue service auto-discontinuation, and bans/unbans tenant accounts.
- **System Administrator (`SYSTEM_ADMIN` / ERP-PLAT-001):** Tenant-level administrator who configures companies, branches, modules, and system-wide settings. Manages role-based access, user accounts (including banning/suspending staff or customers), defines approval workflows, and performs maintenance tasks.
- **Company Manager (`COMPANY_MANAGER` / ERP-PLAT-002):** Managerial role for a specific company. Views consolidated data across branches, approves high-value transactions, and configures company settings.
- **Branch Manager (`BRANCH_MANAGER` / ERP-PLAT-002):** Managerial role for a specific branch/store. Views branch data and reports, approves branch-level transactions, and configures store hours.
- **Accountant / Finance User (`ACCOUNTANT` / ERP-FIN):** Handles bookkeeping, bank reconciliation, tax filings (VAT 200, RAMIS), ledgers, fixed assets, budgets, and financial reporting. Has permissions for GL, AP, AR, and all accounting entries.
- **Cashier / POS Operator (`CASHIER` / ERP-POS):** Handles point-of-sale transactions, cash drawer shifts, barcode scanning, returns/voids, and payment processing in their branch.
- **Inventory / Warehouse Clerk (`INVENTORY_CLERK` / ERP-INV & STK):** Manages stock movements (receipts, put-away, cycle counts, picking/packing, adjustments) at warehouses or stores.
- **Warehouse Manager (`WAREHOUSE_MANAGER` / STK):** Oversees all warehouse operations, hierarchical locations (regions, sub-regions, zones, bins), stock transfers, quarantine QC releases, batch recalls, and wave picking.
- **Procurement Officer (`PROCUREMENT_OFFICER` / ERP-INV & STK):** Manages purchase requisitions, RFQs/tenders, supplier bids, long-term supplier contracts, purchase orders, and three-way matching.
- **Fleet & Transport Manager (`FLEET_MANAGER` / FLT):** Manages fleet vehicles, trailers/equipment, compliance documents, driver assignments, route optimization, live GPS telematics/geofences, maintenance scheduling, fuel card reconciliation, 3PL carriers, and Fleet TCO analytics.
- **Fleet Driver / Operator (`DRIVER` / FLT):** Receives dispatch trips, performs pre/post-trip Digital Vehicle Inspections (DVIR), logs ELD/HOS driving hours, and captures electronic Proof of Delivery (POD) with offline mobile sync support.
- **Fleet Maintenance Mechanic (`MECHANIC` / FLT):** Accesses vehicle maintenance schedules, diagnostic trouble code (DTC) alerts, and repair work orders, recording labor hours and spare parts consumed.
- **Sales / E-Commerce Order Clerk (`SALES_CLERK` / ERP-RET & ECOM):** Manages online e-commerce orders, back-office sales orders, pick-list routing, invoicing, and online return/refund processing.
- **HR Manager (`HR_MANAGER` / ERP-HR):** Maintains employee records, attendance, leave approvals, monthly payroll runs, statutory contributions (EPF/ETF/APIT), gratuity, recruitment, and statutory HR reports (Form IRD 7).
- **Employee (`EMPLOYEE` / ERP-HR):** Regular staff member who accesses the employee self-service portal (payslips, leave balances, leave applications, attendance, and tool checkouts).
- **Support Agent / Helpdesk User (`SUPPORT_AGENT` / ERP-SD):** Manages customer support tickets, SLA response/resolution tracking, escalations, knowledge base articles, and refund credit note requests.
- **Customer Portal User (`CUSTOMER_PORTAL`):** End user of the customer portal to view orders/invoices, submit support tickets, track warranties/RMAs, and search the knowledge base.
- **Supplier Portal User (`SUPPLIER_PORTAL`):** External supplier portal user to view RFQs, submit bids, track POs, and monitor consignment stock.
- **Auditor / Compliance Officer (`AUDITOR`):** Internal or external auditor with strictly enforced read-only (`GET`/`HEAD`/`OPTIONS`) access to all transactions, immutable audit logs, and compliance reports.

---

## Shared Platform Requirements (ERP-PLAT)

### Tenant/Company/Branch Structure

- **ERP-PLAT-001:** The system shall support a **multi-tenant architecture**: multiple distinct tenants (companies/clients) with complete data isolation (`TenantScopedQuerysetMixin`). Each tenant has its own isolated data space (ledgers, customers, stock, employees) while sharing the application instance.  
- **ERP-PLAT-002:** Within each tenant, the system shall allow creation of multiple **companies** (for accounting consolidation or separate legal books) and **branches** (for retail stores, warehouses, head offices, or hybrid sites) with shared master data. A branch is associated with one company. The chart of accounts and general ledgers are maintained at the **company** level.  
- **ERP-PLAT-003:** The system shall support multi-branch inventory and multi-site operations: stock is tracked and transferred between branches and hierarchical warehouse locations, and sales/orders/purchases are tied to a branch location.  
- **ERP-PLAT-004:** The system shall enable a hierarchical view and reporting: branch-level managers see their own branch data, company managers see consolidated data across branches, and platform super-administrators see all tenants.  

### SaaS Subscription Billing, Admin-Recorded Payments & 2-Month Auto-Discontinuation

- **ERP-PLAT-SUB-001 (Subscription Plans & Customer Onboarding):** The system shall maintain configurable SaaS `SubscriptionPlan` tiers defining billing cycles (`MONTHLY`, `QUARTERLY`, `YEARLY`), pricing, limits (`max_companies`, `max_branches`, `max_users`), and `included_modules`. Customers buying an account on the ERP system can register via `/api/auth/register-erp-account/`.
- **ERP-PLAT-SUB-002 (Admin-Recorded Customer Payments):** When an ERP customer (Tenant) pays for their ERP subscription, the payment **must be recorded by a Platform Administrator** (`POST /api/platform/tenants/{id}/record-payment/` or via the Jazzmin Admin panel). Recording a payment creates an auditable `SubscriptionPayment` receipt, updates `last_payment_date`, extends `next_payment_due_date` by the number of months paid, and automatically restores any `PAST_DUE` or `DISCONTINUED` tenant account to `ACTIVE` (`is_service_active = True`), provided the tenant is not banned.
- **ERP-PLAT-SUB-003 (Auto-Discontinuing Services After 2 Months Payment Due):** The system shall automatically discontinue ERP services for any customer tenant whose subscription payment is overdue by **2 or more months** (`next_payment_due_date + 2 months <= today`):
  - If payment is past due by less than 2 months, the tenant's status transitions to `PAST_DUE` (within the 2-month grace period) while keeping services operational.
  - Once payment is overdue by **2 or more months**, the system automatically transitions the tenant to `subscription_status = 'DISCONTINUED'` and `is_service_active = False`, records `discontinued_at` and `discontinued_reason`, logs an `AuditLog` and `UserActivityLog`, sends a `Notification`, and blocks all tenant API requests with `403 Forbidden`.
  - Auto-discontinuation is enforced continuously via `TenantSubscriptionEnforcementMiddleware`, DRF permission `IsActiveTenantAndUser`, batch endpoint `POST /api/platform/tenants/enforce-overdue/`, per-tenant check `POST /api/platform/tenants/{id}/check-overdue/`, CLI command `python manage.py check_overdue_subscriptions`, and Jazzmin Admin bulk action.

### Identity, Authentication, User Management, Customer Banning & Granular Permissions

- **ERP-PLAT-005:** The system shall support secure **user authentication** (JWT access/refresh tokens with blacklisting, password validation policies, optional 2FA flag, failed login tracking, and forced password reset) and maintain unique user accounts.  
- **ERP-PLAT-006:** The system shall provide a hybrid **Role-Based Access Control (RBAC) and Granular Permission (`GranularPermission`)** model. Permissions can be granted at the module, model, or specific object ID level (`can_view`, `can_add`, `can_change`, `can_delete`, `can_approve`, `can_delegate`) using a MySQL-safe global sentinel (`object_id = 0`).  
- **ERP-PLAT-007:** The system shall allow **controlled permission delegation and workflows**: non-admin staff holding `can_delegate=True` can delegate a subset of their permissions to users of the same tenant without privilege escalation, self-granting, or scope widening.  
- **ERP-PLAT-008:** The system shall allow **user-level temporary overrides** (`is_temporary_override=True` with `expires_at` timestamp) granted by administrators.  
- **ERP-PLAT-009:** The system shall maintain a **centralized user directory** per tenant, linking `Employee`, `DriverProfile`, `Customer`, and `Supplier` records to `User` accounts for single sign-on across modules.  
- **ERP-PLAT-USR-001 (Complete User & Customer Management & Banning):** Administrators shall have full user and customer lifecycle management:
  - **Ban / Unban Tenant Organizations (`Tenant`):** `POST /api/platform/tenants/{id}/ban/` and `/unban/` with reason, actor, and timestamp; immediately blocks all users of the banned tenant (`403 Forbidden`).
  - **Ban / Unban Individual Users (`User`):** `POST /api/users/{id}/ban/` and `/unban/` with reason, actor, and timestamp; blocks the banned user from all endpoints.
  - **Temporary User Suspension:** `POST /api/users/{id}/suspend/` (with optional `suspended_until` auto-expiry) and `/unsuspend/`.
  - **Role Changes & Password Resets:** `POST /api/users/{id}/change-role/` and `POST /api/users/{id}/force-password-reset/`.
  - **Ban / Unban Retail/ERP Customers (`Customer`):** `POST /api/customers/{id}/ban/` and `/unban/` (also bans any linked customer portal user and blocks invoicing, POS orders, and e-commerce checkouts for that customer).

### Workflow, Approvals, and Notifications

- **ERP-PLAT-010:** The system shall support configurable **workflows and approval chains** (`ApprovalRule`, `ApprovalRequest`) for critical transactions (purchase orders, payments, stock write-offs, credit notes, etc.) based on minimum amount thresholds and required roles.  
- **ERP-PLAT-011:** The system shall generate **alerts and notifications** (`Notification`) via in-app, email, or SMS channels when actions or exceptions occur (pending approvals, low stock, expiring batches, cold-chain temperature breaches, overdue tools, SLA escalations, vehicle compliance expiries, subscription discontinuation).  
- **ERP-PLAT-012:** The system shall maintain a **task queue** (`/api/workflows/requests/`) for pending approvals filterable by required role and status (`PENDING`, `APPROVED`, `REJECTED`).  
- **ERP-PLAT-013:** The system shall allow **escalations and SLAs**: for customer support tickets, set target response and resolution times and automatically escalate if 75% of the SLA window elapses or deadlines pass.  
- **ERP-PLAT-014:** The system shall support **automated recurring and batch workflows** (monthly payroll runs, asset depreciation runs, auto-replenishment requisitions, ABC/XYZ classification, and overdue subscription checks).  

### Audit, Logging, and Security

- **ERP-PLAT-015:** The system shall maintain an immutable **audit trail** (`AuditLog`) for all critical create/update/delete/approve/ban actions on master data and transactions, capturing `action_id`, timestamp, actor, tenant, `before_state` JSON, and `after_state` JSON.  
- **ERP-PLAT-016:** The system shall enforce **data integrity controls**: once a tax invoice is issued or a journal entry is posted, it cannot be deleted (`400 Bad Request`); it can only be reversed via a reversing Credit Note or reversing Journal Entry.  
- **ERP-PLAT-017:** The system shall store historical versions of critical documents (`DocumentVersion`) with full JSON snapshots, version numbers, and change reasons.  
- **ERP-PLAT-018:** Passwords and sensitive credentials shall be hashed/secured, and `AuditLog` / `UserActivityLog` / `StockMovement` tables shall be read-only in the API and Django Admin.  
- **ERP-PLAT-019:** The system shall provide **user activity logging** (`UserActivityLog`) tracking logins, logouts, failed login attempts, password resets, data exports, user/tenant bans, subscription payments, and service discontinuations.  

### Document and Data Management

- **ERP-PLAT-020:** The system shall allow attaching **documents and images** (`Attachment`) to any transaction (e.g., PDF receipt on a vendor bill, photo on a support ticket or POD).  
- **ERP-PLAT-021:** The system shall support configurable **template documents** and statutory layouts (e.g., Sri Lanka Tax Invoice, SVAT Invoice, Credit Note, Payslip, Bill of Lading).  
- **ERP-PLAT-022:** The system shall include an `ocr_extracted_text` field on `Attachment` for storing OCR-extracted metadata from scanned invoices or receipts.  
- **ERP-PLAT-023:** The system shall allow configuration of localized **notification templates** (`NotificationTemplate`) per tenant, channel (`IN_APP`, `EMAIL`, `SMS`), and language (`en`, `si`, `ta`).  

### Reporting and Analytics Services

- **ERP-PLAT-024:** The system shall provide pre-built **reporting and analytics endpoints** covering financial statements (`/api/finance/reports/statements/`), statutory payroll schedules (`/api/hr/payroll-runs/{id}/statutory-report/`), support SLA metrics (`/api/service-desk/metrics/`), and inventory/POS/e-commerce/fleet TCO analytics (`/api/inventory/analytics/`).  
- **ERP-PLAT-025:** The system shall aggregate data across modules in real time (e.g., POS sales, GRN receipts, fleet maintenance spare parts, and payroll runs automatically post to the General Ledger when the Finance module is enabled).  
- **ERP-PLAT-026:** The system shall support **dashboard analytics and KPIs**: sales revenue by channel, inventory valuation by currency, ABC/XYZ & dead stock lists, low-stock reorder alerts, support ticket backlog/CSAT, and fleet TCO/downtime.  
- **ERP-PLAT-027:** Structured JSON export endpoints (including Sri Lanka IRD RAMIS e-invoicing export and bank salary upload instructions) shall be provided for external BI and statutory portals.  

### Configuration and Localization

- **ERP-PLAT-028:** The system shall support configuration of **currency and taxation** on a per-company basis (`base_currency`, `default_vat_rate`, `default_nbt_rate`, `CurrencyExchangeRate`).  
- **ERP-PLAT-029:** The system shall support multiple languages (`en` English, `si` Sinhala, `ta` Tamil) per company and notification template.  
- **ERP-PLAT-030:** The system shall allow localization of fiscal calendars (`fiscal_year_start_month`, `FiscalPeriod`), public/Poya holidays (`PublicHoliday`), and statutory tax rates.  
- **ERP-PLAT-031:** The system shall allow enabling/disabling optional modules per tenant (`enabled_modules` on `Tenant`, enforced via `ModuleEnabledPermission`) and handle cross-module dependencies gracefully (e.g., POS orders generate a provisional receipt when `FINANCE` is disabled, and post a full AR Tax Invoice + GL Journal when `FINANCE` is enabled).  

### Integration & APIs (REST, Swagger/OpenAPI & Jazzmin Admin)

- **ERP-PLAT-032:** The system shall expose a comprehensive **RESTful API** documented via interactive **Swagger UI** (`/api/docs/`, `/swagger/`), **ReDoc** (`/api/redoc/`), and **OpenAPI 3 Schema** (`/api/schema/`).  
- **ERP-PLAT-033:** The system shall support structured import/export payloads for bank reconciliation, fuel card transactions, payroll bank uploads, and legacy data migration.  
- **ERP-PLAT-034:** The system shall support **webhooks** (`WebhookSubscription` at `/api/webhooks/`) for critical ERP events.  
- **ERP-PLAT-035:** The system shall support email/SMS notification dispatching (`MAILERS` / `Notification`).  
- **ERP-PLAT-036:** The system shall expose **Sri Lanka IRD RAMIS e-invoicing** payloads (`GET /api/finance/customer-invoices/{id}/ramis-export/`).  
- **ERP-PLAT-037:** The system shall provide a modern **Jazzmin Django Admin Panel** (`/admin/`) with custom navigation, icons, search bars, and bulk administrative actions.  

---

## Functional Modules

### Finance & Accounting (ERP-FIN)

- **ERP-FIN-001 (General Ledger & Chart of Accounts):** Company-level Chart of Accounts (`Account` — `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`) with one-click default Sri Lanka COA seeding (`POST /api/finance/accounts/seed-default/`) and double-entry bookkeeping (`JournalEntry`, `JournalLine`).  
- **ERP-FIN-002 (Manual & Automated Journals):** Creation and posting of balanced GL journal entries (`sum(debit) == sum(credit) > 0`), with narration, source module tracking, and immutable reversal (`POST /api/finance/journals/{id}/reverse/`).  
- **ERP-FIN-003 (Multi-Currency Accounting):** `CurrencyExchangeRate` table and transaction-level currency and exchange rate fields.  
- **ERP-FIN-004 (Accounts Receivable & Statutory Invoicing):** `CustomerInvoice` & `CustomerInvoiceLine` supporting `TAX_INVOICE`, `SVAT_INVOICE`, `COMMERCIAL_INVOICE`, and reversing `CREDIT_NOTE` (`POST /api/finance/customer-invoices/{id}/create-credit-note/`), customer balance tracking, and AR aging.  
- **ERP-FIN-005 (Accounts Payable):** `VendorBill` & `VendorBillLine` generated automatically from Goods Receipt Notes (GRNs) or entered manually, supporting input VAT credits, supplier withholding tax deductions, and AP balance tracking.  
- **ERP-FIN-006 (Bank, Cash & Petty Cash Management):** `BankAccount` (`BANK`, `CASH`, `PETTY_CASH`) and `PaymentTransaction` (`CUSTOMER_RECEIPT`, `VENDOR_PAYMENT`, `PETTY_CASH_EXPENSE`, `BANK_TRANSFER`) with bank statement reconciliation (`POST /api/finance/payments/{id}/reconcile/`).  
- **ERP-FIN-007 (Taxation — VAT, SVAT, NBT, WHT):** Configurable company output/input VAT rates (default 18%), NBT (default 2%), SVAT suspended VAT handling with RIS/RIP numbers, and automated **Sri Lanka VAT 200 Return** calculation in `/api/finance/reports/statements/`.  
- **ERP-FIN-008 (Fixed Asset Management & Depreciation):** `FixedAsset` register supporting `STRAIGHT_LINE` and `REDUCING_BALANCE` depreciation schedules and automated GL depreciation posting (`POST /api/finance/fixed-assets/{id}/run-depreciation/`).  
- **ERP-FIN-009 (Inter-Company Transactions & Consolidation):** `InterCompanyTransaction` tracking between companies within the same tenant with consolidation elimination flags.  
- **ERP-FIN-010 (Budgeting & Commitments):** `Budget` per GL account, branch, and fiscal year tracking `allocated_amount`, `committed_amount`, `actual_spent`, and computed `variance`.  
- **ERP-FIN-011 (Financial Period Closing):** `FiscalPeriod` with `lock` and `reopen` actions that prevent backdated GL postings into locked periods.  
- **ERP-FIN-012 (Financial Statements):** Real-time Trial Balance, Income Statement (Profit & Loss), and Balance Sheet via `GET /api/finance/reports/statements/`.  
- **ERP-FIN-013 (Automated Inter-Module Postings):** Automatic double-entry GL postings from POS sales, E-Commerce orders, Goods Receipt Notes (GRNs), Stock Adjustments, Payroll Runs, Fleet Delivery Trips, and Fleet Maintenance Work Orders.  
- **ERP-FIN-014 (Credit Limit & Risk Management):** Enforces `Customer.credit_limit` during invoice issuance, blocking credit sales that exceed the customer's credit limit.  
- **ERP-FIN-015 (Aging & Analysis Reports):** AR and AP outstanding aging totals in `/api/finance/reports/statements/`.  
- **ERP-FIN-016 (Financial Audit & Reversal Controls):** Prevents deletion of posted journals and issued invoices, logs `DocumentVersion` snapshots, and records every financial posting in `AuditLog`.  

---

### Human Resources & Payroll (ERP-HR)

- **ERP-HR-001 (Employee Master Database):** `Employee` records linked to `User` accounts, storing personal details, Sri Lanka NIC, TIN, EPF member number, department, job title, pay grade, hire/termination dates, basic salary (defaulting to >= LKR 30,000 minimum wage), fixed allowances, overtime rate, bank details, and computed `years_of_service`.  
- **ERP-HR-002 (Attendance & Time Tracking):** `Attendance` recording daily clock-in/out, regular hours, and overtime hours integrated with monthly payroll runs.  
- **ERP-HR-003 (Leave & Absence Management with Poya Holidays):** `PublicHoliday` (including Sri Lanka Poya days and mercantile holidays) and `LeaveRequest` (`ANNUAL`, `CASUAL`, `MEDICAL`, `MATERNITY`, `POYA_LIEU`, `UNPAID`) with approval workflow (`approve`/`reject`), automatic leave balance deduction, and automatic unpaid leave deduction in payroll.  
- **ERP-HR-004 (Payroll Processing):** `PayrollRun` & `Payslip` calculating basic salary, fixed allowances, overtime pay, unpaid leave deductions, loan/advance recoveries, gross pay, and net pay per period.  
- **ERP-HR-005 (Statutory EPF & ETF Contributions):** Automatic calculation of **Employer EPF (12%)**, **Employee EPF (8% deducted)**, and **Employer ETF (3%)** on every payslip and via preview calculator `POST /api/hr/calculator/epf-etf-apit/`.  
- **ERP-HR-006 (Advance Personal Income Tax — APIT):** Automatic progressive monthly APIT calculation based on Sri Lanka IRD tax slabs (0% up to LKR 150,000/month, then progressive 6%, 12%, 18%, 24%, 30%, and 36% bands).  
- **ERP-HR-007 (Statutory Payroll Reporting — Form IRD 7 & EPF/ETF Schedules):** `GET /api/hr/payroll-runs/{id}/statutory-report/` generates the complete EPF (8% + 12% = 20%), ETF (3%), and APIT schedule per employee with NIC, TIN, and EPF member numbers.  
- **ERP-HR-008 (Gratuity Accrual & Recoveries):** Automatically accrues monthly gratuity (`0.5 * basic_salary / 12`) for employees with `>= 5` years of service when company headcount is `>= 15`.  
- **ERP-HR-009 (Employee Self-Service Portal):** `GET /api/hr/self-service/` returns the logged-in employee's profile, leave balances, recent payslips, and leave application history.  
- **ERP-HR-010 (Recruitment & Onboarding):** `JobOpening` & `JobApplicant` with one-click `POST /api/hr/job-applicants/{id}/hire/` action that automatically creates an `Employee` record.  
- **ERP-HR-011 (Salary Revisions & Promotions):** `SalaryRevision` workflow updating employee `basic_salary` and `job_title` with audit history.  
- **ERP-HR-012 (HR & Payroll GL Integration):** Processing a `PayrollRun` automatically posts the consolidated Payroll Journal (Gross Salaries Expense, Employer EPF/ETF Expense, Net Salaries Payable, EPF 20% Payable, ETF 3% Payable, APIT Tax Payable) to Finance GL.  
- **ERP-HR-013 (Employee Data Privacy):** Role-scoped access to sensitive NIC, TIN, and salary fields.  
- **ERP-HR-014 (Bank Salary File Export):** `GET /api/hr/payroll-runs/{id}/statutory-report/` outputs `bank_salary_upload_instructions` for automated bank salary disbursement.  

---

### Customer Support / Service Desk (ERP-SD)

- **ERP-SD-001 (Ticketing System):** `SupportTicket` & `TicketMessage` with auto-generated `ticket_number`, customer reference, category, priority, status, and SLA timestamps.  
- **ERP-SD-002 (Categorization & Prioritization):** Supports categories (`TECHNICAL`, `BILLING`, `WARRANTY_RMA`, `DELIVERY`, `GENERAL`) and priorities (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).  
- **ERP-SD-003 (Ticket Resolution & SLA Escalation Workflow):** Tracks `response_due_at`, `resolution_due_at`, and `first_responded_at`. Endpoint `POST /api/service-desk/tickets/check-sla-escalations/` automatically flags and escalates open tickets when 75% of the resolution SLA window has elapsed (e.g., 1.5 hours on a 2-hour SLA) or when overdue, sending an alert `Notification`.  
- **ERP-SD-004 (Knowledge Base / FAQ):** `KnowledgeBaseArticle` searchable by title, category, and content, and linkable to support tickets (`linked_kb_articles`).  
- **ERP-SD-005 (Customer Portal Support):** Public-on-portal KB articles (`is_public_on_portal=True`) and customer ticket submission/tracking.  
- **ERP-SD-006 (CRM & Purchase History Integration):** `SupportTicketSerializer` embeds `customer_purchase_history` showing the customer's recent invoices and statuses directly on the ticket view.  
- **ERP-SD-007 (SLA & Support Contract Management):** `SupportContract` tracking contract validity dates, response/resolution SLA minutes, and no-charge warranty coverage (`is_currently_valid`).  
- **ERP-SD-008 (Service-Level Metrics Dashboard):** `GET /api/service-desk/metrics/` reports total tickets, escalated ticket counts, average CSAT rating, and breakdowns by category and status.  
- **ERP-SD-009 (Multi-Channel Intake):** Tracks `source_channel` (`PORTAL`, `EMAIL`, `PHONE`, `WALK_IN`) and internal vs customer-facing messages (`POST /api/service-desk/tickets/{id}/add-message/`).  
- **ERP-SD-010 (Customer Satisfaction Feedback):** `POST /api/service-desk/tickets/{id}/submit-feedback/` records 1–5 `satisfaction_rating` and `customer_feedback` upon ticket closure.  
- **ERP-SD-011 (Refund & Credit Note Escalation to Finance):** `POST /api/service-desk/tickets/{id}/issue-refund-credit-note/` automatically generates and posts a reversing Finance `CustomerInvoice` (`CREDIT_NOTE`) for the ticket's related invoice.  

---

### Retail & Inventory Management (ERP-INV / STK / FLT / POS / ECOM)

#### Point of Sale (ERP-POS)

- **ERP-POS-001 (Real-Time POS Interface & Inventory Sync):** `POSOrder` & `POSOrderLine` (`/api/inventory/pos/orders/`) supporting barcode/SKU lookup, UOM conversion, line/order discounts, payment methods (`CASH`, `CARD`, `MOBILE_QR`, `SPLIT`), real-time branch stock decrement, and FIFO/Weighted Avg COGS calculation.  
- **ERP-POS-002 (Offline Mode Sync):** Supports `is_offline_synced` and `offline_receipt_uid` so sales queued during connectivity drops sync cleanly without failing on transient stock locks.  
- **ERP-POS-003 (Sales Receipts, Returns & Voids):** `POST /api/inventory/pos/orders/{id}/return-or-void/` restocks returned items into branch inventory, logs a `POS_RETURN` stock movement, and issues a reversing Finance `CREDIT_NOTE`.  
- **ERP-POS-004 (Loyalty Program Integration):** Automatically awards loyalty points (`loyalty_points_earned`) and deducts redeemed points (`loyalty_points_redeemed`) on the shared `Customer` record.  
- **ERP-POS-005 (Omnichannel In-Store Pickup):** Supports routing online orders (`is_in_store_pickup=True` on `EcommerceOrder`) to local store branches for pickup.  
- **ERP-POS-006 (Audit-Logged Voiding):** All POS returns and voids are logged in `StockMovement` and `AuditLog`.  
- **ERP-POS-007 (Cash Drawer Shift Operations):** `POSShift` (`/api/inventory/pos/shifts/`) tracks shift open/close, `opening_cash`, accumulated `cash_sales_total`, `actual_closing_cash`, and computed `cash_variance` (`POST /api/inventory/pos/shifts/{id}/close_shift/`).  
- **ERP-POS-008 (Tax & Nearest-Rupee Rounding):** Applies item-level tax rates and optional nearest-rupee rounding (`Company.round_to_nearest_rupee`). If the tenant's `FINANCE` module is enabled, completing a POS sale automatically issues an AR Tax Invoice and posts to GL; if `FINANCE` is disabled, it records a `provisional_receipt_note`.  

---

#### Advanced Stock, Inventory, Warehousing & Procurement (ERP-INV & STK-01 to STK-45)

1. **Master Data and Catalogues**
   - **STK-01 / ERP-INV-001 (Item Master & Multi-UOM Conversion):** Single `Product` catalog with SKU, barcode, brand, category, base UOM, selling/cost/standard prices, tax rate, and `ProductUOMConversion` (`/api/inventory/uom-conversions/`) supporting multiple units of measure per item (e.g., Piece, Box, Carton, Pallet) with automatic conversion to base UOM across procurement, inventory, and sales.
   - **STK-02 (Item Variants & Multilevel Bill of Materials / Production):** `ProductVariant` (`/api/inventory/product-variants/`) for size/color/attribute inventory, and multilevel `BillOfMaterials` (`BOMComponent` with recursive `sub_bom` support) + `ProductionOrder` (`/api/inventory/production-orders/{id}/execute/`) that automatically consumes component stock and increments assembled finished product inventory.
   - **STK-03 (Barcode / RFID / QR Code & Pallet Scanning):** Supports `barcode`, `rfid_epc`, `qr_code_payload` on products, `pallet_qr_code` on batches, and `barcode_qr` on warehouse bins. Universal scanner endpoint `GET /api/inventory/scan/?code=<code_or_qr>` identifies products, variants, pallet batches, or bin locations and returns live quantities without manual lookup.
   - **STK-04 & STK-36 (Supplier Master & Consignment / VMI Stock):** Integrated `Supplier` master with lead times, payment terms, and vendor-managed consignment inventory (`is_consignment`, `StockLevel.consignment_quantity`). Consignment receipts increase stock flagged separately from owned asset valuation, and consuming consignment stock triggers a Finance notification to settle/bill with the supplier.

2. **Procurement and Sourcing**
   - **STK-05 (Purchase Requisitions to Purchase Orders):** `PurchaseRequisition` & `PurchaseRequisitionLine` (`/api/inventory/requisitions/`) with one-click conversion of approved requisitions into `PurchaseOrder`s (`POST /api/inventory/requisitions/{id}/convert-to-po/`).
   - **STK-06 (RFQs / Tenders & Long-Term Supplier Contracts):** `RequestForQuotation`, `SupplierBid`, and `SupplierContract` (`/api/inventory/rfqs/`, `/api/inventory/supplier-contracts/`). Allows issuing RFQs to multiple suppliers, recording bids (`submit-bid`), and awarding the lowest compliant bid (`award-bid`), which automatically creates/updates a long-term `SupplierContract` and applies negotiated contract pricing to future POs.
   - **STK-07 (Three-Way Matching Enforcement):** `POST /api/inventory/purchase-orders/{id}/verify-three-way-match/` verifies consistency across the Purchase Order, posted Goods Receipt Notes (GRNs), and Supplier Invoice quantities and amounts, flagging missing GRNs or quantity/amount discrepancies before payment approval.
   - **STK-08 / ERP-INV-008..012 (Purchase Orders & Price/Discount Tracking):** `PurchaseOrder` & `PurchaseOrderLine` tracking agreed unit costs, discount percentages, received quantities, and computed `pending_quantity` backorders.

3. **Hierarchical Storage Model**
   - **STK-09 (Multi-Level Location Hierarchy & Inheritance):** `WarehouseLocation` (`/api/inventory/locations/`) supporting arbitrary hierarchical nesting: `REGION` → `SUB_REGION` → `REGIONAL_STOREROOM` → `BRANCH_SITE` → `WAREHOUSE` → `STOREROOM` → `ZONE` → `AISLE` → `RACK` → `SHELF` → `BIN`. Child locations inherit default lead times (`effective_lead_time_days`) and regional catalog assignments (`GET /api/inventory/locations/{id}/inherited-items/`) from parent regions.
   - **STK-10 (Zone & Bin Management):** Defines warehouse zones and bins with specialized `bin_type`s (`STANDARD_SHELF`, `PALLET`, `COLD_STORAGE`, `HAZARDOUS`, `QUARANTINE`, `CROSS_DOCK`), capacity limits, and computed `full_path` (e.g., `"W > Aisle 1 > Shelf A > Bin B"`).
   - **STK-11 (Regional Store Rooms & Regional Manager Approvals):** Supports regional store rooms (`REGIONAL_STOREROOM`) and regional manager transfer approvals (`POST /api/inventory/stock-transfers/{id}/approve-regional/`).

4. **Inbound Operations (Receiving, Quarantine QC, Put-Away & Cross-Docking)**
   - **STK-12 / ERP-INV-003 (Goods Receipt / GRN Processing):** `GoodsReceiptNote` & `GoodsReceiptLine` (`/api/inventory/goods-receipts/`) supporting full and partial receipts against POs, automatic backorder tracking, inventory ledger updates, AP `VendorBill` generation, and Finance GL posting.
   - **STK-13 (Quality Inspection & Quarantine):** Items flagged with `requires_quality_inspection` or received with `place_in_quarantine=True` enter `StockLevel.quarantine_quantity` (`GRN.status = 'IN_QUARANTINE'`) and generate a `QualityInspection` record. Completing inspection (`POST /api/inventory/quality-inspections/{id}/complete-inspection/`) moves `approved_quantity` into available `on_hand` stock and logs `rejected_quantity` for supplier return or scrap.
   - **STK-14 (Put-Away Workflows):** Completing a GRN automatically generates a `PutAwayTask` (`/api/inventory/put-away-tasks/`) suggesting an optimal warehouse bin (`suggested_bin`), confirmed by scanning the item and bin (`POST /api/inventory/put-away-tasks/{id}/confirm-scan/`).
   - **STK-15 (Cross-Docking):** Items or GRN lines flagged with `is_cross_dock=True` bypass warehouse storage (`on_hand` is not incremented in storage) and immediately generate an outbound `PickingTask` (`is_cross_dock_task=True`) for direct dispatch.

5. **Inventory Visibility, Control, Traceability, Cold-Chain & Tool Custody**
   - **STK-16 / ERP-INV-002 (Real-Time Stock Ledger):** `StockLevel` & `StockMovement` tracking `on_hand`, `reserved`, `available`, `in_transit`, `quarantine_quantity`, and `consignment_quantity` by branch and bin location.
   - **STK-17 (Stock Reservations & Anti-Overbooking):** `StockReservation` (`/api/inventory/reservations/`) reserves stock for sales orders, production orders, or maintenance tasks and rejects reservations when `quantity > available`.
   - **STK-18 / ERP-INV-004 (Stock Transfers & In-Transit Tracking):** `StockTransfer` & `StockTransferLine` (`/api/inventory/stock-transfers/`) with `dispatch_transfer` (decrements source `on_hand` and increments destination `in_transit`) and `receive_transfer` (moves `in_transit` to destination `on_hand`).
   - **STK-19 (Cycle Counting & Physical Inventory Audits):** `CycleCountSession` & `CycleCountItem` (`/api/inventory/cycle-counts/`) compares counted vs system quantity by ABC class or bin, classifies variances as `Minor` or `Major`, reconciles `on_hand` (`POST /api/inventory/cycle-counts/{id}/reconcile/`), and writes `StockMovement` and `AuditLog` entries.
   - **STK-20 (ABC / XYZ Classification & Dead-Stock Analysis):** `POST /api/inventory/analytics/` classifies top 20% items by usage value as `ABCClass.A`, next 30% as `B`, remaining as `C`, and flags items with `<1` consumption turnover as `is_dead_stock=True` (`XYZClass.Z`).
   - **STK-21 / ERP-INV-007 (Expiration, Batch & Serial Traceability):** `BatchSerialRecord` tracks batch/lot numbers, serial numbers, pallet QR codes, FIFO unit cost layers, and expiry dates. Includes full forward/backward movement tracing (`GET /api/inventory/batch-serials/trace/`) and 60-day expiration alerts (`GET /api/inventory/batch-serials/expiry-alerts/?days=60`).
   - **STK-22 (Batch Recall Management):** `BatchRecall` (`/api/inventory/recalls/`) quarantines all remaining in-stock units of a recalled batch, identifies all affected customers and sales orders, and automatically creates `ReturnMerchandiseAuth` (RMA) return orders.
   - **STK-23 / ERP-INV-005 (Authorized Inventory Adjustments):** `StockAdjustment` (`/api/inventory/stock-adjustments/`) records positive/negative stock adjustments with reason codes (`STOCK_COUNT`, `DAMAGED`, `THEFT_LOSS`, `EXPIRED`, `FOUND`), posts GL variance entries, and writes an immutable `AuditLog`.
   - **STK-24 (Temperature-Sensitive Cold Chain & Hazardous Storage):** `WarehouseLocation` supports `min_temp_celsius`, `max_temp_celsius`, and `allows_hazardous`. `TemperatureLog` (`/api/inventory/temperature-logs/`) ingests sensor readings and, upon any temperature threshold breach, automatically quarantines and flags all batches in that bin (`is_temperature_breached=True`) and dispatches an urgent alert `Notification`.
   - **STK-25 (Project/Job & Tool Custody Inventory):** `ToolCheckout` (`/api/inventory/tool-checkouts/`) tracks tools checked out to employees/technicians for projects, due return dates (default 30 days), calibration dates, and overdue alert scanning (`POST /api/inventory/tool-checkouts/check-overdue-tools/`).

6. **Outbound Operations (Wave Picking, Pack/Ship, POD & RMA)**
   - **STK-26 & STK-27 (Batch Picking, Wave Management & Pack/Ship):** `PickingWave` (`/api/inventory/picking-waves/`) and `PickingTask` (`/api/inventory/picking-tasks/`), grouping outbound picks by region/route and warehouse zone/bin, with scan confirmation (`POST /api/inventory/picking-tasks/{id}/confirm-pick/`) capturing carrier and tracking number.
   - **STK-28 (Electronic Proof of Delivery — POD):** `ProofOfDelivery` (`/api/inventory/proofs-of-delivery/`) captures recipient name, digital signature, signed invoice photo URL, GPS coordinates, and offline sync flag, automatically closing the linked `DeliveryTrip` or `EcommerceOrder`.
   - **STK-29 (Returns, Reverse Logistics & RMA Workflow):** `ReturnMerchandiseAuth` (`/api/inventory/rmas/`) with `POST /api/inventory/rmas/{id}/receive-rma/` supporting disposition to `RESTOCK` (creates a new batch), `QUARANTINE`, or `SCRAP`, and automatically issuing a Finance `CREDIT_NOTE`.

7. **Inventory Financials, Replenishment, MRP & Forecasting**
   - **STK-30 / ERP-INV-013 (FIFO, Weighted Average & Standard Costing):** `calculate_and_consume_fifo_cogs()` consumes chronological `BatchSerialRecord` cost layers under `FIFO` (e.g., 100 units @ \$10 + 50 units @ \$12 = \$1,600 COGS for a 150-unit issue), or calculates Weighted Average / Standard Cost COGS on every issue.
   - **STK-31 & STK-32 / ERP-INV-015 (Multi-Currency Consolidation & KPI Dashboards):** `GET /api/inventory/analytics/` reports total stock valuation, multi-company/multi-currency valuation breakdown, low-stock reorder counts, POS/e-commerce revenue, and Fleet TCO.
   - **STK-33 / ERP-INV-006 (Min/Max Reordering & Safety Stock Auto-Replenishment):** `POST /api/inventory/stock-levels/auto-replenish/` scans all items where `on_hand <= reorder_point` and automatically generates `PurchaseRequisition`s for `restock_quantity`.
   - **STK-34 (Material Requirements Planning — MRP / MRP-II):** `MRPRun` (`/api/inventory/mrp-runs/`) explodes a target `BillOfMaterials` for a planned production quantity, subtracts currently available component stock, offsets by each component's `lead_time_days`, and outputs time-phased purchase proposals (`proposals_json`).
   - **STK-35 (Demand Forecasting & Seasonality):** `DemandForecast` (`POST /api/inventory/forecasts/generate/`) analyzes historical outbound stock movements and seasonality factors to forecast next-quarter demand and recommend safety stock and reorder points.
   - **STK-37 to STK-45 (Integrations, Approvals, Mobile Offline Sync, Alerts & Audit):** Full GL integration, role-based approval rules, `is_offline_synced` mobile support on cycle counts/POS/DVIR/POD, automated expiry/reorder/cold-chain notifications, and immutable audit trails.

---

#### Fleet and Transportation Management (ERP-INV-FLEET & FLT-01 to FLT-42)

1. **Asset and Vehicle Management**
   - **FLT-01 / ERP-INV-016 (Vehicle & Equipment Master):** `FleetVehicle` (`/api/inventory/fleet/vehicles/`) tracking registration number, VIN/serial, make/model, manufacture year, asset category (`TRUCK`, `DELIVERY_VAN`, `TRAILER`, `CONTAINER`, `FORKLIFT`, `MACHINERY`), seating capacity, max cargo payload (`capacity_kg`, `capacity_volume_cbm`), fuel type, tank capacity (`fuel_tank_capacity_liters`), odometer (`current_odometer_km`, `next_service_odometer_km`), and live GPS coordinates.
   - **FLT-02 (Ownership & Lease Contracts):** Tracks `ownership_type` (`OWNED`, `LEASED`, `RENTED`), `lease_contract_number`, `lease_end_date`, `monthly_lease_cost`, `purchase_cost`, and `accumulated_depreciation`.
   - **FLT-03 (Registration & Compliance Documents with 60-Day Alerts & Dispatch Blocking):** `VehicleComplianceDocument` (`/api/inventory/fleet/compliance-documents/`) tracks Registration, Revenue License, Insurance, Fitness, and Emission certificates with `expiry_date`. Endpoint `POST /api/inventory/fleet/compliance-documents/check-compliance/` generates 60-day renewal alerts and sets `is_dispatch_blocked_compliance=True` to block trip dispatch when expired.
   - **FLT-04 (Multi-Asset Management):** Non-vehicular assets (`TRAILER`, `CONTAINER`, `MACHINERY`) are tracked in `FleetVehicle`, can be linked to a towing vehicle via `attached_to_vehicle`, and have independent maintenance schedules.
   - **FLT-05 (GPS / Telematics Device Installation):** Tracks `telematics_device_id`, `current_latitude`, `current_longitude`, and `last_gps_ping_at`.

2. **Driver and Personnel Management**
   - **FLT-06 (Driver / Operator Records):** `DriverProfile` (`/api/inventory/fleet/drivers/`) maintaining driver code, full name, license number, `license_categories` (e.g., `["HGV", "LCV", "FORKLIFT"]`), `license_expiry_date`, and `medical_cert_expiry_date`.
   - **FLT-07 (License & Qualification Dispatch Validation):** `validate_trip_dispatch_eligibility()` blocks assigning a driver to a trip if their license is expired or does not include the vehicle's `required_license_category`.
   - **FLT-08 & FLT-28 (Safety Training & Medical Exam Compliance):** Tracks `safety_training_expiry_date` and `medical_cert_expiry_date`, blocking dispatch when a driver's medical certificate is expired.
   - **FLT-26 (ELD / Hours-of-Service Compliance):** Tracks `driving_hours_today` against `max_daily_driving_hours` (default 10.0 hours via `POST /api/inventory/fleet/drivers/{id}/log-driving-hours/`), automatically placing the driver on mandatory rest (`is_on_mandatory_rest=True`) at 10 hours and blocking further dispatch.
   - **FLT-27 (Driver Safety Scoring & Coaching):** Telematics events (`SPEEDING`, `HARSH_BRAKING`) deduct from `DriverProfile.safety_score` and automatically flag `coaching_required=True` when the score drops below threshold.
   - **FLT-36 (HR Leave Integration):** Links `DriverProfile.employee` to `hr.Employee`; if the driver has an approved `LeaveRequest` covering the trip date, trip dispatch is automatically blocked.

3. **Trip Planning, Dispatch, Telematics & Geofencing**
   - **FLT-09 / ERP-INV-021 (Route Planning & Optimization):** `POST /api/inventory/fleet/trips/optimize-routes/` assigns multi-stop delivery addresses across available trucks to balance load and minimize travel.
   - **FLT-10 & FLT-12 / ERP-INV-017, 019, 020 (Dispatch Management, Delivery Notes & Inter-Branch Transfers):** `DeliveryTrip` (`/api/inventory/fleet/trips/`) links vehicles, drivers, delivery note numbers, and inter-branch `StockTransfer`s, updating in-transit stock to destination `on_hand` upon completion (`POST /api/inventory/fleet/trips/{id}/complete-delivery/`).
   - **FLT-11 (Load & Payload Capacity Planning):** Enforces `planned_load_weight_kg <= vehicle.capacity_kg`, rejecting overloaded trip dispatches with `400 Bad Request`.
   - **FLT-13 (GPS Live Tracking & Geofencing):** `GeofenceZone` (`/api/inventory/fleet/geofences/`) and `POST /api/inventory/fleet/vehicles/{id}/telemetry-ping/` detect when a vehicle enters or exits a depot/site geofence radius and send real-time `Notification` alerts.
   - **FLT-14 (Route History & Replay):** `GET /api/inventory/fleet/trips/{id}/route-replay/` returns the chronological GPS telemetry path and stops for any trip.
   - **FLT-15 (Automated Delay Status & ETA Recalculation):** When a telemetry ping reports `STOPPAGE_DELAY`, the active trip is automatically marked `DELAYED` and `estimated_arrival_at` is recalculated.

4. **Maintenance, Repairs, OBD-II DTC Alerts & Driver DVIRs**
   - **FLT-16 (Scheduled & Preventive Maintenance):** `MaintenanceWorkOrder` (`/api/inventory/fleet/maintenance-orders/`) tracks scheduled and reactive maintenance by mileage/date.
   - **FLT-17 (Diagnostic Trouble Codes — DTC):** `DiagnosticTroubleCodeAlert` (`/api/inventory/fleet/dtc-alerts/`) records OBD-II trouble codes (e.g., low engine oil pressure) and automatically generates an urgent repair `MaintenanceWorkOrder`.
   - **FLT-18 & FLT-41 (Digital Vehicle Inspections — DVIR with Offline Mobile Support):** `DigitalVehicleInspection` (`/api/inventory/fleet/dvirs/`) records pre-trip and post-trip driver inspection checklists (`checklist_json`, `is_offline_synced`) and automatically schedules a repair `MaintenanceWorkOrder` whenever `defects_found=True`.
   - **FLT-19 & FLT-35 / ERP-INV-018 (Spare Parts Inventory Deduction & Finance GL Integration):** `MaintenancePartUsage` links repair work orders to spare part `Product`s (e.g., brake pads, tires, batteries). Completing a work order (`POST /api/inventory/fleet/maintenance-orders/{id}/complete-work-order/`) deducts the used parts from warehouse `StockLevel`, logs `FLEET_SPARE_PART` stock movements, and posts total parts + labor expense to Finance GL (`5400 Fleet Maintenance Expense`).
   - **FLT-20 (Maintenance & Downtime Analytics):** Tracks `downtime_days` per work order and flags high-downtime vehicles in `GET /api/inventory/analytics/`.

5. **Fuel Card Reconciliation, Mileage Efficiency, Tolls/Fines, Accidents & 3PL Freight**
   - **FLT-21, FLT-22 & FLT-23 (Fuel Card Integration, Reconciliation & Fuel Economy Alerts):** `FuelTransaction` (`/api/inventory/fleet/fuel-transactions/`) reconciles fuel purchases against vehicle tank capacity, duplicate detection, and telematics station verification (`is_flagged_anomaly`, `anomaly_reason`), updates vehicle odometer, computes `calculated_km_per_liter`, and sends an alert if fuel efficiency drops below `baseline_km_per_liter`.
   - **FLT-24 (Tolls, Parking & Traffic Fines):** `VehicleTollFineRecord` (`/api/inventory/fleet/tolls-fines/`) logs highway tolls, parking fees, and traffic/speeding fines against vehicles and drivers (`deduct_from_driver`).
   - **FLT-25 (Accident / Incident & Insurance Claim Reporting):** `FleetAccidentIncident` (`/api/inventory/fleet/accidents/`) records accident date, location, damage, injuries, and `insurance_claim_number`, and automatically creates an `ACCIDENT_REPAIR` `MaintenanceWorkOrder`.
   - **FLT-29, FLT-30 & FLT-31 (3PL Subcontractor Carriers, Freight Rating & Shipment Exception Tracking):** `ThirdPartyCarrier` (`/api/inventory/fleet/carriers/`) and `FreightShipment` (`/api/inventory/fleet/freight-shipments/`) generate Bills of Lading (`bol_number`), automatically compute freight charges (`calculated_freight_cost = rate_per_km_per_kg * distance_km * weight_kg + base_handling_fee`), and trigger customer/staff notifications on `DELAYED` or `DAMAGED` shipment exceptions.
   - **FLT-32 & FLT-33 (Utilization & Total Cost of Ownership — TCO Analytics):** `GET /api/inventory/analytics/` computes per-vehicle TCO (depreciation/lease + fuel + maintenance) and downtime metrics.

---

#### E-commerce (ERP-ECOM)

- **ERP-ECOM-001 (Integrated E-Commerce Catalog & Order API):** Publishes products (`is_published_ecommerce=True`), variants, prices, and stock levels, and ingests online orders via `EcommerceOrder` & `EcommerceOrderLine` (`/api/inventory/ecommerce/orders/`).  
- **ERP-ECOM-002 (Real-Time Warehouse Stock Synchronization):** Confirming an online order immediately decrements `StockLevel.on_hand` in the originating `fulfillment_branch` warehouse and calculates FIFO/Weighted Avg COGS.  
- **ERP-ECOM-003 (Online Payment Capture):** Tracks `payment_gateway`, `payment_gateway_ref`, and transitions order status to `PAID`, automatically generating and posting an AR `CustomerInvoice` when Finance is enabled.  
- **ERP-ECOM-004 (Customer Pricing Tiers & Coupons):** Supports customer `pricing_tier` (`STANDARD`, `SILVER`, `GOLD`, `WHOLESALE`) and order `coupon_code` / `discount_amount`.  
- **ERP-ECOM-005 (Order Fulfillment Routing):** Routes confirmed online orders into warehouse picking waves/tasks, shipping, and POD capture.  
- **ERP-ECOM-006 (Online E-Commerce Returns & Refunds):** `POST /api/inventory/ecommerce/orders/{id}/process-return/` restocks returned items into the fulfillment warehouse, logs an `ECOM_RETURN` movement, and issues a reversing Finance `CREDIT_NOTE`.  
- **ERP-ECOM-007 (E-Commerce Analytics):** Online order volume and revenue metrics are aggregated in `GET /api/inventory/analytics/`.  

---

## Roles and Permissions Matrix (Inventory, Warehouse & Fleet)

| Role | Inventory | Procurement | Warehouse Ops | Fleet Dispatch | Fleet Maintenance | Finance | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Inventory Clerk** (`INVENTORY_CLERK`) | View/Edit stock, perform counts, record adjustments | – | Pick/Pack, Put-away, Ship | – | – | – | – |
| **Warehouse Manager** (`WAREHOUSE_MANAGER`) | All inventory actions, manage locations/bins, transfers, recalls | Approve POs, GRNs | Oversee inbound QC, wave picking, outbound | – | – | – | – |
| **Procurement Officer** (`PROCUREMENT_OFFICER`) | View stock for forecasting & MRP | Create/manage Requisitions, RFQs, Bids, POs, Supplier Contracts, 3-Way Match | – | – | – | – | – |
| **Fleet Manager** (`FLEET_MANAGER`) | View spare parts & fuel inventory | Manage 3PL carrier contracts | – | Dispatch trips, optimize routes, assign vehicles/drivers | Schedule MOWs, review DVIR/DTC/Fuel/TCO analytics | – | – |
| **Driver** (`DRIVER`) | View assigned shipments | – | Execute delivery handovers & POD | Receive dispatch orders, log ELD hours | Perform pre/post-trip DVIR inspections | – | – |
| **Mechanic** (`MECHANIC`) | Issue repair spare parts | – | – | – | Access vehicle service schedules, DTC alerts, complete MOWs | – | – |
| **System / Platform Admin** (`SYSTEM_ADMIN` / `PLATFORM_ADMIN`) | Full access | Full access | Full access | Full access | Full access | Full access | Tenant billing, payments, user/customer banning, RBAC configuration |

---

## Core Data Entities and Business Rules

- **Tenant & SubscriptionPayment:** SaaS customer account, enabled modules, next payment due date, 2-month overdue auto-discontinuation cutoff, ban state, and admin-recorded payment receipts.
- **Company, Branch & WarehouseLocation:** Multi-entity legal hierarchy and multi-level storage hierarchy (`Region` → `SubRegion` → `RegionalStoreRoom` → `Branch` → `Warehouse` → `Zone` → `Aisle` → `Rack` → `Shelf` → `Bin`).
- **Product, ProductUOMConversion, ProductVariant & BillOfMaterials:** Item master, UOM multipliers, variants, and multilevel BOM assembly trees.
- **StockLevel, StockReservation, BatchSerialRecord & StockMovement:** Real-time location inventory, anti-overbooking reservations, batch/serial/pallet QR traceability, FIFO cost layers, quarantine and consignment balances, and immutable movement ledger.
- **PurchaseRequisition, RequestForQuotation, SupplierBid, SupplierContract, PurchaseOrder & GoodsReceiptNote:** Full source-to-pay entities with 3-way matching.
- **QualityInspection, PutAwayTask, CycleCountSession, BatchRecall, TemperatureLog, ToolCheckout, PickingWave, PickingTask, ProofOfDelivery, ReturnMerchandiseAuth, MRPRun & DemandForecast:** Complete warehouse execution and planning entities.
- **FleetVehicle, VehicleComplianceDocument, DriverProfile, GeofenceZone, VehicleTelemetryLog, DeliveryTrip, MaintenanceWorkOrder, MaintenancePartUsage, DiagnosticTroubleCodeAlert, DigitalVehicleInspection, FuelTransaction, VehicleTollFineRecord, FleetAccidentIncident, ThirdPartyCarrier & FreightShipment:** Complete fleet and transportation lifecycle entities.
- **Core Business Invariants:**
  - Never allow negative `on_hand` inventory.
  - Enforce FIFO/FEFO cost layer consumption and 60-day batch expiry alerts.
  - Block posted GL Journal and issued Tax Invoice deletion (require reversing entries/credit notes).
  - Auto-discontinue tenant ERP services when `next_payment_due_date` is overdue by `>= 2` months, and immediately restore upon admin-recorded payment.
  - Block vehicle trip dispatch on payload overload, expired vehicle compliance documents, expired/mismatched driver license, expired medical certificate, 10-hour ELD limit reached, or active HR leave.

---

## End-to-End Workflows

- **SaaS Account Purchase-to-Subscription-Enforcement:** A customer buys an ERP account (`/api/auth/register-erp-account/`). When the customer pays, the Platform Admin records the payment (`/api/platform/tenants/{id}/record-payment/`), activating the account and advancing `next_payment_due_date`. If a tenant fails to pay for 2 months past their due date, `TenantSubscriptionEnforcementMiddleware` and `check_overdue_subscriptions` automatically discontinue their services (`403 Forbidden`) until an admin records a new payment.
- **Source-to-Pay & Inbound Warehouse Lifecycle:** Stock falling below `reorder_point` (or an `MRPRun`) generates a `PurchaseRequisition`. An RFQ (`RequestForQuotation`) solicits `SupplierBid`s and awards a `SupplierContract`. The requisition converts into a `PurchaseOrder`. On delivery, a `GoodsReceiptNote` (GRN) converts purchase UOMs to base UOMs: cross-dock items route directly to outbound `PickingTask`s; QC items enter `quarantine_quantity` for `QualityInspection` before release; standard items increment `on_hand`, create FIFO `BatchSerialRecord` cost layers, generate bin `PutAwayTask`s, and post Inventory + AP GL entries. Before paying the vendor bill, `verify-three-way-match` validates PO vs GRN vs Invoice.
- **Order-to-Cash & Outbound Logistics:** A customer places an order via POS (`/api/inventory/pos/orders/`) or E-Commerce (`/api/inventory/ecommerce/orders/`). Stock is decremented (or reserved and picked via a `PickingWave`), FIFO COGS is calculated, and a `DeliveryTrip` (or 3PL `FreightShipment`) is dispatched after passing vehicle compliance, capacity, and driver ELD/license/HR-leave checks. Live GPS telemetry tracks geofences and ETAs. Upon delivery, electronic `ProofOfDelivery` (POD) closes the trip, and a Sri Lanka statutory `TAX INVOICE` (with RAMIS export and GL posting) is issued.
- **Fleet Maintenance & Fuel Reconciliation Loop:** A driver's pre-trip `DigitalVehicleInspection` (DVIR) defect, an OBD-II `DiagnosticTroubleCodeAlert`, an accident report, or an odometer threshold creates a `MaintenanceWorkOrder`. Completing the work order deducts replacement spare parts (e.g., brake pads) from warehouse `StockLevel` and posts maintenance expenses to Finance GL. Fuel card imports (`FuelTransaction`) are automatically reconciled against vehicle tank capacity, telematics location, and km/L fuel economy baselines.
- **Monthly Payroll Run:** HR processes a `PayrollRun` (`/api/hr/payroll-runs/`), aggregating attendance overtime and unpaid leaves, calculating statutory **EPF (12% employer / 8% employee)**, **ETF (3% employer)**, **APIT**, and **Gratuity accrual**, posting the payroll journal to Finance GL, and exporting **Form IRD 7** and bank salary upload instructions.

---

## Reporting Requirements

- **ERP-PLAT-038 to ERP-PLAT-042:**
  - **Finance & Sri Lanka Tax Reports (`GET /api/finance/reports/statements/` & `GET /api/finance/customer-invoices/{id}/ramis-export/`):** Trial Balance, Profit & Loss, Balance Sheet, AR/AP Aging, Sri Lanka IRD VAT 200 Return, and RAMIS E-Invoicing JSON export.
  - **HR & Statutory Payroll Reports (`GET /api/hr/payroll-runs/{id}/statutory-report/`):** Form IRD 7 / EPF C-Form (12% + 8%) / ETF (3%) / APIT remittance schedules and bank salary disbursement files.
  - **Inventory, ABC/XYZ & Fleet TCO Analytics (`GET /api/inventory/analytics/` & `POST /api/inventory/analytics/`):** Total stock valuation, multi-currency consolidation breakdown, ABC/XYZ & dead-stock classification, low-stock reorder alerts, POS & E-Commerce revenue, and per-vehicle Fleet Total Cost of Ownership (TCO) and downtime metrics.
  - **Service Desk SLA Metrics (`GET /api/service-desk/metrics/`):** Ticket volume by status/category, SLA escalation counts, and average customer satisfaction (CSAT) score.

---

## Security, Privacy, and Audit

- **ERP-PLAT-043 (Least-Privilege & Default-Deny RBAC/ABAC):** Enforced via `IsActiveTenantAndUser`, `ModuleEnabledPermission`, `IsPlatformAdminOnly`, `IsPlatformOrSystemAdmin`, and `GranularPermission`. `AUDITOR` role is strictly read-only.  
- **ERP-PLAT-044 (Data Isolation & Privacy):** Strict tenant queryset scoping (`TenantScopedQuerysetMixin`) prevents cross-tenant data leakage.  
- **ERP-PLAT-045 (Financial & Ledger Immutability):** Posted `JournalEntry` and issued `CustomerInvoice` records cannot be deleted; reversals require explicit reversing entries or Credit Notes.  
- **ERP-PLAT-046 (Comprehensive Audit & Activity Logs):** `AuditLog`, `UserActivityLog`, `DocumentVersion`, and `StockMovement` record all master data, transaction, permission, billing, and inventory changes.  
- **ERP-PLAT-047 (Backup, Recovery & Migration Readiness):** Supports daily MySQL database backups and structured bulk data import/migration endpoints (`STK-44`, `STK-45`).  

---

## Sri Lanka Localization and Compliance (ERP-SL)

- **ERP-SL-001 (Sri Lanka Statutory VAT & SVAT Tax Invoices):** `CustomerInvoice` enforces statutory headings (`TAX INVOICE`, `SUSPENDED TAX INVOICE`, `COMMERCIAL INVOICE`, `CREDIT NOTE`), supplier BR number, supplier TIN, supplier VAT Reg number, sequential invoice number, customer TIN, itemized breakdown, 18% VAT line, SVAT RIS/RIP numbers, and automatic `total_in_words` conversion (e.g., *"Sri Lankan Rupees One Hundred Eighteen Thousand Only"*).  
- **ERP-SL-002 (Sri Lanka Statutory Tax & Payroll Forms):** Generates IRD VAT 200 Return summaries, Form IRD 7 / EPF-ETF schedules, and withholding/APIT summaries.  
- **ERP-SL-003 (Fiscal Calendar & Poya Holidays):** Defaults to Sri Lanka's April–March (or Jan–Dec) fiscal calendar (`Company.fiscal_year_start_month = 4`) and tracks Poya and mercantile holidays in `PublicHoliday`.  
- **ERP-SL-004 (Sri Lanka Payroll Rates & Gratuity):** Implements 12% employer EPF, 8% employee EPF, 3% employer ETF, progressive APIT tax slabs (0% up to LKR 150,000/month, 6%–36% above), LKR 30,000 national minimum wage default, and gratuity accrual (0.5 month/year after 5 years when headcount `>= 15`).  
- **ERP-SL-005 (RAMIS E-Invoicing Integration):** Exposes `GET /api/finance/customer-invoices/{id}/ramis-export/` formatted to schema `SL-IRD-RAMIS-2026.1`.  
- **ERP-SL-006 (Tax Exceptions for Unregistered Parties):** Automatically issues `COMMERCIAL INVOICE` (0% VAT) when `Company.is_vat_registered=False` or for exempt/unregistered transactions.  
- **ERP-SL-007 (Nearest-Rupee Rounding):** Configurable `Company.round_to_nearest_rupee` applied on invoices and POS receipts.  
- **ERP-SL-008 (Configurable VAT & NBT Rates):** `default_vat_rate` (18.00%) and `default_nbt_rate` (2.00%) configurable per company.  

---

## Module Priorities (MVP / Phase 2 / Phase 3 / Phase 4)

All four phases are implemented in the codebase:

- **Phase 1 (MVP):** Multi-tenant platform, SaaS subscription billing with admin-recorded payments and 2-month overdue auto-discontinuation, user/customer/tenant banning, basic Finance (COA, GL, AR Tax Invoices, AP Bills, Bank/Cash, VAT), basic Retail (Product Master, Stock Levels, PO/GRN, Stock Transfers, Stock Adjustments, POS shifts & sales, BOM), basic HR (Employees, Attendance, Leaves, Payroll with EPF/ETF/APIT), basic Service Desk ticketing, basic Fleet registry, Jazzmin Admin, and Swagger UI.
- **Phase 2 (Advanced Inventory & Procurement):** Hierarchical locations (Regions → Sub-Regions → Store Rooms → Warehouses → Zones → Aisles → Shelves → Bins), Multi-UOM conversions, Product Variants, ABC/XYZ & dead-stock analysis, Demand Forecasting, Purchase Requisitions, RFQs/Tenders & Supplier Contracts, Three-Way Matching, Quarantine Quality Inspection, Put-Away tasks, Consignment/VMI stock, and universal Barcode/QR/RFID scanning.
- **Phase 3 (Full Logistics & Advanced Fleet Integration):** Wave & Batch Picking, Cross-Docking, Electronic Proof of Delivery (POD), RMA Reverse Logistics, Batch Recall Management, Tool Custody Inventory, MRP/MRP-II runs, Multi-Asset Fleet (Trailers/Containers/Forklifts), Vehicle Compliance Document 60-day alerts & dispatch blocking, Driver ELD/HOS 10-hour enforcement & HR leave sync, Route Optimization, Live GPS Telematics & Geofencing, Route Replay, Scheduled & Reactive Maintenance Work Orders with Spare Parts deduction, OBD-II DTC alerts, Driver DVIRs, Fuel Card Reconciliation, Tolls/Fines, Accident/Insurance reporting, 3PL Subcontractor Freight Rating, and Fleet TCO/MTBF analytics.
- **Phase 4 (IoT & Extended Automation):** Cold-chain IoT temperature sensor logging (`TemperatureLog`) with automatic batch quarantine and alerts on threshold deviation, mobile offline sync flags across POS/Cycle Counts/DVIR/POD, and webhook subscriptions.

---

## Acceptance Criteria / Checklist

All acceptance criteria below are verified by automated end-to-end tests in [core/tests.py](file:///c:/Users/User/Desktop/erp_devrious/core/tests.py):

- **ERP-PLAT-SUB-002 & 003 (Admin Payment Recording & 2-Month Auto-Discontinuation):** *When an ERP customer pays, an admin records the payment; if overdue by >= 2 months, services auto-discontinue.* **Acceptance:** Tested in `test_01` and `test_02` — non-admins receive `403`; admin payment recording activates the tenant and advances `next_payment_due_date`; 2-month overdue tenants auto-transition to `DISCONTINUED` (`403 Forbidden` on API calls) and reactivate upon new admin payment recording.
- **ERP-PLAT-USR-001 (Banning Tenants, Users & Customers):** *Admins can ban/unban tenants, users, and customers.* **Acceptance:** Tested in `test_03` — banned users and banned tenants immediately receive `403 Forbidden`; unbanning restores access.
- **ERP-PLAT-001 & 015 (Multi-Tenant Isolation & Audit Trail):** *Two tenants cannot see each other’s data; editing a customer address logs old and new values.* **Acceptance:** Tested in `test_04` — Tenant 2 sees `0` records from Tenant 1; editing a customer address records `before_state` and `after_state` in `AuditLog`.
- **ERP-FIN-007 & ERP-SL-001 (Sri Lanka Statutory Tax Invoice):** *Tax invoices include all mandatory statutory fields.* **Acceptance:** Tested in `test_05` — generated invoice includes `"TAX INVOICE"` heading, supplier BR, TIN, VAT Reg, sequential number, customer TIN, 18% VAT (`18,000.00` on `100,000.00`), grand total `118,000.00`, and `total_in_words` (*"Sri Lankan Rupees One Hundred Eighteen Thousand Only"*).
- **ERP-HR-005 (Sri Lanka EPF/ETF Calculation):** *For a salary of LKR 100,000, calculates 12,000 EPF and 3,000 ETF (employer), 8,000 EPF deducted (employee).* **Acceptance:** Tested in `test_05` — verified exact `12000.00`, `3000.00`, `8000.00`, and `92000.00` net pay.
- **ERP-INV-003 (GRN Stock & GL Posting):** *After posting a Goods Receipt for 10 units, inventory on hand increases by 10 and a stock GL entry is posted.* **Acceptance:** Tested in `test_06` — `StockLevel.on_hand` increases by `10.00` and a balanced `JournalEntry` is created.
- **ERP-SD-003 (Support Ticket SLA Escalation):** *Ticket set with 2-hour resolution SLA triggers an escalation alert if unresolved after 1.5 hours.* **Acceptance:** Tested in `test_06` — evaluating SLA at +95 minutes marks `is_escalated=True` and `status='ESCALATED'`.
- **STK-01, STK-03, STK-09, STK-10, STK-13, STK-15, STK-19, STK-24, STK-30 (Advanced Warehouse & Stock Criteria):** *Multi-UOM conversion, pallet QR scanning, nested bin path `"W > Aisle 1 > Shelf A > Bin B"`, quarantine 90%/10% QC split, cross-docking, cycle count `+3 Minor` variance, cold-chain temperature breach batch flagging, and FIFO costing (`100*$10 + 50*$12 = $1,600` COGS).* **Acceptance:** Tested and verified in `test_07`.
- **FLT-07, FLT-11, FLT-18, FLT-19, FLT-21, FLT-22, FLT-30 (Advanced Fleet & Transport Criteria):** *Overloaded truck dispatch block, pre-trip DVIR tire puncture auto-creating repair MOW, replacing 4 brake pads deducting 4 units from spare parts inventory, fuel purchase > tank capacity flagged as anomaly, and 3PL freight rating (`200 km * 1000 kg * 0.05 = 10,000.00`).* **Acceptance:** Tested and verified in `test_08`.

---

## Open Questions and Assumptions

- **Module Dependencies:** When `FINANCE` is disabled on a tenant's subscription (`enabled_modules`), POS and E-Commerce orders record provisional receipts without GL posting (`provisional_receipt_note`).
- **Multi-Currency Rounding:** Standard financial calculations use `Decimal` with `ROUND_HALF_UP` to 2 decimal places, with optional nearest-rupee rounding (`Company.round_to_nearest_rupee = True`) per Sri Lankan retail practice (`ERP-SL-007`).
- **Regulatory Updates:** Sri Lanka VAT (18%), NBT (2%), EPF (12%/8%), ETF (3%), APIT slabs, and RAMIS schema (`SL-IRD-RAMIS-2026.1`) are configurable per company/system settings to accommodate legislative updates.

---

## Source Traceability

- **ERP-PLAT, ERP-FIN, ERP-HR, ERP-SD, ERP-POS, ERP-ECOM, ERP-SL:** Derived from the core All-in-One ERP System specification and user requirements for admin-recorded SaaS customer payments, 2-month overdue service auto-discontinuation, user/customer banning, MySQL persistence, Jazzmin Admin, and Swagger/OpenAPI documentation.
- **STK-01 through STK-45 & FLT-01 through FLT-42:** Derived from [deep-research-report.md](file:///c:/Users/User/Desktop/erp_devrious/deep-research-report.md) covering advanced Stock (Inventory/Warehouse) Management and Fleet & Transportation Management.
