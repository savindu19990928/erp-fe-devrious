# All-in-One Multi-Tenant ERP System — Complete REST API Documentation

This document provides the complete REST API reference for the **Devrious All-in-One Multi-Tenant ERP System** built with **Django 6.1**, **Django REST Framework (DRF 3.18)**, **MySQL**, **Jazzmin Admin**, and **Swagger / OpenAPI 3**.

## Base URLs & Interactive Documentation

| Service | URL | Notes |
|---|---|---|
| **API Base URL** | `https://erp.devrious.lk/api/` | All REST API endpoints |
| **Swagger UI** | `https://erp.devrious.lk/api/docs/` or `https://erp.devrious.lk/swagger/` | Interactive OpenAPI 3 Swagger UI |
| **ReDoc UI** | `https://erp.devrious.lk/api/redoc/` | Structured ReDoc API Reference |
| **OpenAPI 3 Schema** | `https://erp.devrious.lk/api/schema/` | Raw OpenAPI 3 YAML/JSON schema |
| **Jazzmin Django Admin** | `https://erp.devrious.lk/admin/` | Default Superuser: `admin` / `Admin@12345` |

## Authentication & Global Enforcement Rules

- **JWT Bearer Authentication**: Pass `Authorization: Bearer <access_token>` in request headers (obtain tokens via `POST /api/auth/login/`).
- **Admin-Recorded Customer Subscription Payments**: When a customer buys an ERP account (`POST /api/auth/register-erp-account/`), the Platform Administrator records their subscription payment via `POST /api/platform/tenants/{id}/record-payment/` or `POST /api/platform/subscription-payments/`.
- **Auto-Discontinuation After 2 Months Payment Due**: Every authenticated tenant request automatically evaluates `next_payment_due_date + 2 months`. If a tenant's payment is overdue by **2 or more months**, their ERP services are automatically discontinued (`subscription_status = "DISCONTINUED"`, `is_service_active = false`) and API requests return `403 Forbidden` until an administrator records their payment.
- **Customer, User & Tenant Banning**: Banned tenants (`POST /api/platform/tenants/{id}/ban/`) and banned users (`POST /api/users/{id}/ban/`) are immediately blocked (`403 Forbidden`). Banned retail customers (`POST /api/customers/{id}/ban/`) are blocked from invoicing, POS sales, and e-commerce orders.

## Table of Contents

- [1. Authentication & ERP Customer Account Onboarding](#1-authentication-erp-customer-account-onboarding) (4 paths)
- [2. SaaS Platform, Subscription Billing & 2-Month Overdue Auto-Discontinuation](#2-saas-platform-subscription-billing-2-month-overdue-auto-discontinuation) (13 paths)
- [3. Companies, Branches, User Management, Customer/User Banning & Granular Permissions](#3-companies-branches-user-management-customeruser-banning-granular-permissions) (17 paths)
- [4. Workflows, Approvals, Audit Trail, Document Versions, Attachments, Notifications & Webhooks](#4-workflows-approvals-audit-trail-document-versions-attachments-notifications-webhooks) (19 paths)
- [5. Shared Master Data: Customers (with Banning) & Suppliers](#5-shared-master-data-customers-with-banning-suppliers) (6 paths)
- [6. Finance & Accounting + Sri Lanka VAT/SVAT/RAMIS Compliance (ERP-FIN & ERP-SL)](#6-finance-accounting-sri-lanka-vatsvatramis-compliance-erp-fin-erp-sl) (34 paths)
- [7. Human Resources & Sri Lanka Statutory Payroll (ERP-HR & EPF/ETF/APIT)](#7-human-resources-sri-lanka-statutory-payroll-erp-hr-epfetfapit) (25 paths)
- [8. Customer Support / Service Desk & SLA Escalation (ERP-SD)](#8-customer-support-service-desk-sla-escalation-erp-sd) (12 paths)
- [9. Point of Sale (ERP-POS: Cash Drawer Shifts & Real-Time/Offline Sales)](#9-point-of-sale-erp-pos-cash-drawer-shifts-real-timeoffline-sales) (6 paths)
- [10. Fleet & Transportation Management (FLT-01 to FLT-42)](#10-fleet-transportation-management-flt-01-to-flt-42) (35 paths)
- [11. E-Commerce Orders & Online Returns (ERP-ECOM)](#11-e-commerce-orders-online-returns-erp-ecom) (3 paths)
- [12. Advanced Inventory, Hierarchical Storage, Procurement, BOM, QC, Cycle Counts, Cold-Chain & MRP (STK-01 to STK-45)](#12-advanced-inventory-hierarchical-storage-procurement-bom-qc-cycle-counts-cold-chain-mrp-stk-01-to-stk-45) (84 paths)

---

## 1. Authentication & ERP Customer Account Onboarding

### `POST /api/auth/login/`

- **Endpoint**: `POST /api/auth/login/`
- **Summary**: Authenticate User & Obtain JWT Access and Refresh Tokens (`ERP-PLAT-005`)

#### Example Request

```http
POST /api/auth/login/ HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@12345"
}
```

#### Example Response (`200 OK`)

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjox...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9..."
}
```

---

### `POST /api/auth/logout/`

- **Endpoint**: `POST /api/auth/logout/`
- **Summary**: Takes a token and blacklists it. Must be used with the `rest_framework_simplejwt.token_blacklist` app installed.

#### Example Request

```http
POST /api/auth/logout/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "refresh": "sample_refresh"
}
```

#### Example Response (`200 OK`)

```json
{
  "status": "success",
  "detail": "POST /api/auth/logout/ completed successfully."
}
```

---

### `POST /api/auth/refresh/`

- **Endpoint**: `POST /api/auth/refresh/`
- **Summary**: Takes a refresh type JSON web token and returns an access type JSON web token if the refresh token is valid.

#### Example Request

```http
POST /api/auth/refresh/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "refresh": "sample_refresh"
}
```

#### Example Response (`200 OK`)

```json
{
  "access": "sample_access",
  "refresh": "sample_refresh"
}
```

---

### `POST /api/auth/register-erp-account/`

- **Endpoint**: `POST /api/auth/register-erp-account/`
- **Summary**: Buy/Register a new ERP Customer Account (Tenant)

#### Example Request

```http
POST /api/auth/register-erp-account/ HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json

{
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "tenant_slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "subscription_plan": 1,
  "admin_username": "kasun_admin",
  "admin_password": "StrongPassword123!",
  "base_currency": "LKR"
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "subscription_plan_name": "sample_subscription_plan_name",
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "auto_discontinue_cutoff_date": "2026-11-23",
  "days_overdue": 0,
  "is_overdue_for_discontinuation": true,
  "discontinued_at": "2026-11-23T10:30:00+05:30",
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

## 2. SaaS Platform, Subscription Billing & 2-Month Overdue Auto-Discontinuation

### `GET /api/platform/plans/`

- **Endpoint**: `GET /api/platform/plans/`
- **Summary**: Manage ERP SaaS Subscription Plans & Module bundles.

#### Example Request

```http
GET /api/platform/plans/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "name": "Devrious Retail Group (Pvt) Ltd",
      "code": "CMB-01",
      "description": "string",
      "billing_cycle": "string",
      "price": "35000.00",
      "currency": "LKR",
      "included_modules": "string",
      "max_companies": "string",
      "max_branches": "string",
      "max_users": "string",
      "is_active": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

---

### `POST /api/platform/plans/`

- **Endpoint**: `POST /api/platform/plans/`
- **Summary**: Manage ERP SaaS Subscription Plans & Module bundles.

#### Example Request

```http
POST /api/platform/plans/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "description": "sample_description",
  "billing_cycle": "MONTHLY",
  "price": "35000.00",
  "currency": "LKR",
  "included_modules": {
    "key": "value"
  },
  "max_companies": 1,
  "max_branches": 1,
  "max_users": 1,
  "is_active": true
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "description": "sample_description",
  "billing_cycle": "MONTHLY",
  "price": "35000.00",
  "currency": "LKR",
  "included_modules": {
    "key": "value"
  },
  "max_companies": 1,
  "max_branches": 1,
  "max_users": 1,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `GET /api/platform/plans/{id}/`

- **Endpoint**: `GET /api/platform/plans/{id}/`
- **Summary**: Manage ERP SaaS Subscription Plans & Module bundles.

#### Example Request

```http
GET /api/platform/plans/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "description": "sample_description",
  "billing_cycle": "MONTHLY",
  "price": "35000.00",
  "currency": "LKR",
  "included_modules": {
    "key": "value"
  },
  "max_companies": 1,
  "max_branches": 1,
  "max_users": 1,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `PUT /api/platform/plans/{id}/`

- **Endpoint**: `PUT /api/platform/plans/{id}/`
- **Summary**: Manage ERP SaaS Subscription Plans & Module bundles.

#### Example Request

```http
PUT /api/platform/plans/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "description": "sample_description",
  "billing_cycle": "MONTHLY",
  "price": "35000.00",
  "currency": "LKR",
  "included_modules": {
    "key": "value"
  },
  "max_companies": 1,
  "max_branches": 1,
  "max_users": 1,
  "is_active": true
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "description": "sample_description",
  "billing_cycle": "MONTHLY",
  "price": "35000.00",
  "currency": "LKR",
  "included_modules": {
    "key": "value"
  },
  "max_companies": 1,
  "max_branches": 1,
  "max_users": 1,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `PATCH /api/platform/plans/{id}/`

- **Endpoint**: `PATCH /api/platform/plans/{id}/`
- **Summary**: Manage ERP SaaS Subscription Plans & Module bundles.

#### Example Request

```http
PATCH /api/platform/plans/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "description": "sample_description",
  "billing_cycle": "MONTHLY",
  "price": "35000.00",
  "currency": "LKR",
  "included_modules": {
    "key": "value"
  },
  "max_companies": 1,
  "max_branches": 1,
  "max_users": 1,
  "is_active": true
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "description": "sample_description",
  "billing_cycle": "MONTHLY",
  "price": "35000.00",
  "currency": "LKR",
  "included_modules": {
    "key": "value"
  },
  "max_companies": 1,
  "max_branches": 1,
  "max_users": 1,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `DELETE /api/platform/plans/{id}/`

- **Endpoint**: `DELETE /api/platform/plans/{id}/`
- **Summary**: Manage ERP SaaS Subscription Plans & Module bundles.

#### Example Request

```http
DELETE /api/platform/plans/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/platform/subscription-payments/`

- **Endpoint**: `GET /api/platform/subscription-payments/`
- **Summary**: Admin ledger of all ERP Customer Account Subscription Payments. Creating a payment here calls `record_tenant_subscription_payment()` to update the tenant's billing cycle and service status.

#### Example Request

```http
GET /api/platform/subscription-payments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "receipt_number": "SUB-RCP-20261123-A1B2C3",
      "tenant": 1,
      "tenant_name": "Devrious Retail Group (Pvt) Ltd",
      "plan": "string",
      "amount": "35000.00",
      "currency": "LKR",
      "payment_date": "string",
      "payment_method": "string",
      "reference_number": "BOC-SLIP-998877",
      "months_covered": 1,
      "period_start": "string",
      "period_end": "string",
      "status": "string",
      "recorded_by": "string",
      "recorded_by_username": "string",
      "notes": "Verified and recorded by administrator.",
      "created_at": "string"
    }
  ]
}
```

---

### `POST /api/platform/subscription-payments/`

- **Endpoint**: `POST /api/platform/subscription-payments/`
- **Summary**: Admin ledger of all ERP Customer Account Subscription Payments. Creating a payment here calls `record_tenant_subscription_payment()` to update the tenant's billing cycle and service status.

#### Example Request

```http
POST /api/platform/subscription-payments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "plan": 1,
  "amount": "35000.00",
  "currency": "LKR",
  "payment_date": "2026-11-23",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "BOC-SLIP-998877",
  "months_covered": 1,
  "status": "COMPLETED",
  "notes": "Verified and recorded by administrator."
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "plan": 1,
  "amount": "35000.00",
  "currency": "LKR",
  "payment_date": "2026-11-23",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "BOC-SLIP-998877",
  "months_covered": 1,
  "period_start": "2026-11-23",
  "period_end": "2026-11-23",
  "status": "COMPLETED",
  "recorded_by": 1,
  "recorded_by_username": "sample_recorded_by_username",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `GET /api/platform/subscription-payments/{id}/`

- **Endpoint**: `GET /api/platform/subscription-payments/{id}/`
- **Summary**: Admin ledger of all ERP Customer Account Subscription Payments. Creating a payment here calls `record_tenant_subscription_payment()` to update the tenant's billing cycle and service status.

#### Example Request

```http
GET /api/platform/subscription-payments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "plan": 1,
  "amount": "35000.00",
  "currency": "LKR",
  "payment_date": "2026-11-23",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "BOC-SLIP-998877",
  "months_covered": 1,
  "period_start": "2026-11-23",
  "period_end": "2026-11-23",
  "status": "COMPLETED",
  "recorded_by": 1,
  "recorded_by_username": "sample_recorded_by_username",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `PUT /api/platform/subscription-payments/{id}/`

- **Endpoint**: `PUT /api/platform/subscription-payments/{id}/`
- **Summary**: Admin ledger of all ERP Customer Account Subscription Payments. Creating a payment here calls `record_tenant_subscription_payment()` to update the tenant's billing cycle and service status.

#### Example Request

```http
PUT /api/platform/subscription-payments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "plan": 1,
  "amount": "35000.00",
  "currency": "LKR",
  "payment_date": "2026-11-23",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "BOC-SLIP-998877",
  "months_covered": 1,
  "status": "COMPLETED",
  "notes": "Verified and recorded by administrator."
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "plan": 1,
  "amount": "35000.00",
  "currency": "LKR",
  "payment_date": "2026-11-23",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "BOC-SLIP-998877",
  "months_covered": 1,
  "period_start": "2026-11-23",
  "period_end": "2026-11-23",
  "status": "COMPLETED",
  "recorded_by": 1,
  "recorded_by_username": "sample_recorded_by_username",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `PATCH /api/platform/subscription-payments/{id}/`

- **Endpoint**: `PATCH /api/platform/subscription-payments/{id}/`
- **Summary**: Admin ledger of all ERP Customer Account Subscription Payments. Creating a payment here calls `record_tenant_subscription_payment()` to update the tenant's billing cycle and service status.

#### Example Request

```http
PATCH /api/platform/subscription-payments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "plan": 1,
  "amount": "35000.00",
  "currency": "LKR",
  "payment_date": "2026-11-23",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "BOC-SLIP-998877",
  "months_covered": 1,
  "status": "COMPLETED",
  "notes": "Verified and recorded by administrator."
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "plan": 1,
  "amount": "35000.00",
  "currency": "LKR",
  "payment_date": "2026-11-23",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "BOC-SLIP-998877",
  "months_covered": 1,
  "period_start": "2026-11-23",
  "period_end": "2026-11-23",
  "status": "COMPLETED",
  "recorded_by": 1,
  "recorded_by_username": "sample_recorded_by_username",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `DELETE /api/platform/subscription-payments/{id}/`

- **Endpoint**: `DELETE /api/platform/subscription-payments/{id}/`
- **Summary**: Admin ledger of all ERP Customer Account Subscription Payments. Creating a payment here calls `record_tenant_subscription_payment()` to update the tenant's billing cycle and service status.

#### Example Request

```http
DELETE /api/platform/subscription-payments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/platform/tenants/`

- **Endpoint**: `GET /api/platform/tenants/`
- **Summary**: Manage ERP SaaS Customer Accounts (Tenants): - Admin recording of customer subscription payments (`POST /api/platform/tenants/{id}/record-payment/`) - Auto-discontinuing overdue services after 2 months payment due (`POST /api/platform/tenants/enforce-overdue/`) - Banning / Unbanning ERP customers (`POST /api/platform/tenants/{id}/ban/`, `/unban/`) - Manual discontinuation / reactivation & module management.

#### Example Request

```http
GET /api/platform/tenants/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "slug": "devrious-retail-group",
      "owner_name": "Kasun Perera",
      "owner_email": "kasun@devriousretail.lk",
      "owner_phone": "+94771234567",
      "tax_id": "TIN-100200300",
      "br_number": "PV-88990",
      "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
      "country": "Sri Lanka",
      "subscription_plan": "string",
      "subscription_plan_name": "string",
      "enabled_modules": "string",
      "subscription_status": "string",
      "is_service_active": "string",
      "billing_start_date": "string",
      "last_payment_date": "string",
      "next_payment_due_date": "string",
      "auto_discontinue_months": 2,
      "auto_discontinue_cutoff_date": "string",
      "days_overdue": 0,
      "is_overdue_for_discontinuation": "string",
      "discontinued_at": "string",
      "discontinued_reason": "string",
      "is_banned": "string",
      "banned_at": "string",
      "banned_reason": "string",
      "banned_by": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

---

### `POST /api/platform/tenants/`

- **Endpoint**: `POST /api/platform/tenants/`
- **Summary**: Manage ERP SaaS Customer Accounts (Tenants): - Admin recording of customer subscription payments (`POST /api/platform/tenants/{id}/record-payment/`) - Auto-discontinuing overdue services after 2 months payment due (`POST /api/platform/tenants/enforce-overdue/`) - Banning / Unbanning ERP customers (`POST /api/platform/tenants/{id}/ban/`, `/unban/`) - Manual discontinuation / reactivation & module management.

#### Example Request

```http
POST /api/platform/tenants/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_reason": "sample_banned_reason"
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "subscription_plan_name": "sample_subscription_plan_name",
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "auto_discontinue_cutoff_date": "2026-11-23",
  "days_overdue": 0,
  "is_overdue_for_discontinuation": true,
  "discontinued_at": "2026-11-23T10:30:00+05:30",
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `POST /api/platform/tenants/enforce-overdue/`

- **Endpoint**: `POST /api/platform/tenants/enforce-overdue/`
- **Summary**: Auto-Discontinue Services for All ERP Customer Tenants Overdue by >= 2 Months

#### Example Request

```http
POST /api/platform/tenants/enforce-overdue/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "as_of_date": "2026-11-23"
}
```

#### Example Response (`200 OK`)

```json
{
  "checked_date": "2026-11-23",
  "discontinued_tenant_ids": [
    4
  ],
  "discontinued_count": 1,
  "past_due_tenant_ids": [
    3
  ],
  "past_due_count": 1,
  "active_count": 12
}
```

---

### `GET /api/platform/tenants/{id}/`

- **Endpoint**: `GET /api/platform/tenants/{id}/`
- **Summary**: Manage ERP SaaS Customer Accounts (Tenants): - Admin recording of customer subscription payments (`POST /api/platform/tenants/{id}/record-payment/`) - Auto-discontinuing overdue services after 2 months payment due (`POST /api/platform/tenants/enforce-overdue/`) - Banning / Unbanning ERP customers (`POST /api/platform/tenants/{id}/ban/`, `/unban/`) - Manual discontinuation / reactivation & module management.

#### Example Request

```http
GET /api/platform/tenants/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "subscription_plan_name": "sample_subscription_plan_name",
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "auto_discontinue_cutoff_date": "2026-11-23",
  "days_overdue": 0,
  "is_overdue_for_discontinuation": true,
  "discontinued_at": "2026-11-23T10:30:00+05:30",
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `PUT /api/platform/tenants/{id}/`

- **Endpoint**: `PUT /api/platform/tenants/{id}/`
- **Summary**: Manage ERP SaaS Customer Accounts (Tenants): - Admin recording of customer subscription payments (`POST /api/platform/tenants/{id}/record-payment/`) - Auto-discontinuing overdue services after 2 months payment due (`POST /api/platform/tenants/enforce-overdue/`) - Banning / Unbanning ERP customers (`POST /api/platform/tenants/{id}/ban/`, `/unban/`) - Manual discontinuation / reactivation & module management.

#### Example Request

```http
PUT /api/platform/tenants/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_reason": "sample_banned_reason"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "subscription_plan_name": "sample_subscription_plan_name",
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "auto_discontinue_cutoff_date": "2026-11-23",
  "days_overdue": 0,
  "is_overdue_for_discontinuation": true,
  "discontinued_at": "2026-11-23T10:30:00+05:30",
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `PATCH /api/platform/tenants/{id}/`

- **Endpoint**: `PATCH /api/platform/tenants/{id}/`
- **Summary**: Manage ERP SaaS Customer Accounts (Tenants): - Admin recording of customer subscription payments (`POST /api/platform/tenants/{id}/record-payment/`) - Auto-discontinuing overdue services after 2 months payment due (`POST /api/platform/tenants/enforce-overdue/`) - Banning / Unbanning ERP customers (`POST /api/platform/tenants/{id}/ban/`, `/unban/`) - Manual discontinuation / reactivation & module management.

#### Example Request

```http
PATCH /api/platform/tenants/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_reason": "sample_banned_reason"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "subscription_plan_name": "sample_subscription_plan_name",
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "auto_discontinue_cutoff_date": "2026-11-23",
  "days_overdue": 0,
  "is_overdue_for_discontinuation": true,
  "discontinued_at": "2026-11-23T10:30:00+05:30",
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `DELETE /api/platform/tenants/{id}/`

- **Endpoint**: `DELETE /api/platform/tenants/{id}/`
- **Summary**: Manage ERP SaaS Customer Accounts (Tenants): - Admin recording of customer subscription payments (`POST /api/platform/tenants/{id}/record-payment/`) - Auto-discontinuing overdue services after 2 months payment due (`POST /api/platform/tenants/enforce-overdue/`) - Banning / Unbanning ERP customers (`POST /api/platform/tenants/{id}/ban/`, `/unban/`) - Manual discontinuation / reactivation & module management.

#### Example Request

```http
DELETE /api/platform/tenants/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/platform/tenants/{id}/ban/`

- **Endpoint**: `POST /api/platform/tenants/{id}/ban/`
- **Summary**: Ban an ERP Customer Account (Tenant)

#### Example Request

```http
POST /api/platform/tenants/{id}/ban/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "reason": "Policy compliance / administrative action"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "subscription_plan_name": "sample_subscription_plan_name",
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "auto_discontinue_cutoff_date": "2026-11-23",
  "days_overdue": 0,
  "is_overdue_for_discontinuation": true,
  "discontinued_at": "2026-11-23T10:30:00+05:30",
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `POST /api/platform/tenants/{id}/check-overdue/`

- **Endpoint**: `POST /api/platform/tenants/{id}/check-overdue/`
- **Summary**: Check & Enforce 2-Month Overdue Policy for Single Tenant

#### Example Request

```http
POST /api/platform/tenants/{id}/check-overdue/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_reason": "sample_banned_reason"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "subscription_plan_name": "sample_subscription_plan_name",
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "auto_discontinue_cutoff_date": "2026-11-23",
  "days_overdue": 0,
  "is_overdue_for_discontinuation": true,
  "discontinued_at": "2026-11-23T10:30:00+05:30",
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `POST /api/platform/tenants/{id}/discontinue/`

- **Endpoint**: `POST /api/platform/tenants/{id}/discontinue/`
- **Summary**: Manually Discontinue ERP Customer Services

#### Example Request

```http
POST /api/platform/tenants/{id}/discontinue/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "reason": "Policy compliance / administrative action"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "subscription_plan_name": "sample_subscription_plan_name",
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "auto_discontinue_cutoff_date": "2026-11-23",
  "days_overdue": 0,
  "is_overdue_for_discontinuation": true,
  "discontinued_at": "2026-11-23T10:30:00+05:30",
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `POST /api/platform/tenants/{id}/reactivate/`

- **Endpoint**: `POST /api/platform/tenants/{id}/reactivate/`
- **Summary**: Reactivate Discontinued ERP Customer Services

#### Example Request

```http
POST /api/platform/tenants/{id}/reactivate/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_reason": "sample_banned_reason"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "subscription_plan_name": "sample_subscription_plan_name",
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "auto_discontinue_cutoff_date": "2026-11-23",
  "days_overdue": 0,
  "is_overdue_for_discontinuation": true,
  "discontinued_at": "2026-11-23T10:30:00+05:30",
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `POST /api/platform/tenants/{id}/record-payment/`

- **Endpoint**: `POST /api/platform/tenants/{id}/record-payment/`
- **Summary**: Record ERP Customer Subscription Payment (Admin Only) — Updates due date & reactivates service

#### Example Request

```http
POST /api/platform/tenants/{id}/record-payment/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "amount": "35000.00",
  "currency": "LKR",
  "payment_date": "2026-11-23",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "BOC-SLIP-20261123-01",
  "months_covered": 1,
  "notes": "Monthly subscription payment verified and recorded by Platform Admin."
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "public_id": "d4e5f6a7-1234-4b5c-8901-23456789abcd",
  "receipt_number": "SUB-RCP-20261123-9A8B7C",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "plan": 1,
  "amount": "35000.00",
  "currency": "LKR",
  "payment_date": "2026-11-23",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "BOC-SLIP-20261123-01",
  "months_covered": 1,
  "period_start": "2026-11-23",
  "period_end": "2026-12-23",
  "status": "COMPLETED",
  "recorded_by": 1,
  "recorded_by_username": "admin",
  "notes": "Monthly subscription payment verified and recorded by Platform Admin.",
  "created_at": "2026-11-23T10:15:00+05:30"
}
```

---

### `POST /api/platform/tenants/{id}/unban/`

- **Endpoint**: `POST /api/platform/tenants/{id}/unban/`
- **Summary**: Unban an ERP Customer Account (Tenant)

#### Example Request

```http
POST /api/platform/tenants/{id}/unban/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "notes": "Verified and recorded by administrator."
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "owner_name": "Kasun Perera",
  "owner_email": "kasun@devriousretail.lk",
  "owner_phone": "+94771234567",
  "tax_id": "TIN-100200300",
  "br_number": "PV-88990",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "country": "Sri Lanka",
  "subscription_plan": 1,
  "subscription_plan_name": "sample_subscription_plan_name",
  "enabled_modules": {
    "key": "value"
  },
  "subscription_status": "TRIAL",
  "is_service_active": true,
  "billing_start_date": "2026-11-23",
  "last_payment_date": "2026-11-23",
  "next_payment_due_date": "2026-11-23",
  "auto_discontinue_months": 2,
  "auto_discontinue_cutoff_date": "2026-11-23",
  "days_overdue": 0,
  "is_overdue_for_discontinuation": true,
  "discontinued_at": "2026-11-23T10:30:00+05:30",
  "discontinued_reason": "sample_discontinued_reason",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30"
}
```

---

## 3. Companies, Branches, User Management, Customer/User Banning & Granular Permissions

### `GET /api/activity-logs/`

- **Endpoint**: `GET /api/activity-logs/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/activity-logs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "username": "kasun_admin",
      "tenant_name": "Devrious Retail Group (Pvt) Ltd",
      "event_type": "string",
      "ip_address": "string",
      "user_agent": "string",
      "details": "string",
      "created_at": "string",
      "user": 2,
      "tenant": 1
    }
  ]
}
```

---

### `GET /api/activity-logs/{id}/`

- **Endpoint**: `GET /api/activity-logs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/activity-logs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "username": "kasun_admin",
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "event_type": "LOGIN",
  "ip_address": "sample_ip_address",
  "user_agent": "sample_user_agent",
  "details": {
    "key": "value"
  },
  "created_at": "2026-11-23T10:30:00+05:30",
  "user": 2,
  "tenant": 1
}
```

---

### `GET /api/branches/`

- **Endpoint**: `GET /api/branches/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/branches/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "company_name": "Devrious Retail Group (Pvt) Ltd",
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "code": "CMB-01",
      "branch_type": "string",
      "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
      "city": "Colombo",
      "phone": "+94771234567",
      "store_hours": "string",
      "is_active": "string",
      "created_at": "string",
      "updated_at": "string",
      "tenant": 1,
      "company": 1
    }
  ]
}
```

---

### `POST /api/branches/`

- **Endpoint**: `POST /api/branches/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/branches/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "branch_type": "STORE",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "phone": "+94771234567",
  "store_hours": "sample_store_hours",
  "is_active": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "branch_type": "STORE",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "phone": "+94771234567",
  "store_hours": "sample_store_hours",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1
}
```

---

### `GET /api/branches/{id}/`

- **Endpoint**: `GET /api/branches/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/branches/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "branch_type": "STORE",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "phone": "+94771234567",
  "store_hours": "sample_store_hours",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1
}
```

---

### `PUT /api/branches/{id}/`

- **Endpoint**: `PUT /api/branches/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/branches/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "branch_type": "STORE",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "phone": "+94771234567",
  "store_hours": "sample_store_hours",
  "is_active": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "branch_type": "STORE",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "phone": "+94771234567",
  "store_hours": "sample_store_hours",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1
}
```

---

### `PATCH /api/branches/{id}/`

- **Endpoint**: `PATCH /api/branches/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/branches/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "branch_type": "STORE",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "phone": "+94771234567",
  "store_hours": "sample_store_hours",
  "is_active": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "branch_type": "STORE",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "phone": "+94771234567",
  "store_hours": "sample_store_hours",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1
}
```

---

### `DELETE /api/branches/{id}/`

- **Endpoint**: `DELETE /api/branches/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/branches/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/companies/`

- **Endpoint**: `GET /api/companies/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/companies/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "tenant_name": "Devrious Retail Group (Pvt) Ltd",
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "code": "CMB-01",
      "legal_name": "Devrious Retail Group (Pvt) Ltd",
      "br_number": "PV-88990",
      "tin_number": "TIN-100200300",
      "vat_reg_number": "VAT-100200300-7000",
      "svat_number": "SVAT-RIS-2026-01",
      "is_vat_registered": "string",
      "base_currency": "LKR",
      "language": "string",
      "fiscal_year_start_month": "string",
      "default_vat_rate": "18.00",
      "default_nbt_rate": "2.00",
      "round_to_nearest_rupee": "string",
      "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
      "phone": "+94771234567",
      "email": "kasun@devriousretail.lk",
      "is_active": "string",
      "created_at": "string",
      "updated_at": "string",
      "tenant": 1
    }
  ]
}
```

---

### `POST /api/companies/`

- **Endpoint**: `POST /api/companies/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/companies/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "legal_name": "Devrious Retail Group (Pvt) Ltd",
  "br_number": "PV-88990",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "svat_number": "SVAT-RIS-2026-01",
  "is_vat_registered": true,
  "base_currency": "LKR",
  "language": "en",
  "fiscal_year_start_month": 1,
  "default_vat_rate": "18.00",
  "default_nbt_rate": "2.00",
  "round_to_nearest_rupee": true,
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "is_active": true,
  "tenant": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "legal_name": "Devrious Retail Group (Pvt) Ltd",
  "br_number": "PV-88990",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "svat_number": "SVAT-RIS-2026-01",
  "is_vat_registered": true,
  "base_currency": "LKR",
  "language": "en",
  "fiscal_year_start_month": 1,
  "default_vat_rate": "18.00",
  "default_nbt_rate": "2.00",
  "round_to_nearest_rupee": true,
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `GET /api/companies/{id}/`

- **Endpoint**: `GET /api/companies/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/companies/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "legal_name": "Devrious Retail Group (Pvt) Ltd",
  "br_number": "PV-88990",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "svat_number": "SVAT-RIS-2026-01",
  "is_vat_registered": true,
  "base_currency": "LKR",
  "language": "en",
  "fiscal_year_start_month": 1,
  "default_vat_rate": "18.00",
  "default_nbt_rate": "2.00",
  "round_to_nearest_rupee": true,
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `PUT /api/companies/{id}/`

- **Endpoint**: `PUT /api/companies/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/companies/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "legal_name": "Devrious Retail Group (Pvt) Ltd",
  "br_number": "PV-88990",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "svat_number": "SVAT-RIS-2026-01",
  "is_vat_registered": true,
  "base_currency": "LKR",
  "language": "en",
  "fiscal_year_start_month": 1,
  "default_vat_rate": "18.00",
  "default_nbt_rate": "2.00",
  "round_to_nearest_rupee": true,
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "is_active": true,
  "tenant": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "legal_name": "Devrious Retail Group (Pvt) Ltd",
  "br_number": "PV-88990",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "svat_number": "SVAT-RIS-2026-01",
  "is_vat_registered": true,
  "base_currency": "LKR",
  "language": "en",
  "fiscal_year_start_month": 1,
  "default_vat_rate": "18.00",
  "default_nbt_rate": "2.00",
  "round_to_nearest_rupee": true,
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `PATCH /api/companies/{id}/`

- **Endpoint**: `PATCH /api/companies/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/companies/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "legal_name": "Devrious Retail Group (Pvt) Ltd",
  "br_number": "PV-88990",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "svat_number": "SVAT-RIS-2026-01",
  "is_vat_registered": true,
  "base_currency": "LKR",
  "language": "en",
  "fiscal_year_start_month": 1,
  "default_vat_rate": "18.00",
  "default_nbt_rate": "2.00",
  "round_to_nearest_rupee": true,
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "is_active": true,
  "tenant": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "legal_name": "Devrious Retail Group (Pvt) Ltd",
  "br_number": "PV-88990",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "svat_number": "SVAT-RIS-2026-01",
  "is_vat_registered": true,
  "base_currency": "LKR",
  "language": "en",
  "fiscal_year_start_month": 1,
  "default_vat_rate": "18.00",
  "default_nbt_rate": "2.00",
  "round_to_nearest_rupee": true,
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `DELETE /api/companies/{id}/`

- **Endpoint**: `DELETE /api/companies/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/companies/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/permissions/`

- **Endpoint**: `GET /api/permissions/`
- **Summary**: Granular RBAC & ABAC permissions + temporary user overrides and delegation (ERP-PLAT-006, ERP-PLAT-008).

#### Example Request

```http
GET /api/permissions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "user": 2,
      "username": "kasun_admin",
      "module": "string",
      "model_name": "string",
      "object_id": "string",
      "can_view": "string",
      "can_add": "string",
      "can_change": "string",
      "can_delete": "string",
      "can_approve": "string",
      "can_delegate": "string",
      "is_temporary_override": "string",
      "constraints_json": "string",
      "granted_by": "string",
      "granted_by_username": "string",
      "parent": "string",
      "expires_at": "string",
      "created_at": "string"
    }
  ]
}
```

---

### `POST /api/permissions/`

- **Endpoint**: `POST /api/permissions/`
- **Summary**: Granular RBAC & ABAC permissions + temporary user overrides and delegation (ERP-PLAT-006, ERP-PLAT-008).

#### Example Request

```http
POST /api/permissions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "user": 2,
  "module": "PLATFORM",
  "model_name": "sample_model_name",
  "object_id": 1,
  "can_view": true,
  "can_add": true,
  "can_change": true,
  "can_delete": true,
  "can_approve": true,
  "can_delegate": true,
  "is_temporary_override": true,
  "constraints_json": {
    "key": "value"
  },
  "expires_at": "2026-11-23T10:30:00+05:30"
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "user": 2,
  "username": "kasun_admin",
  "module": "PLATFORM",
  "model_name": "sample_model_name",
  "object_id": 1,
  "can_view": true,
  "can_add": true,
  "can_change": true,
  "can_delete": true,
  "can_approve": true,
  "can_delegate": true,
  "is_temporary_override": true,
  "constraints_json": {
    "key": "value"
  },
  "granted_by": 1,
  "granted_by_username": "sample_granted_by_username",
  "parent": 1,
  "expires_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `GET /api/permissions/{id}/`

- **Endpoint**: `GET /api/permissions/{id}/`
- **Summary**: Granular RBAC & ABAC permissions + temporary user overrides and delegation (ERP-PLAT-006, ERP-PLAT-008).

#### Example Request

```http
GET /api/permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "user": 2,
  "username": "kasun_admin",
  "module": "PLATFORM",
  "model_name": "sample_model_name",
  "object_id": 1,
  "can_view": true,
  "can_add": true,
  "can_change": true,
  "can_delete": true,
  "can_approve": true,
  "can_delegate": true,
  "is_temporary_override": true,
  "constraints_json": {
    "key": "value"
  },
  "granted_by": 1,
  "granted_by_username": "sample_granted_by_username",
  "parent": 1,
  "expires_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `PUT /api/permissions/{id}/`

- **Endpoint**: `PUT /api/permissions/{id}/`
- **Summary**: Granular RBAC & ABAC permissions + temporary user overrides and delegation (ERP-PLAT-006, ERP-PLAT-008).

#### Example Request

```http
PUT /api/permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "user": 2,
  "module": "PLATFORM",
  "model_name": "sample_model_name",
  "object_id": 1,
  "can_view": true,
  "can_add": true,
  "can_change": true,
  "can_delete": true,
  "can_approve": true,
  "can_delegate": true,
  "is_temporary_override": true,
  "constraints_json": {
    "key": "value"
  },
  "expires_at": "2026-11-23T10:30:00+05:30"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "user": 2,
  "username": "kasun_admin",
  "module": "PLATFORM",
  "model_name": "sample_model_name",
  "object_id": 1,
  "can_view": true,
  "can_add": true,
  "can_change": true,
  "can_delete": true,
  "can_approve": true,
  "can_delegate": true,
  "is_temporary_override": true,
  "constraints_json": {
    "key": "value"
  },
  "granted_by": 1,
  "granted_by_username": "sample_granted_by_username",
  "parent": 1,
  "expires_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `PATCH /api/permissions/{id}/`

- **Endpoint**: `PATCH /api/permissions/{id}/`
- **Summary**: Granular RBAC & ABAC permissions + temporary user overrides and delegation (ERP-PLAT-006, ERP-PLAT-008).

#### Example Request

```http
PATCH /api/permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "user": 2,
  "module": "PLATFORM",
  "model_name": "sample_model_name",
  "object_id": 1,
  "can_view": true,
  "can_add": true,
  "can_change": true,
  "can_delete": true,
  "can_approve": true,
  "can_delegate": true,
  "is_temporary_override": true,
  "constraints_json": {
    "key": "value"
  },
  "expires_at": "2026-11-23T10:30:00+05:30"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "user": 2,
  "username": "kasun_admin",
  "module": "PLATFORM",
  "model_name": "sample_model_name",
  "object_id": 1,
  "can_view": true,
  "can_add": true,
  "can_change": true,
  "can_delete": true,
  "can_approve": true,
  "can_delegate": true,
  "is_temporary_override": true,
  "constraints_json": {
    "key": "value"
  },
  "granted_by": 1,
  "granted_by_username": "sample_granted_by_username",
  "parent": 1,
  "expires_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30"
}
```

---

### `DELETE /api/permissions/{id}/`

- **Endpoint**: `DELETE /api/permissions/{id}/`
- **Summary**: Granular RBAC & ABAC permissions + temporary user overrides and delegation (ERP-PLAT-006, ERP-PLAT-008).

#### Example Request

```http
DELETE /api/permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/users/`

- **Endpoint**: `GET /api/users/`
- **Summary**: Complete User Management for ERP system's customers and staff: - Create, update, list, filter users per Tenant / Company / Branch / Role - Ban / Unban users (`POST /api/users/{id}/ban/`, `/unban/`) - Suspend / Unsuspend users (`POST /api/users/{id}/suspend/`, `/unsuspend/`) - Change role (`POST /api/users/{id}/change-role/`) - Force password reset (`POST /api/users/{id}/force-password-reset/`) - Profile endpoint (`GET/PATCH /api/users/me/`)

#### Example Request

```http
GET /api/users/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "username": "kasun_admin",
      "email": "kasun@devriousretail.lk",
      "first_name": "Kasun",
      "last_name": "Perera",
      "phone": "+94771234567",
      "tenant": 1,
      "tenant_name": "Devrious Retail Group (Pvt) Ltd",
      "company": 1,
      "company_name": "Devrious Retail Group (Pvt) Ltd",
      "branch": 1,
      "branch_name": "Colombo Flagship Store & Main Warehouse",
      "role": "string",
      "is_active": "string",
      "is_staff": "string",
      "is_superuser": "string",
      "is_banned": "string",
      "banned_at": "string",
      "banned_reason": "string",
      "banned_by": "string",
      "is_suspended": "string",
      "suspended_until": "string",
      "suspension_reason": "string",
      "two_factor_enabled": "string",
      "is_email_verified": "string",
      "is_phone_verified": "string",
      "failed_login_attempts": "string",
      "last_login": "string",
      "last_login_ip": "string",
      "must_change_password": "string",
      "date_joined": "string"
    }
  ]
}
```

---

### `POST /api/users/`

- **Endpoint**: `POST /api/users/`
- **Summary**: Complete User Management for ERP system's customers and staff: - Create, update, list, filter users per Tenant / Company / Branch / Role - Ban / Unban users (`POST /api/users/{id}/ban/`, `/unban/`) - Suspend / Unsuspend users (`POST /api/users/{id}/suspend/`, `/unsuspend/`) - Change role (`POST /api/users/{id}/change-role/`) - Force password reset (`POST /api/users/{id}/force-password-reset/`) - Profile endpoint (`GET/PATCH /api/users/me/`)

#### Example Request

```http
POST /api/users/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "password": "StrongPassword123!",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_banned": false,
  "banned_reason": "sample_banned_reason",
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "must_change_password": true
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "company": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "branch": 1,
  "branch_name": "Colombo Flagship Store & Main Warehouse",
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "failed_login_attempts": 1,
  "last_login": "2026-11-23T10:30:00+05:30",
  "last_login_ip": "sample_last_login_ip",
  "must_change_password": true,
  "date_joined": "2026-11-23T10:30:00+05:30"
}
```

---

### `GET /api/users/me/`

- **Endpoint**: `GET /api/users/me/`
- **Summary**: Get or update current authenticated user profile

#### Example Request

```http
GET /api/users/me/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "company": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "branch": 1,
  "branch_name": "Colombo Flagship Store & Main Warehouse",
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "failed_login_attempts": 1,
  "last_login": "2026-11-23T10:30:00+05:30",
  "last_login_ip": "sample_last_login_ip",
  "must_change_password": true,
  "date_joined": "2026-11-23T10:30:00+05:30"
}
```

---

### `PATCH /api/users/me/`

- **Endpoint**: `PATCH /api/users/me/`
- **Summary**: Get or update current authenticated user profile

#### Example Request

```http
PATCH /api/users/me/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "password": "StrongPassword123!",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_banned": false,
  "banned_reason": "sample_banned_reason",
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "must_change_password": true
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "company": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "branch": 1,
  "branch_name": "Colombo Flagship Store & Main Warehouse",
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "failed_login_attempts": 1,
  "last_login": "2026-11-23T10:30:00+05:30",
  "last_login_ip": "sample_last_login_ip",
  "must_change_password": true,
  "date_joined": "2026-11-23T10:30:00+05:30"
}
```

---

### `GET /api/users/{id}/`

- **Endpoint**: `GET /api/users/{id}/`
- **Summary**: Complete User Management for ERP system's customers and staff: - Create, update, list, filter users per Tenant / Company / Branch / Role - Ban / Unban users (`POST /api/users/{id}/ban/`, `/unban/`) - Suspend / Unsuspend users (`POST /api/users/{id}/suspend/`, `/unsuspend/`) - Change role (`POST /api/users/{id}/change-role/`) - Force password reset (`POST /api/users/{id}/force-password-reset/`) - Profile endpoint (`GET/PATCH /api/users/me/`)

#### Example Request

```http
GET /api/users/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "company": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "branch": 1,
  "branch_name": "Colombo Flagship Store & Main Warehouse",
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "failed_login_attempts": 1,
  "last_login": "2026-11-23T10:30:00+05:30",
  "last_login_ip": "sample_last_login_ip",
  "must_change_password": true,
  "date_joined": "2026-11-23T10:30:00+05:30"
}
```

---

### `PUT /api/users/{id}/`

- **Endpoint**: `PUT /api/users/{id}/`
- **Summary**: Complete User Management for ERP system's customers and staff: - Create, update, list, filter users per Tenant / Company / Branch / Role - Ban / Unban users (`POST /api/users/{id}/ban/`, `/unban/`) - Suspend / Unsuspend users (`POST /api/users/{id}/suspend/`, `/unsuspend/`) - Change role (`POST /api/users/{id}/change-role/`) - Force password reset (`POST /api/users/{id}/force-password-reset/`) - Profile endpoint (`GET/PATCH /api/users/me/`)

#### Example Request

```http
PUT /api/users/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "password": "StrongPassword123!",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_banned": false,
  "banned_reason": "sample_banned_reason",
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "must_change_password": true
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "company": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "branch": 1,
  "branch_name": "Colombo Flagship Store & Main Warehouse",
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "failed_login_attempts": 1,
  "last_login": "2026-11-23T10:30:00+05:30",
  "last_login_ip": "sample_last_login_ip",
  "must_change_password": true,
  "date_joined": "2026-11-23T10:30:00+05:30"
}
```

---

### `PATCH /api/users/{id}/`

- **Endpoint**: `PATCH /api/users/{id}/`
- **Summary**: Complete User Management for ERP system's customers and staff: - Create, update, list, filter users per Tenant / Company / Branch / Role - Ban / Unban users (`POST /api/users/{id}/ban/`, `/unban/`) - Suspend / Unsuspend users (`POST /api/users/{id}/suspend/`, `/unsuspend/`) - Change role (`POST /api/users/{id}/change-role/`) - Force password reset (`POST /api/users/{id}/force-password-reset/`) - Profile endpoint (`GET/PATCH /api/users/me/`)

#### Example Request

```http
PATCH /api/users/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "password": "StrongPassword123!",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_banned": false,
  "banned_reason": "sample_banned_reason",
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "must_change_password": true
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "company": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "branch": 1,
  "branch_name": "Colombo Flagship Store & Main Warehouse",
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "failed_login_attempts": 1,
  "last_login": "2026-11-23T10:30:00+05:30",
  "last_login_ip": "sample_last_login_ip",
  "must_change_password": true,
  "date_joined": "2026-11-23T10:30:00+05:30"
}
```

---

### `DELETE /api/users/{id}/`

- **Endpoint**: `DELETE /api/users/{id}/`
- **Summary**: Complete User Management for ERP system's customers and staff: - Create, update, list, filter users per Tenant / Company / Branch / Role - Ban / Unban users (`POST /api/users/{id}/ban/`, `/unban/`) - Suspend / Unsuspend users (`POST /api/users/{id}/suspend/`, `/unsuspend/`) - Change role (`POST /api/users/{id}/change-role/`) - Force password reset (`POST /api/users/{id}/force-password-reset/`) - Profile endpoint (`GET/PATCH /api/users/me/`)

#### Example Request

```http
DELETE /api/users/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/users/{id}/ban/`

- **Endpoint**: `POST /api/users/{id}/ban/`
- **Summary**: Ban a User

#### Example Request

```http
POST /api/users/{id}/ban/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "reason": "Policy compliance / administrative action"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "company": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "branch": 1,
  "branch_name": "Colombo Flagship Store & Main Warehouse",
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "failed_login_attempts": 1,
  "last_login": "2026-11-23T10:30:00+05:30",
  "last_login_ip": "sample_last_login_ip",
  "must_change_password": true,
  "date_joined": "2026-11-23T10:30:00+05:30"
}
```

---

### `POST /api/users/{id}/change-role/`

- **Endpoint**: `POST /api/users/{id}/change-role/`
- **Summary**: Change User Role (RBAC)

#### Example Request

```http
POST /api/users/{id}/change-role/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "password": "StrongPassword123!",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_banned": false,
  "banned_reason": "sample_banned_reason",
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "must_change_password": true
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "company": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "branch": 1,
  "branch_name": "Colombo Flagship Store & Main Warehouse",
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "failed_login_attempts": 1,
  "last_login": "2026-11-23T10:30:00+05:30",
  "last_login_ip": "sample_last_login_ip",
  "must_change_password": true,
  "date_joined": "2026-11-23T10:30:00+05:30"
}
```

---

### `POST /api/users/{id}/force-password-reset/`

- **Endpoint**: `POST /api/users/{id}/force-password-reset/`
- **Summary**: Force Password Reset for a User

#### Example Request

```http
POST /api/users/{id}/force-password-reset/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "password": "StrongPassword123!",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_banned": false,
  "banned_reason": "sample_banned_reason",
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "must_change_password": true
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "company": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "branch": 1,
  "branch_name": "Colombo Flagship Store & Main Warehouse",
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "failed_login_attempts": 1,
  "last_login": "2026-11-23T10:30:00+05:30",
  "last_login_ip": "sample_last_login_ip",
  "must_change_password": true,
  "date_joined": "2026-11-23T10:30:00+05:30"
}
```

---

### `POST /api/users/{id}/suspend/`

- **Endpoint**: `POST /api/users/{id}/suspend/`
- **Summary**: Temporarily Suspend a User Account

#### Example Request

```http
POST /api/users/{id}/suspend/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "reason": "Policy compliance / administrative action",
  "suspended_until": "2026-11-23T10:30:00+05:30"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "company": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "branch": 1,
  "branch_name": "Colombo Flagship Store & Main Warehouse",
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "failed_login_attempts": 1,
  "last_login": "2026-11-23T10:30:00+05:30",
  "last_login_ip": "sample_last_login_ip",
  "must_change_password": true,
  "date_joined": "2026-11-23T10:30:00+05:30"
}
```

---

### `POST /api/users/{id}/unban/`

- **Endpoint**: `POST /api/users/{id}/unban/`
- **Summary**: Unban a User

#### Example Request

```http
POST /api/users/{id}/unban/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "notes": "Verified and recorded by administrator."
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "company": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "branch": 1,
  "branch_name": "Colombo Flagship Store & Main Warehouse",
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "failed_login_attempts": 1,
  "last_login": "2026-11-23T10:30:00+05:30",
  "last_login_ip": "sample_last_login_ip",
  "must_change_password": true,
  "date_joined": "2026-11-23T10:30:00+05:30"
}
```

---

### `POST /api/users/{id}/unsuspend/`

- **Endpoint**: `POST /api/users/{id}/unsuspend/`
- **Summary**: Lift User Suspension

#### Example Request

```http
POST /api/users/{id}/unsuspend/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "password": "StrongPassword123!",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_banned": false,
  "banned_reason": "sample_banned_reason",
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "must_change_password": true
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "username": "kasun_admin",
  "email": "kasun@devriousretail.lk",
  "first_name": "Kasun",
  "last_name": "Perera",
  "phone": "+94771234567",
  "tenant": 1,
  "tenant_name": "Devrious Retail Group (Pvt) Ltd",
  "company": 1,
  "company_name": "Devrious Retail Group (Pvt) Ltd",
  "branch": 1,
  "branch_name": "Colombo Flagship Store & Main Warehouse",
  "role": "PLATFORM_ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "banned_by": 1,
  "is_suspended": false,
  "suspended_until": "2026-11-23T10:30:00+05:30",
  "suspension_reason": "sample_suspension_reason",
  "two_factor_enabled": true,
  "is_email_verified": true,
  "is_phone_verified": true,
  "failed_login_attempts": 1,
  "last_login": "2026-11-23T10:30:00+05:30",
  "last_login_ip": "sample_last_login_ip",
  "must_change_password": true,
  "date_joined": "2026-11-23T10:30:00+05:30"
}
```

---

## 4. Workflows, Approvals, Audit Trail, Document Versions, Attachments, Notifications & Webhooks

### `GET /api/attachments/`

- **Endpoint**: `GET /api/attachments/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/attachments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "target_model": "string",
      "target_object_id": "string",
      "file_name": "string",
      "file": "string",
      "external_url": "string",
      "ocr_extracted_text": "string",
      "created_at": "string",
      "tenant": 1,
      "uploaded_by": "string"
    }
  ]
}
```

---

### `POST /api/attachments/`

- **Endpoint**: `POST /api/attachments/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/attachments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "file_name": "sample_file_name",
  "file": "sample_file",
  "external_url": "https://erp.devrious.com/files/sample.pdf",
  "ocr_extracted_text": "sample_ocr_extracted_text",
  "tenant": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "file_name": "sample_file_name",
  "file": "https://erp.devrious.com/files/sample.pdf",
  "external_url": "https://erp.devrious.com/files/sample.pdf",
  "ocr_extracted_text": "sample_ocr_extracted_text",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "uploaded_by": 1
}
```

---

### `GET /api/attachments/{id}/`

- **Endpoint**: `GET /api/attachments/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/attachments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "file_name": "sample_file_name",
  "file": "https://erp.devrious.com/files/sample.pdf",
  "external_url": "https://erp.devrious.com/files/sample.pdf",
  "ocr_extracted_text": "sample_ocr_extracted_text",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "uploaded_by": 1
}
```

---

### `PUT /api/attachments/{id}/`

- **Endpoint**: `PUT /api/attachments/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/attachments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "file_name": "sample_file_name",
  "file": "sample_file",
  "external_url": "https://erp.devrious.com/files/sample.pdf",
  "ocr_extracted_text": "sample_ocr_extracted_text",
  "tenant": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "file_name": "sample_file_name",
  "file": "https://erp.devrious.com/files/sample.pdf",
  "external_url": "https://erp.devrious.com/files/sample.pdf",
  "ocr_extracted_text": "sample_ocr_extracted_text",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "uploaded_by": 1
}
```

---

### `PATCH /api/attachments/{id}/`

- **Endpoint**: `PATCH /api/attachments/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/attachments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "file_name": "sample_file_name",
  "file": "sample_file",
  "external_url": "https://erp.devrious.com/files/sample.pdf",
  "ocr_extracted_text": "sample_ocr_extracted_text",
  "tenant": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "file_name": "sample_file_name",
  "file": "https://erp.devrious.com/files/sample.pdf",
  "external_url": "https://erp.devrious.com/files/sample.pdf",
  "ocr_extracted_text": "sample_ocr_extracted_text",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "uploaded_by": 1
}
```

---

### `DELETE /api/attachments/{id}/`

- **Endpoint**: `DELETE /api/attachments/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/attachments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/audit-logs/`

- **Endpoint**: `GET /api/audit-logs/`
- **Summary**: Immutable Audit Logs (ERP-PLAT-015, ERP-PLAT-046). Accessible to Administrators and Auditors.

#### Example Request

```http
GET /api/audit-logs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "actor_username": "string",
      "action_id": "string",
      "action": "string",
      "target_model": "string",
      "target_object_id": "string",
      "before_state": "string",
      "after_state": "string",
      "ip_address": "string",
      "notes": "Verified and recorded by administrator.",
      "created_at": "string",
      "tenant": 1,
      "actor": "string"
    }
  ]
}
```

---

### `GET /api/audit-logs/{id}/`

- **Endpoint**: `GET /api/audit-logs/{id}/`
- **Summary**: Immutable Audit Logs (ERP-PLAT-015, ERP-PLAT-046). Accessible to Administrators and Auditors.

#### Example Request

```http
GET /api/audit-logs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "actor_username": "sample_actor_username",
  "action_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "action": "sample_action",
  "target_model": "sample_target_model",
  "target_object_id": "sample_target_object_id",
  "before_state": {
    "key": "value"
  },
  "after_state": {
    "key": "value"
  },
  "ip_address": "sample_ip_address",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "actor": 1
}
```

---

### `GET /api/document-versions/`

- **Endpoint**: `GET /api/document-versions/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/document-versions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "target_model": "string",
      "target_object_id": "string",
      "version_number": "string",
      "snapshot_data": "string",
      "change_reason": "string",
      "created_at": "string",
      "tenant": 1,
      "changed_by": "string"
    }
  ]
}
```

---

### `GET /api/document-versions/{id}/`

- **Endpoint**: `GET /api/document-versions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/document-versions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "version_number": 1,
  "snapshot_data": {
    "key": "value"
  },
  "change_reason": "sample_change_reason",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "changed_by": 1
}
```

---

### `GET /api/notification-templates/`

- **Endpoint**: `GET /api/notification-templates/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/notification-templates/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "code": "CMB-01",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "channel": "string",
      "language": "string",
      "subject_template": "string",
      "body_template": "string",
      "is_active": "string",
      "created_at": "string",
      "tenant": 1
    }
  ]
}
```

---

### `POST /api/notification-templates/`

- **Endpoint**: `POST /api/notification-templates/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/notification-templates/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "channel": "IN_APP",
  "language": "sample_language",
  "subject_template": "sample_subject_template",
  "body_template": "sample_body_template",
  "is_active": true,
  "tenant": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "channel": "IN_APP",
  "language": "sample_language",
  "subject_template": "sample_subject_template",
  "body_template": "sample_body_template",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `GET /api/notification-templates/{id}/`

- **Endpoint**: `GET /api/notification-templates/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/notification-templates/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "channel": "IN_APP",
  "language": "sample_language",
  "subject_template": "sample_subject_template",
  "body_template": "sample_body_template",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `PUT /api/notification-templates/{id}/`

- **Endpoint**: `PUT /api/notification-templates/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/notification-templates/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "channel": "IN_APP",
  "language": "sample_language",
  "subject_template": "sample_subject_template",
  "body_template": "sample_body_template",
  "is_active": true,
  "tenant": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "channel": "IN_APP",
  "language": "sample_language",
  "subject_template": "sample_subject_template",
  "body_template": "sample_body_template",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `PATCH /api/notification-templates/{id}/`

- **Endpoint**: `PATCH /api/notification-templates/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/notification-templates/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "channel": "IN_APP",
  "language": "sample_language",
  "subject_template": "sample_subject_template",
  "body_template": "sample_body_template",
  "is_active": true,
  "tenant": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "channel": "IN_APP",
  "language": "sample_language",
  "subject_template": "sample_subject_template",
  "body_template": "sample_body_template",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `DELETE /api/notification-templates/{id}/`

- **Endpoint**: `DELETE /api/notification-templates/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/notification-templates/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/notifications/`

- **Endpoint**: `GET /api/notifications/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/notifications/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "recipient_address": "string",
      "channel": "string",
      "subject": "string",
      "message": "string",
      "status": "string",
      "related_model": "string",
      "related_object_id": "string",
      "created_at": "string",
      "tenant": 1,
      "recipient_user": "string"
    }
  ]
}
```

---

### `POST /api/notifications/`

- **Endpoint**: `POST /api/notifications/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/notifications/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "recipient_address": "sample_recipient_address",
  "channel": "IN_APP",
  "subject": "sample_subject",
  "message": "sample_message",
  "status": "QUEUED",
  "related_model": "sample_related_model",
  "related_object_id": "sample_related_object_id",
  "tenant": 1,
  "recipient_user": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "recipient_address": "sample_recipient_address",
  "channel": "IN_APP",
  "subject": "sample_subject",
  "message": "sample_message",
  "status": "QUEUED",
  "related_model": "sample_related_model",
  "related_object_id": "sample_related_object_id",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "recipient_user": 1
}
```

---

### `GET /api/notifications/{id}/`

- **Endpoint**: `GET /api/notifications/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/notifications/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "recipient_address": "sample_recipient_address",
  "channel": "IN_APP",
  "subject": "sample_subject",
  "message": "sample_message",
  "status": "QUEUED",
  "related_model": "sample_related_model",
  "related_object_id": "sample_related_object_id",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "recipient_user": 1
}
```

---

### `PUT /api/notifications/{id}/`

- **Endpoint**: `PUT /api/notifications/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/notifications/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "recipient_address": "sample_recipient_address",
  "channel": "IN_APP",
  "subject": "sample_subject",
  "message": "sample_message",
  "status": "QUEUED",
  "related_model": "sample_related_model",
  "related_object_id": "sample_related_object_id",
  "tenant": 1,
  "recipient_user": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "recipient_address": "sample_recipient_address",
  "channel": "IN_APP",
  "subject": "sample_subject",
  "message": "sample_message",
  "status": "QUEUED",
  "related_model": "sample_related_model",
  "related_object_id": "sample_related_object_id",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "recipient_user": 1
}
```

---

### `PATCH /api/notifications/{id}/`

- **Endpoint**: `PATCH /api/notifications/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/notifications/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "recipient_address": "sample_recipient_address",
  "channel": "IN_APP",
  "subject": "sample_subject",
  "message": "sample_message",
  "status": "QUEUED",
  "related_model": "sample_related_model",
  "related_object_id": "sample_related_object_id",
  "tenant": 1,
  "recipient_user": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "recipient_address": "sample_recipient_address",
  "channel": "IN_APP",
  "subject": "sample_subject",
  "message": "sample_message",
  "status": "QUEUED",
  "related_model": "sample_related_model",
  "related_object_id": "sample_related_object_id",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "recipient_user": 1
}
```

---

### `DELETE /api/notifications/{id}/`

- **Endpoint**: `DELETE /api/notifications/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/notifications/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/notifications/{id}/mark-read/`

- **Endpoint**: `POST /api/notifications/{id}/mark-read/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/notifications/{id}/mark-read/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "recipient_address": "sample_recipient_address",
  "channel": "IN_APP",
  "subject": "sample_subject",
  "message": "sample_message",
  "status": "QUEUED",
  "related_model": "sample_related_model",
  "related_object_id": "sample_related_object_id",
  "tenant": 1,
  "recipient_user": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "recipient_address": "sample_recipient_address",
  "channel": "IN_APP",
  "subject": "sample_subject",
  "message": "sample_message",
  "status": "QUEUED",
  "related_model": "sample_related_model",
  "related_object_id": "sample_related_object_id",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "recipient_user": 1
}
```

---

### `GET /api/webhooks/`

- **Endpoint**: `GET /api/webhooks/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/webhooks/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "event_name": "string",
      "target_url": "string",
      "secret_token": "string",
      "is_active": "string",
      "created_at": "string",
      "tenant": 1
    }
  ]
}
```

---

### `POST /api/webhooks/`

- **Endpoint**: `POST /api/webhooks/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/webhooks/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "event_name": "sample_event_name",
  "target_url": "https://erp.devrious.com/files/sample.pdf",
  "secret_token": "sample_secret_token",
  "is_active": true,
  "tenant": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "event_name": "sample_event_name",
  "target_url": "https://erp.devrious.com/files/sample.pdf",
  "secret_token": "sample_secret_token",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `GET /api/webhooks/{id}/`

- **Endpoint**: `GET /api/webhooks/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/webhooks/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "event_name": "sample_event_name",
  "target_url": "https://erp.devrious.com/files/sample.pdf",
  "secret_token": "sample_secret_token",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `PUT /api/webhooks/{id}/`

- **Endpoint**: `PUT /api/webhooks/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/webhooks/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "event_name": "sample_event_name",
  "target_url": "https://erp.devrious.com/files/sample.pdf",
  "secret_token": "sample_secret_token",
  "is_active": true,
  "tenant": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "event_name": "sample_event_name",
  "target_url": "https://erp.devrious.com/files/sample.pdf",
  "secret_token": "sample_secret_token",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `PATCH /api/webhooks/{id}/`

- **Endpoint**: `PATCH /api/webhooks/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/webhooks/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "event_name": "sample_event_name",
  "target_url": "https://erp.devrious.com/files/sample.pdf",
  "secret_token": "sample_secret_token",
  "is_active": true,
  "tenant": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "event_name": "sample_event_name",
  "target_url": "https://erp.devrious.com/files/sample.pdf",
  "secret_token": "sample_secret_token",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `DELETE /api/webhooks/{id}/`

- **Endpoint**: `DELETE /api/webhooks/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/webhooks/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/workflows/requests/`

- **Endpoint**: `GET /api/workflows/requests/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/workflows/requests/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "requested_by_username": "string",
      "reviewed_by_username": "string",
      "target_model": "string",
      "target_object_id": "string",
      "reference_code": "string",
      "amount": "35000.00",
      "required_role": "string",
      "status": "string",
      "comments": "string",
      "resolved_at": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "rule": "string",
      "requested_by": "string",
      "reviewed_by": "string"
    }
  ]
}
```

---

### `POST /api/workflows/requests/`

- **Endpoint**: `POST /api/workflows/requests/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/workflows/requests/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "reference_code": "sample_reference_code",
  "amount": "35000.00",
  "required_role": "PLATFORM_ADMIN",
  "status": "PENDING",
  "comments": "sample_comments",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "rule": 1,
  "requested_by": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "requested_by_username": "sample_requested_by_username",
  "reviewed_by_username": "sample_reviewed_by_username",
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "reference_code": "sample_reference_code",
  "amount": "35000.00",
  "required_role": "PLATFORM_ADMIN",
  "status": "PENDING",
  "comments": "sample_comments",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "rule": 1,
  "requested_by": 1,
  "reviewed_by": 1
}
```

---

### `GET /api/workflows/requests/{id}/`

- **Endpoint**: `GET /api/workflows/requests/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/workflows/requests/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "requested_by_username": "sample_requested_by_username",
  "reviewed_by_username": "sample_reviewed_by_username",
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "reference_code": "sample_reference_code",
  "amount": "35000.00",
  "required_role": "PLATFORM_ADMIN",
  "status": "PENDING",
  "comments": "sample_comments",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "rule": 1,
  "requested_by": 1,
  "reviewed_by": 1
}
```

---

### `PUT /api/workflows/requests/{id}/`

- **Endpoint**: `PUT /api/workflows/requests/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/workflows/requests/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "reference_code": "sample_reference_code",
  "amount": "35000.00",
  "required_role": "PLATFORM_ADMIN",
  "status": "PENDING",
  "comments": "sample_comments",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "rule": 1,
  "requested_by": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "requested_by_username": "sample_requested_by_username",
  "reviewed_by_username": "sample_reviewed_by_username",
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "reference_code": "sample_reference_code",
  "amount": "35000.00",
  "required_role": "PLATFORM_ADMIN",
  "status": "PENDING",
  "comments": "sample_comments",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "rule": 1,
  "requested_by": 1,
  "reviewed_by": 1
}
```

---

### `PATCH /api/workflows/requests/{id}/`

- **Endpoint**: `PATCH /api/workflows/requests/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/workflows/requests/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "reference_code": "sample_reference_code",
  "amount": "35000.00",
  "required_role": "PLATFORM_ADMIN",
  "status": "PENDING",
  "comments": "sample_comments",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "rule": 1,
  "requested_by": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "requested_by_username": "sample_requested_by_username",
  "reviewed_by_username": "sample_reviewed_by_username",
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "reference_code": "sample_reference_code",
  "amount": "35000.00",
  "required_role": "PLATFORM_ADMIN",
  "status": "PENDING",
  "comments": "sample_comments",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "rule": 1,
  "requested_by": 1,
  "reviewed_by": 1
}
```

---

### `DELETE /api/workflows/requests/{id}/`

- **Endpoint**: `DELETE /api/workflows/requests/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/workflows/requests/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/workflows/requests/{id}/approve/`

- **Endpoint**: `POST /api/workflows/requests/{id}/approve/`
- **Summary**: Approve a pending workflow request

#### Example Request

```http
POST /api/workflows/requests/{id}/approve/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "reference_code": "sample_reference_code",
  "amount": "35000.00",
  "required_role": "PLATFORM_ADMIN",
  "status": "PENDING",
  "comments": "sample_comments",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "rule": 1,
  "requested_by": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "requested_by_username": "sample_requested_by_username",
  "reviewed_by_username": "sample_reviewed_by_username",
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "reference_code": "sample_reference_code",
  "amount": "35000.00",
  "required_role": "PLATFORM_ADMIN",
  "status": "PENDING",
  "comments": "sample_comments",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "rule": 1,
  "requested_by": 1,
  "reviewed_by": 1
}
```

---

### `POST /api/workflows/requests/{id}/reject/`

- **Endpoint**: `POST /api/workflows/requests/{id}/reject/`
- **Summary**: Reject a pending workflow request

#### Example Request

```http
POST /api/workflows/requests/{id}/reject/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "reference_code": "sample_reference_code",
  "amount": "35000.00",
  "required_role": "PLATFORM_ADMIN",
  "status": "PENDING",
  "comments": "sample_comments",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "rule": 1,
  "requested_by": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "requested_by_username": "sample_requested_by_username",
  "reviewed_by_username": "sample_reviewed_by_username",
  "target_model": "sample_target_model",
  "target_object_id": 1,
  "reference_code": "sample_reference_code",
  "amount": "35000.00",
  "required_role": "PLATFORM_ADMIN",
  "status": "PENDING",
  "comments": "sample_comments",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "rule": 1,
  "requested_by": 1,
  "reviewed_by": 1
}
```

---

### `GET /api/workflows/rules/`

- **Endpoint**: `GET /api/workflows/rules/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/workflows/rules/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "name": "Devrious Retail Group (Pvt) Ltd",
      "module": "string",
      "target_model": "string",
      "min_amount": "string",
      "required_role": "string",
      "is_active": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1
    }
  ]
}
```

---

### `POST /api/workflows/rules/`

- **Endpoint**: `POST /api/workflows/rules/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/workflows/rules/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "module": "PLATFORM",
  "target_model": "sample_target_model",
  "min_amount": "1000.00",
  "required_role": "PLATFORM_ADMIN",
  "is_active": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "module": "PLATFORM",
  "target_model": "sample_target_model",
  "min_amount": "1000.00",
  "required_role": "PLATFORM_ADMIN",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1
}
```

---

### `GET /api/workflows/rules/{id}/`

- **Endpoint**: `GET /api/workflows/rules/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/workflows/rules/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "module": "PLATFORM",
  "target_model": "sample_target_model",
  "min_amount": "1000.00",
  "required_role": "PLATFORM_ADMIN",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1
}
```

---

### `PUT /api/workflows/rules/{id}/`

- **Endpoint**: `PUT /api/workflows/rules/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/workflows/rules/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "module": "PLATFORM",
  "target_model": "sample_target_model",
  "min_amount": "1000.00",
  "required_role": "PLATFORM_ADMIN",
  "is_active": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "module": "PLATFORM",
  "target_model": "sample_target_model",
  "min_amount": "1000.00",
  "required_role": "PLATFORM_ADMIN",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1
}
```

---

### `PATCH /api/workflows/rules/{id}/`

- **Endpoint**: `PATCH /api/workflows/rules/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/workflows/rules/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "module": "PLATFORM",
  "target_model": "sample_target_model",
  "min_amount": "1000.00",
  "required_role": "PLATFORM_ADMIN",
  "is_active": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "module": "PLATFORM",
  "target_model": "sample_target_model",
  "min_amount": "1000.00",
  "required_role": "PLATFORM_ADMIN",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1
}
```

---

### `DELETE /api/workflows/rules/{id}/`

- **Endpoint**: `DELETE /api/workflows/rules/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/workflows/rules/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

## 5. Shared Master Data: Customers (with Banning) & Suppliers

### `GET /api/customers/`

- **Endpoint**: `GET /api/customers/`
- **Summary**: Shared Master Data: Customer directory used across Retail/POS, E-Commerce, Finance (AR), and Support Desk. Includes customer banning (`POST /api/customers/{id}/ban/`, `/unban/`) and audit logging of changes.

#### Example Request

```http
GET /api/customers/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "customer_code": "string",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "email": "kasun@devriousretail.lk",
      "phone": "+94771234567",
      "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
      "city": "Colombo",
      "country": "Sri Lanka",
      "tin_number": "TIN-100200300",
      "vat_reg_number": "VAT-100200300-7000",
      "is_vat_registered": "string",
      "is_svat_customer": "string",
      "svat_number": "SVAT-RIS-2026-01",
      "credit_limit": "500000.00",
      "current_balance": "118000.00",
      "loyalty_card_number": "string",
      "loyalty_points": "string",
      "pricing_tier": "string",
      "is_banned": "string",
      "banned_at": "string",
      "banned_reason": "string",
      "is_active": "string",
      "created_at": "string",
      "updated_at": "string",
      "tenant": 1,
      "company": 1,
      "portal_user": "string",
      "banned_by": "string"
    }
  ]
}
```

---

### `POST /api/customers/`

- **Endpoint**: `POST /api/customers/`
- **Summary**: Shared Master Data: Customer directory used across Retail/POS, E-Commerce, Finance (AR), and Support Desk. Includes customer banning (`POST /api/customers/{id}/ban/`, `/unban/`) and audit logging of changes.

#### Example Request

```http
POST /api/customers/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "customer_code": "sample_customer_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "country": "Sri Lanka",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "is_svat_customer": true,
  "svat_number": "SVAT-RIS-2026-01",
  "credit_limit": "500000.00",
  "current_balance": "118000.00",
  "loyalty_card_number": "sample_loyalty_card_number",
  "loyalty_points": 1,
  "pricing_tier": "sample_pricing_tier",
  "is_banned": false,
  "banned_reason": "sample_banned_reason",
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "portal_user": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "customer_code": "sample_customer_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "country": "Sri Lanka",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "is_svat_customer": true,
  "svat_number": "SVAT-RIS-2026-01",
  "credit_limit": "500000.00",
  "current_balance": "118000.00",
  "loyalty_card_number": "sample_loyalty_card_number",
  "loyalty_points": 1,
  "pricing_tier": "sample_pricing_tier",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "portal_user": 1,
  "banned_by": 1
}
```

---

### `GET /api/customers/{id}/`

- **Endpoint**: `GET /api/customers/{id}/`
- **Summary**: Shared Master Data: Customer directory used across Retail/POS, E-Commerce, Finance (AR), and Support Desk. Includes customer banning (`POST /api/customers/{id}/ban/`, `/unban/`) and audit logging of changes.

#### Example Request

```http
GET /api/customers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "customer_code": "sample_customer_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "country": "Sri Lanka",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "is_svat_customer": true,
  "svat_number": "SVAT-RIS-2026-01",
  "credit_limit": "500000.00",
  "current_balance": "118000.00",
  "loyalty_card_number": "sample_loyalty_card_number",
  "loyalty_points": 1,
  "pricing_tier": "sample_pricing_tier",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "portal_user": 1,
  "banned_by": 1
}
```

---

### `PUT /api/customers/{id}/`

- **Endpoint**: `PUT /api/customers/{id}/`
- **Summary**: Shared Master Data: Customer directory used across Retail/POS, E-Commerce, Finance (AR), and Support Desk. Includes customer banning (`POST /api/customers/{id}/ban/`, `/unban/`) and audit logging of changes.

#### Example Request

```http
PUT /api/customers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "customer_code": "sample_customer_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "country": "Sri Lanka",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "is_svat_customer": true,
  "svat_number": "SVAT-RIS-2026-01",
  "credit_limit": "500000.00",
  "current_balance": "118000.00",
  "loyalty_card_number": "sample_loyalty_card_number",
  "loyalty_points": 1,
  "pricing_tier": "sample_pricing_tier",
  "is_banned": false,
  "banned_reason": "sample_banned_reason",
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "portal_user": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "customer_code": "sample_customer_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "country": "Sri Lanka",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "is_svat_customer": true,
  "svat_number": "SVAT-RIS-2026-01",
  "credit_limit": "500000.00",
  "current_balance": "118000.00",
  "loyalty_card_number": "sample_loyalty_card_number",
  "loyalty_points": 1,
  "pricing_tier": "sample_pricing_tier",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "portal_user": 1,
  "banned_by": 1
}
```

---

### `PATCH /api/customers/{id}/`

- **Endpoint**: `PATCH /api/customers/{id}/`
- **Summary**: Shared Master Data: Customer directory used across Retail/POS, E-Commerce, Finance (AR), and Support Desk. Includes customer banning (`POST /api/customers/{id}/ban/`, `/unban/`) and audit logging of changes.

#### Example Request

```http
PATCH /api/customers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "customer_code": "sample_customer_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "country": "Sri Lanka",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "is_svat_customer": true,
  "svat_number": "SVAT-RIS-2026-01",
  "credit_limit": "500000.00",
  "current_balance": "118000.00",
  "loyalty_card_number": "sample_loyalty_card_number",
  "loyalty_points": 1,
  "pricing_tier": "sample_pricing_tier",
  "is_banned": false,
  "banned_reason": "sample_banned_reason",
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "portal_user": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "customer_code": "sample_customer_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "country": "Sri Lanka",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "is_svat_customer": true,
  "svat_number": "SVAT-RIS-2026-01",
  "credit_limit": "500000.00",
  "current_balance": "118000.00",
  "loyalty_card_number": "sample_loyalty_card_number",
  "loyalty_points": 1,
  "pricing_tier": "sample_pricing_tier",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "portal_user": 1,
  "banned_by": 1
}
```

---

### `DELETE /api/customers/{id}/`

- **Endpoint**: `DELETE /api/customers/{id}/`
- **Summary**: Shared Master Data: Customer directory used across Retail/POS, E-Commerce, Finance (AR), and Support Desk. Includes customer banning (`POST /api/customers/{id}/ban/`, `/unban/`) and audit logging of changes.

#### Example Request

```http
DELETE /api/customers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/customers/{id}/ban/`

- **Endpoint**: `POST /api/customers/{id}/ban/`
- **Summary**: Ban a Customer (blocks sales, POS, e-commerce orders, and portal access)

#### Example Request

```http
POST /api/customers/{id}/ban/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "reason": "Policy compliance / administrative action"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "customer_code": "sample_customer_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "country": "Sri Lanka",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "is_svat_customer": true,
  "svat_number": "SVAT-RIS-2026-01",
  "credit_limit": "500000.00",
  "current_balance": "118000.00",
  "loyalty_card_number": "sample_loyalty_card_number",
  "loyalty_points": 1,
  "pricing_tier": "sample_pricing_tier",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "portal_user": 1,
  "banned_by": 1
}
```

---

### `POST /api/customers/{id}/unban/`

- **Endpoint**: `POST /api/customers/{id}/unban/`
- **Summary**: Unban a Customer

#### Example Request

```http
POST /api/customers/{id}/unban/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "notes": "Verified and recorded by administrator."
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "customer_code": "sample_customer_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "city": "Colombo",
  "country": "Sri Lanka",
  "tin_number": "TIN-100200300",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "is_svat_customer": true,
  "svat_number": "SVAT-RIS-2026-01",
  "credit_limit": "500000.00",
  "current_balance": "118000.00",
  "loyalty_card_number": "sample_loyalty_card_number",
  "loyalty_points": 1,
  "pricing_tier": "sample_pricing_tier",
  "is_banned": false,
  "banned_at": "2026-11-23T10:30:00+05:30",
  "banned_reason": "sample_banned_reason",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "portal_user": 1,
  "banned_by": 1
}
```

---

### `GET /api/suppliers/`

- **Endpoint**: `GET /api/suppliers/`
- **Summary**: Shared Master Data: Supplier directory used across Inventory/Procurement and Finance (AP).

#### Example Request

```http
GET /api/suppliers/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "supplier_code": "string",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "contact_person": "string",
      "email": "kasun@devriousretail.lk",
      "phone": "+94771234567",
      "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
      "tin_number": "TIN-100200300",
      "br_number": "PV-88990",
      "vat_reg_number": "VAT-100200300-7000",
      "is_vat_registered": "string",
      "payment_terms_days": "string",
      "withholding_tax_rate": "0.00",
      "current_balance": "118000.00",
      "is_active": "string",
      "created_at": "string",
      "updated_at": "string",
      "tenant": 1,
      "company": 1,
      "portal_user": "string"
    }
  ]
}
```

---

### `POST /api/suppliers/`

- **Endpoint**: `POST /api/suppliers/`
- **Summary**: Shared Master Data: Supplier directory used across Inventory/Procurement and Finance (AP).

#### Example Request

```http
POST /api/suppliers/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "supplier_code": "sample_supplier_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "tin_number": "TIN-100200300",
  "br_number": "PV-88990",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "payment_terms_days": 1,
  "withholding_tax_rate": "0.00",
  "current_balance": "118000.00",
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "portal_user": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "supplier_code": "sample_supplier_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "tin_number": "TIN-100200300",
  "br_number": "PV-88990",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "payment_terms_days": 1,
  "withholding_tax_rate": "0.00",
  "current_balance": "118000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "portal_user": 1
}
```

---

### `GET /api/suppliers/{id}/`

- **Endpoint**: `GET /api/suppliers/{id}/`
- **Summary**: Shared Master Data: Supplier directory used across Inventory/Procurement and Finance (AP).

#### Example Request

```http
GET /api/suppliers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "supplier_code": "sample_supplier_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "tin_number": "TIN-100200300",
  "br_number": "PV-88990",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "payment_terms_days": 1,
  "withholding_tax_rate": "0.00",
  "current_balance": "118000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "portal_user": 1
}
```

---

### `PUT /api/suppliers/{id}/`

- **Endpoint**: `PUT /api/suppliers/{id}/`
- **Summary**: Shared Master Data: Supplier directory used across Inventory/Procurement and Finance (AP).

#### Example Request

```http
PUT /api/suppliers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "supplier_code": "sample_supplier_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "tin_number": "TIN-100200300",
  "br_number": "PV-88990",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "payment_terms_days": 1,
  "withholding_tax_rate": "0.00",
  "current_balance": "118000.00",
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "portal_user": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "supplier_code": "sample_supplier_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "tin_number": "TIN-100200300",
  "br_number": "PV-88990",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "payment_terms_days": 1,
  "withholding_tax_rate": "0.00",
  "current_balance": "118000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "portal_user": 1
}
```

---

### `PATCH /api/suppliers/{id}/`

- **Endpoint**: `PATCH /api/suppliers/{id}/`
- **Summary**: Shared Master Data: Supplier directory used across Inventory/Procurement and Finance (AP).

#### Example Request

```http
PATCH /api/suppliers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "supplier_code": "sample_supplier_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "tin_number": "TIN-100200300",
  "br_number": "PV-88990",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "payment_terms_days": 1,
  "withholding_tax_rate": "0.00",
  "current_balance": "118000.00",
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "portal_user": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "supplier_code": "sample_supplier_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "address": "No. 42, World Trade Center, Colombo 01, Sri Lanka",
  "tin_number": "TIN-100200300",
  "br_number": "PV-88990",
  "vat_reg_number": "VAT-100200300-7000",
  "is_vat_registered": true,
  "payment_terms_days": 1,
  "withholding_tax_rate": "0.00",
  "current_balance": "118000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "portal_user": 1
}
```

---

### `DELETE /api/suppliers/{id}/`

- **Endpoint**: `DELETE /api/suppliers/{id}/`
- **Summary**: Shared Master Data: Supplier directory used across Inventory/Procurement and Finance (AP).

#### Example Request

```http
DELETE /api/suppliers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

## 6. Finance & Accounting + Sri Lanka VAT/SVAT/RAMIS Compliance (ERP-FIN & ERP-SL)

### `GET /api/finance/accounts/`

- **Endpoint**: `GET /api/finance/accounts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/accounts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "code": "CMB-01",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "account_type": "string",
      "currency": "LKR",
      "is_system_account": "string",
      "is_active": "string",
      "balance": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "parent": "string"
    }
  ]
}
```

---

### `POST /api/finance/accounts/`

- **Endpoint**: `POST /api/finance/accounts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/finance/accounts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "account_type": "ASSET",
  "currency": "LKR",
  "is_system_account": true,
  "is_active": true,
  "balance": "1000.00",
  "tenant": 1,
  "company": 1,
  "parent": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "account_type": "ASSET",
  "currency": "LKR",
  "is_system_account": true,
  "is_active": true,
  "balance": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "parent": 1
}
```

---

### `POST /api/finance/accounts/seed-default/`

- **Endpoint**: `POST /api/finance/accounts/seed-default/`
- **Summary**: Seed default Sri Lanka Chart of Accounts for a Company

#### Example Request

```http
POST /api/finance/accounts/seed-default/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "account_type": "ASSET",
  "currency": "LKR",
  "is_system_account": true,
  "is_active": true,
  "balance": "1000.00",
  "tenant": 1,
  "company": 1,
  "parent": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "account_type": "ASSET",
  "currency": "LKR",
  "is_system_account": true,
  "is_active": true,
  "balance": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "parent": 1
}
```

---

### `GET /api/finance/accounts/{id}/`

- **Endpoint**: `GET /api/finance/accounts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/accounts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "account_type": "ASSET",
  "currency": "LKR",
  "is_system_account": true,
  "is_active": true,
  "balance": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "parent": 1
}
```

---

### `PUT /api/finance/accounts/{id}/`

- **Endpoint**: `PUT /api/finance/accounts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/finance/accounts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "account_type": "ASSET",
  "currency": "LKR",
  "is_system_account": true,
  "is_active": true,
  "balance": "1000.00",
  "tenant": 1,
  "company": 1,
  "parent": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "account_type": "ASSET",
  "currency": "LKR",
  "is_system_account": true,
  "is_active": true,
  "balance": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "parent": 1
}
```

---

### `PATCH /api/finance/accounts/{id}/`

- **Endpoint**: `PATCH /api/finance/accounts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/finance/accounts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "account_type": "ASSET",
  "currency": "LKR",
  "is_system_account": true,
  "is_active": true,
  "balance": "1000.00",
  "tenant": 1,
  "company": 1,
  "parent": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "account_type": "ASSET",
  "currency": "LKR",
  "is_system_account": true,
  "is_active": true,
  "balance": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "parent": 1
}
```

---

### `DELETE /api/finance/accounts/{id}/`

- **Endpoint**: `DELETE /api/finance/accounts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/finance/accounts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/finance/bank-accounts/`

- **Endpoint**: `GET /api/finance/bank-accounts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/bank-accounts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "name": "Devrious Retail Group (Pvt) Ltd",
      "kind": "string",
      "bank_name": "string",
      "account_number": "string",
      "currency": "LKR",
      "current_balance": "118000.00",
      "is_active": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "gl_account": "string"
    }
  ]
}
```

---

### `POST /api/finance/bank-accounts/`

- **Endpoint**: `POST /api/finance/bank-accounts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/finance/bank-accounts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "kind": "BANK",
  "bank_name": "sample_bank_name",
  "account_number": "sample_account_number",
  "currency": "LKR",
  "current_balance": "118000.00",
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "gl_account": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "kind": "BANK",
  "bank_name": "sample_bank_name",
  "account_number": "sample_account_number",
  "currency": "LKR",
  "current_balance": "118000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "gl_account": 1
}
```

---

### `GET /api/finance/bank-accounts/{id}/`

- **Endpoint**: `GET /api/finance/bank-accounts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/bank-accounts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "kind": "BANK",
  "bank_name": "sample_bank_name",
  "account_number": "sample_account_number",
  "currency": "LKR",
  "current_balance": "118000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "gl_account": 1
}
```

---

### `PUT /api/finance/bank-accounts/{id}/`

- **Endpoint**: `PUT /api/finance/bank-accounts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/finance/bank-accounts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "kind": "BANK",
  "bank_name": "sample_bank_name",
  "account_number": "sample_account_number",
  "currency": "LKR",
  "current_balance": "118000.00",
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "gl_account": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "kind": "BANK",
  "bank_name": "sample_bank_name",
  "account_number": "sample_account_number",
  "currency": "LKR",
  "current_balance": "118000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "gl_account": 1
}
```

---

### `PATCH /api/finance/bank-accounts/{id}/`

- **Endpoint**: `PATCH /api/finance/bank-accounts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/finance/bank-accounts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "kind": "BANK",
  "bank_name": "sample_bank_name",
  "account_number": "sample_account_number",
  "currency": "LKR",
  "current_balance": "118000.00",
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "gl_account": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "kind": "BANK",
  "bank_name": "sample_bank_name",
  "account_number": "sample_account_number",
  "currency": "LKR",
  "current_balance": "118000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "gl_account": 1
}
```

---

### `DELETE /api/finance/bank-accounts/{id}/`

- **Endpoint**: `DELETE /api/finance/bank-accounts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/finance/bank-accounts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/finance/budgets/`

- **Endpoint**: `GET /api/finance/budgets/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/budgets/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "variance": "string",
      "account_code": "string",
      "account_name": "string",
      "fiscal_year": "string",
      "allocated_amount": "string",
      "committed_amount": "string",
      "actual_spent": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "account": "string"
    }
  ]
}
```

---

### `POST /api/finance/budgets/`

- **Endpoint**: `POST /api/finance/budgets/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/finance/budgets/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "fiscal_year": "sample_fiscal_year",
  "allocated_amount": "1000.00",
  "committed_amount": "1000.00",
  "actual_spent": "1000.00",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "account": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "variance": "1000.00",
  "account_code": "sample_account_code",
  "account_name": "sample_account_name",
  "fiscal_year": "sample_fiscal_year",
  "allocated_amount": "1000.00",
  "committed_amount": "1000.00",
  "actual_spent": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "account": 1
}
```

---

### `GET /api/finance/budgets/{id}/`

- **Endpoint**: `GET /api/finance/budgets/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/budgets/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "variance": "1000.00",
  "account_code": "sample_account_code",
  "account_name": "sample_account_name",
  "fiscal_year": "sample_fiscal_year",
  "allocated_amount": "1000.00",
  "committed_amount": "1000.00",
  "actual_spent": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "account": 1
}
```

---

### `PUT /api/finance/budgets/{id}/`

- **Endpoint**: `PUT /api/finance/budgets/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/finance/budgets/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "fiscal_year": "sample_fiscal_year",
  "allocated_amount": "1000.00",
  "committed_amount": "1000.00",
  "actual_spent": "1000.00",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "account": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "variance": "1000.00",
  "account_code": "sample_account_code",
  "account_name": "sample_account_name",
  "fiscal_year": "sample_fiscal_year",
  "allocated_amount": "1000.00",
  "committed_amount": "1000.00",
  "actual_spent": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "account": 1
}
```

---

### `PATCH /api/finance/budgets/{id}/`

- **Endpoint**: `PATCH /api/finance/budgets/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/finance/budgets/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "fiscal_year": "sample_fiscal_year",
  "allocated_amount": "1000.00",
  "committed_amount": "1000.00",
  "actual_spent": "1000.00",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "account": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "variance": "1000.00",
  "account_code": "sample_account_code",
  "account_name": "sample_account_name",
  "fiscal_year": "sample_fiscal_year",
  "allocated_amount": "1000.00",
  "committed_amount": "1000.00",
  "actual_spent": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "account": 1
}
```

---

### `DELETE /api/finance/budgets/{id}/`

- **Endpoint**: `DELETE /api/finance/budgets/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/finance/budgets/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/finance/customer-invoices/`

- **Endpoint**: `GET /api/finance/customer-invoices/`
- **Summary**: Accounts Receivable Tax Invoices, SVAT Invoices, & Reversing Credit Notes (ERP-FIN-004, ERP-FIN-007, ERP-SL-001, ERP-SL-005). Posted tax invoices cannot be deleted without a reversing credit note (ERP-PLAT-016).

#### Example Request

```http
GET /api/finance/customer-invoices/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "customer": "string",
      "customer_name": "string",
      "invoice_type": "string",
      "invoice_heading": "string",
      "sequential_number": "TINV-2026-0001",
      "invoice_date": "string",
      "due_date": "string",
      "supplier_legal_name": "string",
      "supplier_br_number": "PV-88990",
      "supplier_tin": "TIN-100200300",
      "supplier_vat_reg": "VAT-100200300-7000",
      "customer_tin": "TIN-998877665",
      "customer_vat_reg": "string",
      "svat_ris_number": "SVAT-RIS-2026-01",
      "currency": "LKR",
      "exchange_rate": "1.000000",
      "subtotal": "100000.00",
      "discount_total": "0.00",
      "vat_rate": "18.00",
      "vat_amount": "18000.00",
      "nbt_rate": "2.00",
      "nbt_amount": "0.00",
      "grand_total": "118000.00",
      "amount_paid": "118000.00",
      "balance_due": "0.00",
      "total_in_words": "Sri Lankan Rupees One Hundred Eighteen Thousand Only",
      "status": "string",
      "original_invoice": "string",
      "journal_entry": "string",
      "source_module": "string",
      "source_order_ref": "string",
      "ramis_synced": "string",
      "notes": "Verified and recorded by administrator.",
      "created_by": "string",
      "created_at": "string",
      "updated_at": "string",
      "lines": "string"
    }
  ]
}
```

---

### `POST /api/finance/customer-invoices/`

- **Endpoint**: `POST /api/finance/customer-invoices/`
- **Summary**: Accounts Receivable Tax Invoices, SVAT Invoices, & Reversing Credit Notes (ERP-FIN-004, ERP-FIN-007, ERP-SL-001, ERP-SL-005). Posted tax invoices cannot be deleted without a reversing credit note (ERP-PLAT-016).

#### Example Request

```http
POST /api/finance/customer-invoices/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "invoice_type": "TAX_INVOICE",
  "sequential_number": "TINV-2026-0001",
  "invoice_date": "2026-11-23",
  "due_date": "2026-11-23",
  "customer_tin": "TIN-998877665",
  "customer_vat_reg": "sample_customer_vat_reg",
  "svat_ris_number": "SVAT-RIS-2026-01",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "vat_rate": "18.00",
  "nbt_rate": "2.00",
  "amount_paid": "118000.00",
  "original_invoice": 1,
  "source_module": "sample_source_module",
  "source_order_ref": "sample_source_order_ref",
  "ramis_synced": true,
  "notes": "Verified and recorded by administrator.",
  "lines": [
    {
      "item_code": "string",
      "description": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_rate": "18.00",
      "revenue_account": "string"
    }
  ]
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "customer_name": "sample_customer_name",
  "invoice_type": "TAX_INVOICE",
  "invoice_heading": "sample_invoice_heading",
  "sequential_number": "TINV-2026-0001",
  "invoice_date": "2026-11-23",
  "due_date": "2026-11-23",
  "supplier_legal_name": "sample_supplier_legal_name",
  "supplier_br_number": "PV-88990",
  "supplier_tin": "TIN-100200300",
  "supplier_vat_reg": "VAT-100200300-7000",
  "customer_tin": "TIN-998877665",
  "customer_vat_reg": "sample_customer_vat_reg",
  "svat_ris_number": "SVAT-RIS-2026-01",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "subtotal": "100000.00",
  "discount_total": "0.00",
  "vat_rate": "18.00",
  "vat_amount": "18000.00",
  "nbt_rate": "2.00",
  "nbt_amount": "0.00",
  "grand_total": "118000.00",
  "amount_paid": "118000.00",
  "balance_due": "0.00",
  "total_in_words": "Sri Lankan Rupees One Hundred Eighteen Thousand Only",
  "status": "DRAFT",
  "original_invoice": 1,
  "journal_entry": 1,
  "source_module": "sample_source_module",
  "source_order_ref": "sample_source_order_ref",
  "ramis_synced": true,
  "notes": "Verified and recorded by administrator.",
  "created_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "item_code": "string",
      "description": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_rate": "18.00",
      "tax_amount": "18000.00",
      "line_total": "string",
      "revenue_account": "string"
    }
  ]
}
```

---

### `GET /api/finance/customer-invoices/{id}/`

- **Endpoint**: `GET /api/finance/customer-invoices/{id}/`
- **Summary**: Accounts Receivable Tax Invoices, SVAT Invoices, & Reversing Credit Notes (ERP-FIN-004, ERP-FIN-007, ERP-SL-001, ERP-SL-005). Posted tax invoices cannot be deleted without a reversing credit note (ERP-PLAT-016).

#### Example Request

```http
GET /api/finance/customer-invoices/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "customer_name": "sample_customer_name",
  "invoice_type": "TAX_INVOICE",
  "invoice_heading": "sample_invoice_heading",
  "sequential_number": "TINV-2026-0001",
  "invoice_date": "2026-11-23",
  "due_date": "2026-11-23",
  "supplier_legal_name": "sample_supplier_legal_name",
  "supplier_br_number": "PV-88990",
  "supplier_tin": "TIN-100200300",
  "supplier_vat_reg": "VAT-100200300-7000",
  "customer_tin": "TIN-998877665",
  "customer_vat_reg": "sample_customer_vat_reg",
  "svat_ris_number": "SVAT-RIS-2026-01",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "subtotal": "100000.00",
  "discount_total": "0.00",
  "vat_rate": "18.00",
  "vat_amount": "18000.00",
  "nbt_rate": "2.00",
  "nbt_amount": "0.00",
  "grand_total": "118000.00",
  "amount_paid": "118000.00",
  "balance_due": "0.00",
  "total_in_words": "Sri Lankan Rupees One Hundred Eighteen Thousand Only",
  "status": "DRAFT",
  "original_invoice": 1,
  "journal_entry": 1,
  "source_module": "sample_source_module",
  "source_order_ref": "sample_source_order_ref",
  "ramis_synced": true,
  "notes": "Verified and recorded by administrator.",
  "created_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "item_code": "string",
      "description": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_rate": "18.00",
      "tax_amount": "18000.00",
      "line_total": "string",
      "revenue_account": "string"
    }
  ]
}
```

---

### `PUT /api/finance/customer-invoices/{id}/`

- **Endpoint**: `PUT /api/finance/customer-invoices/{id}/`
- **Summary**: Accounts Receivable Tax Invoices, SVAT Invoices, & Reversing Credit Notes (ERP-FIN-004, ERP-FIN-007, ERP-SL-001, ERP-SL-005). Posted tax invoices cannot be deleted without a reversing credit note (ERP-PLAT-016).

#### Example Request

```http
PUT /api/finance/customer-invoices/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "invoice_type": "TAX_INVOICE",
  "sequential_number": "TINV-2026-0001",
  "invoice_date": "2026-11-23",
  "due_date": "2026-11-23",
  "customer_tin": "TIN-998877665",
  "customer_vat_reg": "sample_customer_vat_reg",
  "svat_ris_number": "SVAT-RIS-2026-01",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "vat_rate": "18.00",
  "nbt_rate": "2.00",
  "amount_paid": "118000.00",
  "original_invoice": 1,
  "source_module": "sample_source_module",
  "source_order_ref": "sample_source_order_ref",
  "ramis_synced": true,
  "notes": "Verified and recorded by administrator.",
  "lines": [
    {
      "item_code": "string",
      "description": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_rate": "18.00",
      "revenue_account": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "customer_name": "sample_customer_name",
  "invoice_type": "TAX_INVOICE",
  "invoice_heading": "sample_invoice_heading",
  "sequential_number": "TINV-2026-0001",
  "invoice_date": "2026-11-23",
  "due_date": "2026-11-23",
  "supplier_legal_name": "sample_supplier_legal_name",
  "supplier_br_number": "PV-88990",
  "supplier_tin": "TIN-100200300",
  "supplier_vat_reg": "VAT-100200300-7000",
  "customer_tin": "TIN-998877665",
  "customer_vat_reg": "sample_customer_vat_reg",
  "svat_ris_number": "SVAT-RIS-2026-01",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "subtotal": "100000.00",
  "discount_total": "0.00",
  "vat_rate": "18.00",
  "vat_amount": "18000.00",
  "nbt_rate": "2.00",
  "nbt_amount": "0.00",
  "grand_total": "118000.00",
  "amount_paid": "118000.00",
  "balance_due": "0.00",
  "total_in_words": "Sri Lankan Rupees One Hundred Eighteen Thousand Only",
  "status": "DRAFT",
  "original_invoice": 1,
  "journal_entry": 1,
  "source_module": "sample_source_module",
  "source_order_ref": "sample_source_order_ref",
  "ramis_synced": true,
  "notes": "Verified and recorded by administrator.",
  "created_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "item_code": "string",
      "description": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_rate": "18.00",
      "tax_amount": "18000.00",
      "line_total": "string",
      "revenue_account": "string"
    }
  ]
}
```

---

### `PATCH /api/finance/customer-invoices/{id}/`

- **Endpoint**: `PATCH /api/finance/customer-invoices/{id}/`
- **Summary**: Accounts Receivable Tax Invoices, SVAT Invoices, & Reversing Credit Notes (ERP-FIN-004, ERP-FIN-007, ERP-SL-001, ERP-SL-005). Posted tax invoices cannot be deleted without a reversing credit note (ERP-PLAT-016).

#### Example Request

```http
PATCH /api/finance/customer-invoices/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "invoice_type": "TAX_INVOICE",
  "sequential_number": "TINV-2026-0001",
  "invoice_date": "2026-11-23",
  "due_date": "2026-11-23",
  "customer_tin": "TIN-998877665",
  "customer_vat_reg": "sample_customer_vat_reg",
  "svat_ris_number": "SVAT-RIS-2026-01",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "vat_rate": "18.00",
  "nbt_rate": "2.00",
  "amount_paid": "118000.00",
  "original_invoice": 1,
  "source_module": "sample_source_module",
  "source_order_ref": "sample_source_order_ref",
  "ramis_synced": true,
  "notes": "Verified and recorded by administrator.",
  "lines": [
    {
      "item_code": "string",
      "description": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_rate": "18.00",
      "revenue_account": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "customer_name": "sample_customer_name",
  "invoice_type": "TAX_INVOICE",
  "invoice_heading": "sample_invoice_heading",
  "sequential_number": "TINV-2026-0001",
  "invoice_date": "2026-11-23",
  "due_date": "2026-11-23",
  "supplier_legal_name": "sample_supplier_legal_name",
  "supplier_br_number": "PV-88990",
  "supplier_tin": "TIN-100200300",
  "supplier_vat_reg": "VAT-100200300-7000",
  "customer_tin": "TIN-998877665",
  "customer_vat_reg": "sample_customer_vat_reg",
  "svat_ris_number": "SVAT-RIS-2026-01",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "subtotal": "100000.00",
  "discount_total": "0.00",
  "vat_rate": "18.00",
  "vat_amount": "18000.00",
  "nbt_rate": "2.00",
  "nbt_amount": "0.00",
  "grand_total": "118000.00",
  "amount_paid": "118000.00",
  "balance_due": "0.00",
  "total_in_words": "Sri Lankan Rupees One Hundred Eighteen Thousand Only",
  "status": "DRAFT",
  "original_invoice": 1,
  "journal_entry": 1,
  "source_module": "sample_source_module",
  "source_order_ref": "sample_source_order_ref",
  "ramis_synced": true,
  "notes": "Verified and recorded by administrator.",
  "created_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "item_code": "string",
      "description": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_rate": "18.00",
      "tax_amount": "18000.00",
      "line_total": "string",
      "revenue_account": "string"
    }
  ]
}
```

---

### `DELETE /api/finance/customer-invoices/{id}/`

- **Endpoint**: `DELETE /api/finance/customer-invoices/{id}/`
- **Summary**: Accounts Receivable Tax Invoices, SVAT Invoices, & Reversing Credit Notes (ERP-FIN-004, ERP-FIN-007, ERP-SL-001, ERP-SL-005). Posted tax invoices cannot be deleted without a reversing credit note (ERP-PLAT-016).

#### Example Request

```http
DELETE /api/finance/customer-invoices/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/finance/customer-invoices/{id}/create-credit-note/`

- **Endpoint**: `POST /api/finance/customer-invoices/{id}/create-credit-note/`
- **Summary**: Create a Reversing Credit Note for an Issued Invoice

#### Example Request

```http
POST /api/finance/customer-invoices/{id}/create-credit-note/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "invoice_type": "TAX_INVOICE",
  "sequential_number": "TINV-2026-0001",
  "invoice_date": "2026-11-23",
  "due_date": "2026-11-23",
  "customer_tin": "TIN-998877665",
  "customer_vat_reg": "sample_customer_vat_reg",
  "svat_ris_number": "SVAT-RIS-2026-01",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "vat_rate": "18.00",
  "nbt_rate": "2.00",
  "amount_paid": "118000.00",
  "original_invoice": 1,
  "source_module": "sample_source_module",
  "source_order_ref": "sample_source_order_ref",
  "ramis_synced": true,
  "notes": "Verified and recorded by administrator.",
  "lines": [
    {
      "item_code": "string",
      "description": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_rate": "18.00",
      "revenue_account": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "customer_name": "sample_customer_name",
  "invoice_type": "TAX_INVOICE",
  "invoice_heading": "sample_invoice_heading",
  "sequential_number": "TINV-2026-0001",
  "invoice_date": "2026-11-23",
  "due_date": "2026-11-23",
  "supplier_legal_name": "sample_supplier_legal_name",
  "supplier_br_number": "PV-88990",
  "supplier_tin": "TIN-100200300",
  "supplier_vat_reg": "VAT-100200300-7000",
  "customer_tin": "TIN-998877665",
  "customer_vat_reg": "sample_customer_vat_reg",
  "svat_ris_number": "SVAT-RIS-2026-01",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "subtotal": "100000.00",
  "discount_total": "0.00",
  "vat_rate": "18.00",
  "vat_amount": "18000.00",
  "nbt_rate": "2.00",
  "nbt_amount": "0.00",
  "grand_total": "118000.00",
  "amount_paid": "118000.00",
  "balance_due": "0.00",
  "total_in_words": "Sri Lankan Rupees One Hundred Eighteen Thousand Only",
  "status": "DRAFT",
  "original_invoice": 1,
  "journal_entry": 1,
  "source_module": "sample_source_module",
  "source_order_ref": "sample_source_order_ref",
  "ramis_synced": true,
  "notes": "Verified and recorded by administrator.",
  "created_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "item_code": "string",
      "description": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_rate": "18.00",
      "tax_amount": "18000.00",
      "line_total": "string",
      "revenue_account": "string"
    }
  ]
}
```

---

### `POST /api/finance/customer-invoices/{id}/issue/`

- **Endpoint**: `POST /api/finance/customer-invoices/{id}/issue/`
- **Summary**: Issue & Post a Draft Customer Invoice to AR and General Ledger

#### Example Request

```http
POST /api/finance/customer-invoices/{id}/issue/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "invoice_type": "TAX_INVOICE",
  "sequential_number": "TINV-2026-0001",
  "invoice_date": "2026-11-23",
  "due_date": "2026-11-23",
  "customer_tin": "TIN-998877665",
  "customer_vat_reg": "sample_customer_vat_reg",
  "svat_ris_number": "SVAT-RIS-2026-01",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "vat_rate": "18.00",
  "nbt_rate": "2.00",
  "amount_paid": "118000.00",
  "original_invoice": 1,
  "source_module": "sample_source_module",
  "source_order_ref": "sample_source_order_ref",
  "ramis_synced": true,
  "notes": "Verified and recorded by administrator.",
  "lines": [
    {
      "item_code": "string",
      "description": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_rate": "18.00",
      "revenue_account": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "customer_name": "sample_customer_name",
  "invoice_type": "TAX_INVOICE",
  "invoice_heading": "sample_invoice_heading",
  "sequential_number": "TINV-2026-0001",
  "invoice_date": "2026-11-23",
  "due_date": "2026-11-23",
  "supplier_legal_name": "sample_supplier_legal_name",
  "supplier_br_number": "PV-88990",
  "supplier_tin": "TIN-100200300",
  "supplier_vat_reg": "VAT-100200300-7000",
  "customer_tin": "TIN-998877665",
  "customer_vat_reg": "sample_customer_vat_reg",
  "svat_ris_number": "SVAT-RIS-2026-01",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "subtotal": "100000.00",
  "discount_total": "0.00",
  "vat_rate": "18.00",
  "vat_amount": "18000.00",
  "nbt_rate": "2.00",
  "nbt_amount": "0.00",
  "grand_total": "118000.00",
  "amount_paid": "118000.00",
  "balance_due": "0.00",
  "total_in_words": "Sri Lankan Rupees One Hundred Eighteen Thousand Only",
  "status": "DRAFT",
  "original_invoice": 1,
  "journal_entry": 1,
  "source_module": "sample_source_module",
  "source_order_ref": "sample_source_order_ref",
  "ramis_synced": true,
  "notes": "Verified and recorded by administrator.",
  "created_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "item_code": "string",
      "description": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_rate": "18.00",
      "tax_amount": "18000.00",
      "line_total": "string",
      "revenue_account": "string"
    }
  ]
}
```

---

### `GET /api/finance/customer-invoices/{id}/ramis-export/`

- **Endpoint**: `GET /api/finance/customer-invoices/{id}/ramis-export/`
- **Summary**: Export Customer Tax Invoice in Sri Lanka IRD RAMIS E-Invoicing JSON Format (`ERP-SL-001`, `ERP-SL-005`)

#### Example Request

```http
GET /api/finance/customer-invoices/{id}/ramis-export/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "path_params": {
    "id": 1
  }
}
```

#### Example Response (`200 OK`)

```json
{
  "ramis_schema_version": "SL-IRD-RAMIS-2026.1",
  "document_heading": "TAX INVOICE",
  "document_type": "TAX_INVOICE",
  "sequential_invoice_number": "TINV-2026-0001",
  "invoice_date": "2026-11-23",
  "supplier": {
    "legal_name": "Devrious Retail Group (Pvt) Ltd",
    "br_number": "PV-88990",
    "tin": "TIN-100200300",
    "vat_reg_number": "VAT-100200300-7000"
  },
  "customer": {
    "name": "Dialog Enterprise Ltd",
    "tin": "TIN-DIALOG-01",
    "vat_reg_number": "VAT-DIALOG-01",
    "svat_ris_number": ""
  },
  "currency": "LKR",
  "items": [
    {
      "item_code": "SRV-01",
      "description": "Enterprise ERP Implementation",
      "quantity": "1.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "vat_rate": "18.00",
      "vat_amount": "18000.00",
      "line_total": "118000.00"
    }
  ],
  "totals": {
    "subtotal": "100000.00",
    "discount_total": "0.00",
    "vat_rate_percent": "18.00",
    "vat_amount": "18000.00",
    "nbt_rate_percent": "0.00",
    "nbt_amount": "0.00",
    "grand_total": "118000.00",
    "total_in_words": "Sri Lankan Rupees One Hundred Eighteen Thousand Only"
  }
}
```

---

### `GET /api/finance/exchange-rates/`

- **Endpoint**: `GET /api/finance/exchange-rates/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/exchange-rates/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "from_currency": "USD",
      "to_currency": "LKR",
      "rate": "305.500000",
      "effective_date": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1
    }
  ]
}
```

---

### `POST /api/finance/exchange-rates/`

- **Endpoint**: `POST /api/finance/exchange-rates/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/finance/exchange-rates/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "from_currency": "USD",
  "to_currency": "LKR",
  "rate": "305.500000",
  "effective_date": "2026-11-23",
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "from_currency": "USD",
  "to_currency": "LKR",
  "rate": "305.500000",
  "effective_date": "2026-11-23",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1
}
```

---

### `GET /api/finance/exchange-rates/{id}/`

- **Endpoint**: `GET /api/finance/exchange-rates/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/exchange-rates/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "from_currency": "USD",
  "to_currency": "LKR",
  "rate": "305.500000",
  "effective_date": "2026-11-23",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1
}
```

---

### `PUT /api/finance/exchange-rates/{id}/`

- **Endpoint**: `PUT /api/finance/exchange-rates/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/finance/exchange-rates/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "from_currency": "USD",
  "to_currency": "LKR",
  "rate": "305.500000",
  "effective_date": "2026-11-23",
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "from_currency": "USD",
  "to_currency": "LKR",
  "rate": "305.500000",
  "effective_date": "2026-11-23",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1
}
```

---

### `PATCH /api/finance/exchange-rates/{id}/`

- **Endpoint**: `PATCH /api/finance/exchange-rates/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/finance/exchange-rates/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "from_currency": "USD",
  "to_currency": "LKR",
  "rate": "305.500000",
  "effective_date": "2026-11-23",
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "from_currency": "USD",
  "to_currency": "LKR",
  "rate": "305.500000",
  "effective_date": "2026-11-23",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1
}
```

---

### `DELETE /api/finance/exchange-rates/{id}/`

- **Endpoint**: `DELETE /api/finance/exchange-rates/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/finance/exchange-rates/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/finance/fiscal-periods/`

- **Endpoint**: `GET /api/finance/fiscal-periods/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/fiscal-periods/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "name": "Devrious Retail Group (Pvt) Ltd",
      "start_date": "string",
      "end_date": "string",
      "is_locked": "string",
      "is_year_end_closed": "string",
      "closed_at": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "closed_by": "string"
    }
  ]
}
```

---

### `POST /api/finance/fiscal-periods/`

- **Endpoint**: `POST /api/finance/fiscal-periods/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/finance/fiscal-periods/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_locked": false,
  "is_year_end_closed": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_locked": false,
  "is_year_end_closed": true,
  "closed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "closed_by": 1
}
```

---

### `GET /api/finance/fiscal-periods/{id}/`

- **Endpoint**: `GET /api/finance/fiscal-periods/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/fiscal-periods/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_locked": false,
  "is_year_end_closed": true,
  "closed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "closed_by": 1
}
```

---

### `PUT /api/finance/fiscal-periods/{id}/`

- **Endpoint**: `PUT /api/finance/fiscal-periods/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/finance/fiscal-periods/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_locked": false,
  "is_year_end_closed": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_locked": false,
  "is_year_end_closed": true,
  "closed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "closed_by": 1
}
```

---

### `PATCH /api/finance/fiscal-periods/{id}/`

- **Endpoint**: `PATCH /api/finance/fiscal-periods/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/finance/fiscal-periods/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_locked": false,
  "is_year_end_closed": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_locked": false,
  "is_year_end_closed": true,
  "closed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "closed_by": 1
}
```

---

### `DELETE /api/finance/fiscal-periods/{id}/`

- **Endpoint**: `DELETE /api/finance/fiscal-periods/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/finance/fiscal-periods/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/finance/fiscal-periods/{id}/lock/`

- **Endpoint**: `POST /api/finance/fiscal-periods/{id}/lock/`
- **Summary**: Lock a Fiscal Period (prevents backdated postings)

#### Example Request

```http
POST /api/finance/fiscal-periods/{id}/lock/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_locked": false,
  "is_year_end_closed": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_locked": false,
  "is_year_end_closed": true,
  "closed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "closed_by": 1
}
```

---

### `POST /api/finance/fiscal-periods/{id}/reopen/`

- **Endpoint**: `POST /api/finance/fiscal-periods/{id}/reopen/`
- **Summary**: Reopen a locked Fiscal Period under administrative control

#### Example Request

```http
POST /api/finance/fiscal-periods/{id}/reopen/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_locked": false,
  "is_year_end_closed": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_locked": false,
  "is_year_end_closed": true,
  "closed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "closed_by": 1
}
```

---

### `GET /api/finance/fixed-assets/`

- **Endpoint**: `GET /api/finance/fixed-assets/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/fixed-assets/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "asset_code": "string",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "category": "string",
      "purchase_date": "string",
      "purchase_cost": "string",
      "salvage_value": "string",
      "useful_life_years": "string",
      "depreciation_method": "string",
      "annual_rate_percent": "string",
      "accumulated_depreciation": "string",
      "net_book_value": "string",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1
    }
  ]
}
```

---

### `POST /api/finance/fixed-assets/`

- **Endpoint**: `POST /api/finance/fixed-assets/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/finance/fixed-assets/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "asset_code": "sample_asset_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "category": "sample_category",
  "purchase_date": "2026-11-23",
  "purchase_cost": "1000.00",
  "salvage_value": "1000.00",
  "useful_life_years": 1,
  "depreciation_method": "STRAIGHT_LINE",
  "annual_rate_percent": "1000.00",
  "accumulated_depreciation": "1000.00",
  "net_book_value": "1000.00",
  "status": "ACTIVE",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "asset_code": "sample_asset_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "category": "sample_category",
  "purchase_date": "2026-11-23",
  "purchase_cost": "1000.00",
  "salvage_value": "1000.00",
  "useful_life_years": 1,
  "depreciation_method": "STRAIGHT_LINE",
  "annual_rate_percent": "1000.00",
  "accumulated_depreciation": "1000.00",
  "net_book_value": "1000.00",
  "status": "ACTIVE",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

---

### `GET /api/finance/fixed-assets/{id}/`

- **Endpoint**: `GET /api/finance/fixed-assets/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/fixed-assets/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "asset_code": "sample_asset_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "category": "sample_category",
  "purchase_date": "2026-11-23",
  "purchase_cost": "1000.00",
  "salvage_value": "1000.00",
  "useful_life_years": 1,
  "depreciation_method": "STRAIGHT_LINE",
  "annual_rate_percent": "1000.00",
  "accumulated_depreciation": "1000.00",
  "net_book_value": "1000.00",
  "status": "ACTIVE",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

---

### `PUT /api/finance/fixed-assets/{id}/`

- **Endpoint**: `PUT /api/finance/fixed-assets/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/finance/fixed-assets/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "asset_code": "sample_asset_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "category": "sample_category",
  "purchase_date": "2026-11-23",
  "purchase_cost": "1000.00",
  "salvage_value": "1000.00",
  "useful_life_years": 1,
  "depreciation_method": "STRAIGHT_LINE",
  "annual_rate_percent": "1000.00",
  "accumulated_depreciation": "1000.00",
  "net_book_value": "1000.00",
  "status": "ACTIVE",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "asset_code": "sample_asset_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "category": "sample_category",
  "purchase_date": "2026-11-23",
  "purchase_cost": "1000.00",
  "salvage_value": "1000.00",
  "useful_life_years": 1,
  "depreciation_method": "STRAIGHT_LINE",
  "annual_rate_percent": "1000.00",
  "accumulated_depreciation": "1000.00",
  "net_book_value": "1000.00",
  "status": "ACTIVE",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

---

### `PATCH /api/finance/fixed-assets/{id}/`

- **Endpoint**: `PATCH /api/finance/fixed-assets/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/finance/fixed-assets/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "asset_code": "sample_asset_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "category": "sample_category",
  "purchase_date": "2026-11-23",
  "purchase_cost": "1000.00",
  "salvage_value": "1000.00",
  "useful_life_years": 1,
  "depreciation_method": "STRAIGHT_LINE",
  "annual_rate_percent": "1000.00",
  "accumulated_depreciation": "1000.00",
  "net_book_value": "1000.00",
  "status": "ACTIVE",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "asset_code": "sample_asset_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "category": "sample_category",
  "purchase_date": "2026-11-23",
  "purchase_cost": "1000.00",
  "salvage_value": "1000.00",
  "useful_life_years": 1,
  "depreciation_method": "STRAIGHT_LINE",
  "annual_rate_percent": "1000.00",
  "accumulated_depreciation": "1000.00",
  "net_book_value": "1000.00",
  "status": "ACTIVE",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

---

### `DELETE /api/finance/fixed-assets/{id}/`

- **Endpoint**: `DELETE /api/finance/fixed-assets/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/finance/fixed-assets/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/finance/fixed-assets/{id}/run-depreciation/`

- **Endpoint**: `POST /api/finance/fixed-assets/{id}/run-depreciation/`
- **Summary**: Calculate & Post Monthly Depreciation for Fixed Asset

#### Example Request

```http
POST /api/finance/fixed-assets/{id}/run-depreciation/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "asset_code": "sample_asset_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "category": "sample_category",
  "purchase_date": "2026-11-23",
  "purchase_cost": "1000.00",
  "salvage_value": "1000.00",
  "useful_life_years": 1,
  "depreciation_method": "STRAIGHT_LINE",
  "annual_rate_percent": "1000.00",
  "accumulated_depreciation": "1000.00",
  "net_book_value": "1000.00",
  "status": "ACTIVE",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "asset_code": "sample_asset_code",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "category": "sample_category",
  "purchase_date": "2026-11-23",
  "purchase_cost": "1000.00",
  "salvage_value": "1000.00",
  "useful_life_years": 1,
  "depreciation_method": "STRAIGHT_LINE",
  "annual_rate_percent": "1000.00",
  "accumulated_depreciation": "1000.00",
  "net_book_value": "1000.00",
  "status": "ACTIVE",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

---

### `GET /api/finance/intercompany-transactions/`

- **Endpoint**: `GET /api/finance/intercompany-transactions/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/intercompany-transactions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "reference_number": "BOC-SLIP-998877",
      "transaction_date": "string",
      "amount": "35000.00",
      "currency": "LKR",
      "description": "string",
      "is_eliminated_on_consolidation": "string",
      "created_at": "string",
      "tenant": 1,
      "from_company": "string",
      "to_company": "string"
    }
  ]
}
```

---

### `POST /api/finance/intercompany-transactions/`

- **Endpoint**: `POST /api/finance/intercompany-transactions/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/finance/intercompany-transactions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "reference_number": "BOC-SLIP-998877",
  "transaction_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "description": "sample_description",
  "is_eliminated_on_consolidation": true,
  "tenant": 1,
  "from_company": 1,
  "to_company": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "reference_number": "BOC-SLIP-998877",
  "transaction_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "description": "sample_description",
  "is_eliminated_on_consolidation": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "from_company": 1,
  "to_company": 1
}
```

---

### `GET /api/finance/intercompany-transactions/{id}/`

- **Endpoint**: `GET /api/finance/intercompany-transactions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/intercompany-transactions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "reference_number": "BOC-SLIP-998877",
  "transaction_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "description": "sample_description",
  "is_eliminated_on_consolidation": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "from_company": 1,
  "to_company": 1
}
```

---

### `PUT /api/finance/intercompany-transactions/{id}/`

- **Endpoint**: `PUT /api/finance/intercompany-transactions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/finance/intercompany-transactions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "reference_number": "BOC-SLIP-998877",
  "transaction_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "description": "sample_description",
  "is_eliminated_on_consolidation": true,
  "tenant": 1,
  "from_company": 1,
  "to_company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "reference_number": "BOC-SLIP-998877",
  "transaction_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "description": "sample_description",
  "is_eliminated_on_consolidation": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "from_company": 1,
  "to_company": 1
}
```

---

### `PATCH /api/finance/intercompany-transactions/{id}/`

- **Endpoint**: `PATCH /api/finance/intercompany-transactions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/finance/intercompany-transactions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "reference_number": "BOC-SLIP-998877",
  "transaction_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "description": "sample_description",
  "is_eliminated_on_consolidation": true,
  "tenant": 1,
  "from_company": 1,
  "to_company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "reference_number": "BOC-SLIP-998877",
  "transaction_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "description": "sample_description",
  "is_eliminated_on_consolidation": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "from_company": 1,
  "to_company": 1
}
```

---

### `DELETE /api/finance/intercompany-transactions/{id}/`

- **Endpoint**: `DELETE /api/finance/intercompany-transactions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/finance/intercompany-transactions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/finance/journals/`

- **Endpoint**: `GET /api/finance/journals/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/journals/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "entry_number": "JE-2026-0001",
      "entry_date": "string",
      "narration": "string",
      "source_module": "string",
      "source_reference": "string",
      "currency": "LKR",
      "exchange_rate": "1.000000",
      "status": "string",
      "reversed_entry": "string",
      "created_by": "string",
      "posted_at": "string",
      "created_at": "string",
      "lines": "string"
    }
  ]
}
```

---

### `POST /api/finance/journals/`

- **Endpoint**: `POST /api/finance/journals/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/finance/journals/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "entry_number": "JE-2026-0001",
  "entry_date": "2026-11-23",
  "narration": "sample_narration",
  "source_module": "sample_source_module",
  "source_reference": "sample_source_reference",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "lines": [
    {
      "account": "string",
      "description": "string",
      "debit": "string",
      "credit": "string"
    }
  ]
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "entry_number": "JE-2026-0001",
  "entry_date": "2026-11-23",
  "narration": "sample_narration",
  "source_module": "sample_source_module",
  "source_reference": "sample_source_reference",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "status": "DRAFT",
  "reversed_entry": 1,
  "created_by": 1,
  "posted_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "account": "string",
      "account_code": "string",
      "account_name": "string",
      "description": "string",
      "debit": "string",
      "credit": "string"
    }
  ]
}
```

---

### `GET /api/finance/journals/{id}/`

- **Endpoint**: `GET /api/finance/journals/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/journals/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "entry_number": "JE-2026-0001",
  "entry_date": "2026-11-23",
  "narration": "sample_narration",
  "source_module": "sample_source_module",
  "source_reference": "sample_source_reference",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "status": "DRAFT",
  "reversed_entry": 1,
  "created_by": 1,
  "posted_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "account": "string",
      "account_code": "string",
      "account_name": "string",
      "description": "string",
      "debit": "string",
      "credit": "string"
    }
  ]
}
```

---

### `PUT /api/finance/journals/{id}/`

- **Endpoint**: `PUT /api/finance/journals/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/finance/journals/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "entry_number": "JE-2026-0001",
  "entry_date": "2026-11-23",
  "narration": "sample_narration",
  "source_module": "sample_source_module",
  "source_reference": "sample_source_reference",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "lines": [
    {
      "account": "string",
      "description": "string",
      "debit": "string",
      "credit": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "entry_number": "JE-2026-0001",
  "entry_date": "2026-11-23",
  "narration": "sample_narration",
  "source_module": "sample_source_module",
  "source_reference": "sample_source_reference",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "status": "DRAFT",
  "reversed_entry": 1,
  "created_by": 1,
  "posted_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "account": "string",
      "account_code": "string",
      "account_name": "string",
      "description": "string",
      "debit": "string",
      "credit": "string"
    }
  ]
}
```

---

### `PATCH /api/finance/journals/{id}/`

- **Endpoint**: `PATCH /api/finance/journals/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/finance/journals/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "entry_number": "JE-2026-0001",
  "entry_date": "2026-11-23",
  "narration": "sample_narration",
  "source_module": "sample_source_module",
  "source_reference": "sample_source_reference",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "lines": [
    {
      "account": "string",
      "description": "string",
      "debit": "string",
      "credit": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "entry_number": "JE-2026-0001",
  "entry_date": "2026-11-23",
  "narration": "sample_narration",
  "source_module": "sample_source_module",
  "source_reference": "sample_source_reference",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "status": "DRAFT",
  "reversed_entry": 1,
  "created_by": 1,
  "posted_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "account": "string",
      "account_code": "string",
      "account_name": "string",
      "description": "string",
      "debit": "string",
      "credit": "string"
    }
  ]
}
```

---

### `DELETE /api/finance/journals/{id}/`

- **Endpoint**: `DELETE /api/finance/journals/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/finance/journals/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/finance/journals/{id}/post_entry/`

- **Endpoint**: `POST /api/finance/journals/{id}/post_entry/`
- **Summary**: Post a Draft Journal Entry to General Ledger

#### Example Request

```http
POST /api/finance/journals/{id}/post_entry/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "entry_number": "JE-2026-0001",
  "entry_date": "2026-11-23",
  "narration": "sample_narration",
  "source_module": "sample_source_module",
  "source_reference": "sample_source_reference",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "lines": [
    {
      "account": "string",
      "description": "string",
      "debit": "string",
      "credit": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "entry_number": "JE-2026-0001",
  "entry_date": "2026-11-23",
  "narration": "sample_narration",
  "source_module": "sample_source_module",
  "source_reference": "sample_source_reference",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "status": "DRAFT",
  "reversed_entry": 1,
  "created_by": 1,
  "posted_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "account": "string",
      "account_code": "string",
      "account_name": "string",
      "description": "string",
      "debit": "string",
      "credit": "string"
    }
  ]
}
```

---

### `POST /api/finance/journals/{id}/reverse/`

- **Endpoint**: `POST /api/finance/journals/{id}/reverse/`
- **Summary**: Reverse a Posted Journal Entry

#### Example Request

```http
POST /api/finance/journals/{id}/reverse/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "entry_number": "JE-2026-0001",
  "entry_date": "2026-11-23",
  "narration": "sample_narration",
  "source_module": "sample_source_module",
  "source_reference": "sample_source_reference",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "lines": [
    {
      "account": "string",
      "description": "string",
      "debit": "string",
      "credit": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "entry_number": "JE-2026-0001",
  "entry_date": "2026-11-23",
  "narration": "sample_narration",
  "source_module": "sample_source_module",
  "source_reference": "sample_source_reference",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "status": "DRAFT",
  "reversed_entry": 1,
  "created_by": 1,
  "posted_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "account": "string",
      "account_code": "string",
      "account_name": "string",
      "description": "string",
      "debit": "string",
      "credit": "string"
    }
  ]
}
```

---

### `GET /api/finance/payments/`

- **Endpoint**: `GET /api/finance/payments/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/payments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "payment_number": "PAY-2026-0001",
      "payment_type": "string",
      "payment_date": "string",
      "amount": "35000.00",
      "currency": "LKR",
      "payment_method": "string",
      "reference_number": "BOC-SLIP-998877",
      "is_reconciled": "string",
      "reconciled_at": "string",
      "notes": "Verified and recorded by administrator.",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "bank_account": "string",
      "customer_invoice": "string",
      "vendor_bill": "string",
      "journal_entry": "string",
      "created_by": "string"
    }
  ]
}
```

---

### `POST /api/finance/payments/`

- **Endpoint**: `POST /api/finance/payments/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/finance/payments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "payment_number": "PAY-2026-0001",
  "payment_type": "CUSTOMER_RECEIPT",
  "payment_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "payment_method": "sample_payment_method",
  "reference_number": "BOC-SLIP-998877",
  "is_reconciled": true,
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bank_account": 1,
  "customer_invoice": 1,
  "vendor_bill": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "payment_number": "PAY-2026-0001",
  "payment_type": "CUSTOMER_RECEIPT",
  "payment_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "payment_method": "sample_payment_method",
  "reference_number": "BOC-SLIP-998877",
  "is_reconciled": true,
  "reconciled_at": "2026-11-23T10:30:00+05:30",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bank_account": 1,
  "customer_invoice": 1,
  "vendor_bill": 1,
  "journal_entry": 1,
  "created_by": 1
}
```

---

### `GET /api/finance/payments/{id}/`

- **Endpoint**: `GET /api/finance/payments/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/payments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "payment_number": "PAY-2026-0001",
  "payment_type": "CUSTOMER_RECEIPT",
  "payment_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "payment_method": "sample_payment_method",
  "reference_number": "BOC-SLIP-998877",
  "is_reconciled": true,
  "reconciled_at": "2026-11-23T10:30:00+05:30",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bank_account": 1,
  "customer_invoice": 1,
  "vendor_bill": 1,
  "journal_entry": 1,
  "created_by": 1
}
```

---

### `PUT /api/finance/payments/{id}/`

- **Endpoint**: `PUT /api/finance/payments/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/finance/payments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "payment_number": "PAY-2026-0001",
  "payment_type": "CUSTOMER_RECEIPT",
  "payment_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "payment_method": "sample_payment_method",
  "reference_number": "BOC-SLIP-998877",
  "is_reconciled": true,
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bank_account": 1,
  "customer_invoice": 1,
  "vendor_bill": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "payment_number": "PAY-2026-0001",
  "payment_type": "CUSTOMER_RECEIPT",
  "payment_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "payment_method": "sample_payment_method",
  "reference_number": "BOC-SLIP-998877",
  "is_reconciled": true,
  "reconciled_at": "2026-11-23T10:30:00+05:30",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bank_account": 1,
  "customer_invoice": 1,
  "vendor_bill": 1,
  "journal_entry": 1,
  "created_by": 1
}
```

---

### `PATCH /api/finance/payments/{id}/`

- **Endpoint**: `PATCH /api/finance/payments/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/finance/payments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "payment_number": "PAY-2026-0001",
  "payment_type": "CUSTOMER_RECEIPT",
  "payment_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "payment_method": "sample_payment_method",
  "reference_number": "BOC-SLIP-998877",
  "is_reconciled": true,
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bank_account": 1,
  "customer_invoice": 1,
  "vendor_bill": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "payment_number": "PAY-2026-0001",
  "payment_type": "CUSTOMER_RECEIPT",
  "payment_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "payment_method": "sample_payment_method",
  "reference_number": "BOC-SLIP-998877",
  "is_reconciled": true,
  "reconciled_at": "2026-11-23T10:30:00+05:30",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bank_account": 1,
  "customer_invoice": 1,
  "vendor_bill": 1,
  "journal_entry": 1,
  "created_by": 1
}
```

---

### `DELETE /api/finance/payments/{id}/`

- **Endpoint**: `DELETE /api/finance/payments/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/finance/payments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/finance/payments/{id}/reconcile/`

- **Endpoint**: `POST /api/finance/payments/{id}/reconcile/`
- **Summary**: Reconcile a Bank/Cash Transaction against Bank Statement

#### Example Request

```http
POST /api/finance/payments/{id}/reconcile/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "payment_number": "PAY-2026-0001",
  "payment_type": "CUSTOMER_RECEIPT",
  "payment_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "payment_method": "sample_payment_method",
  "reference_number": "BOC-SLIP-998877",
  "is_reconciled": true,
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bank_account": 1,
  "customer_invoice": 1,
  "vendor_bill": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "payment_number": "PAY-2026-0001",
  "payment_type": "CUSTOMER_RECEIPT",
  "payment_date": "2026-11-23",
  "amount": "35000.00",
  "currency": "LKR",
  "payment_method": "sample_payment_method",
  "reference_number": "BOC-SLIP-998877",
  "is_reconciled": true,
  "reconciled_at": "2026-11-23T10:30:00+05:30",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bank_account": 1,
  "customer_invoice": 1,
  "vendor_bill": 1,
  "journal_entry": 1,
  "created_by": 1
}
```

---

### `GET /api/finance/reports/statements/`

- **Endpoint**: `GET /api/finance/reports/statements/`
- **Summary**: Financial Statements (Trial Balance, P&L, Balance Sheet, AR/AP Aging, Sri Lanka IRD VAT 200 Return)

#### Example Request

```http
GET /api/finance/reports/statements/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "query_params": {
    "company": 1
  }
}
```

#### Example Response (`200 OK`)

```json
{
  "trial_balance": [
    {
      "code": "1000",
      "name": "Cash & Bank",
      "account_type": "ASSET",
      "balance": "450000.00"
    },
    {
      "code": "1100",
      "name": "Accounts Receivable (Trade Debtors)",
      "account_type": "ASSET",
      "balance": "118000.00"
    },
    {
      "code": "1200",
      "name": "Inventory Asset",
      "account_type": "ASSET",
      "balance": "1800000.00"
    },
    {
      "code": "2000",
      "name": "Accounts Payable (Trade Creditors)",
      "account_type": "LIABILITY",
      "balance": "1800000.00"
    },
    {
      "code": "2100",
      "name": "Output VAT Payable (IRD)",
      "account_type": "LIABILITY",
      "balance": "18000.00"
    },
    {
      "code": "4000",
      "name": "Sales Revenue",
      "account_type": "REVENUE",
      "balance": "100000.00"
    }
  ],
  "income_statement_pnl": {
    "total_revenue": "100000.00",
    "total_expenses": "40000.00",
    "net_profit_or_loss": "60000.00"
  },
  "balance_sheet": {
    "total_assets": "2368000.00",
    "total_liabilities": "1818000.00",
    "total_equity_plus_current_profit": "550000.00"
  },
  "aging_summary": {
    "accounts_receivable_outstanding": "118000.00",
    "accounts_payable_outstanding": "1800000.00"
  },
  "sri_lanka_ird_vat_200_return": {
    "standard_vat_rate_percent": "18.00",
    "total_output_vat_collected": "18000.00",
    "suspended_vat_svat_supplies_value": "0.00",
    "total_allowable_input_vat_credit": "5400.00",
    "net_vat_payable_to_ird": "12600.00"
  }
}
```

---

### `GET /api/finance/vendor-bills/`

- **Endpoint**: `GET /api/finance/vendor-bills/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/vendor-bills/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "supplier": "string",
      "supplier_name": "string",
      "bill_number": "BILL-2026-0001",
      "vendor_invoice_ref": "string",
      "bill_date": "string",
      "due_date": "string",
      "currency": "LKR",
      "exchange_rate": "1.000000",
      "subtotal": "100000.00",
      "input_vat_amount": "18000.00",
      "withholding_tax_amount": "0.00",
      "grand_total": "118000.00",
      "amount_paid": "118000.00",
      "balance_due": "0.00",
      "status": "string",
      "journal_entry": "string",
      "grn_reference": "string",
      "created_by": "string",
      "created_at": "string",
      "lines": "string"
    }
  ]
}
```

---

### `POST /api/finance/vendor-bills/`

- **Endpoint**: `POST /api/finance/vendor-bills/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/finance/vendor-bills/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "bill_number": "BILL-2026-0001",
  "vendor_invoice_ref": "sample_vendor_invoice_ref",
  "bill_date": "2026-11-23",
  "due_date": "2026-11-23",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "amount_paid": "118000.00",
  "grn_reference": "sample_grn_reference",
  "lines": [
    {
      "description": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00",
      "input_vat_rate": "18.00",
      "expense_account": "string"
    }
  ]
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "supplier_name": "sample_supplier_name",
  "bill_number": "BILL-2026-0001",
  "vendor_invoice_ref": "sample_vendor_invoice_ref",
  "bill_date": "2026-11-23",
  "due_date": "2026-11-23",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "subtotal": "100000.00",
  "input_vat_amount": "18000.00",
  "withholding_tax_amount": "0.00",
  "grand_total": "118000.00",
  "amount_paid": "118000.00",
  "balance_due": "0.00",
  "status": "DRAFT",
  "journal_entry": 1,
  "grn_reference": "sample_grn_reference",
  "created_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "description": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00",
      "input_vat_rate": "18.00",
      "input_vat_amount": "18000.00",
      "line_total": "string",
      "expense_account": "string"
    }
  ]
}
```

---

### `GET /api/finance/vendor-bills/{id}/`

- **Endpoint**: `GET /api/finance/vendor-bills/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/finance/vendor-bills/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "supplier_name": "sample_supplier_name",
  "bill_number": "BILL-2026-0001",
  "vendor_invoice_ref": "sample_vendor_invoice_ref",
  "bill_date": "2026-11-23",
  "due_date": "2026-11-23",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "subtotal": "100000.00",
  "input_vat_amount": "18000.00",
  "withholding_tax_amount": "0.00",
  "grand_total": "118000.00",
  "amount_paid": "118000.00",
  "balance_due": "0.00",
  "status": "DRAFT",
  "journal_entry": 1,
  "grn_reference": "sample_grn_reference",
  "created_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "description": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00",
      "input_vat_rate": "18.00",
      "input_vat_amount": "18000.00",
      "line_total": "string",
      "expense_account": "string"
    }
  ]
}
```

---

### `PUT /api/finance/vendor-bills/{id}/`

- **Endpoint**: `PUT /api/finance/vendor-bills/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/finance/vendor-bills/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "bill_number": "BILL-2026-0001",
  "vendor_invoice_ref": "sample_vendor_invoice_ref",
  "bill_date": "2026-11-23",
  "due_date": "2026-11-23",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "amount_paid": "118000.00",
  "grn_reference": "sample_grn_reference",
  "lines": [
    {
      "description": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00",
      "input_vat_rate": "18.00",
      "expense_account": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "supplier_name": "sample_supplier_name",
  "bill_number": "BILL-2026-0001",
  "vendor_invoice_ref": "sample_vendor_invoice_ref",
  "bill_date": "2026-11-23",
  "due_date": "2026-11-23",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "subtotal": "100000.00",
  "input_vat_amount": "18000.00",
  "withholding_tax_amount": "0.00",
  "grand_total": "118000.00",
  "amount_paid": "118000.00",
  "balance_due": "0.00",
  "status": "DRAFT",
  "journal_entry": 1,
  "grn_reference": "sample_grn_reference",
  "created_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "description": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00",
      "input_vat_rate": "18.00",
      "input_vat_amount": "18000.00",
      "line_total": "string",
      "expense_account": "string"
    }
  ]
}
```

---

### `PATCH /api/finance/vendor-bills/{id}/`

- **Endpoint**: `PATCH /api/finance/vendor-bills/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/finance/vendor-bills/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "bill_number": "BILL-2026-0001",
  "vendor_invoice_ref": "sample_vendor_invoice_ref",
  "bill_date": "2026-11-23",
  "due_date": "2026-11-23",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "amount_paid": "118000.00",
  "grn_reference": "sample_grn_reference",
  "lines": [
    {
      "description": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00",
      "input_vat_rate": "18.00",
      "expense_account": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "supplier_name": "sample_supplier_name",
  "bill_number": "BILL-2026-0001",
  "vendor_invoice_ref": "sample_vendor_invoice_ref",
  "bill_date": "2026-11-23",
  "due_date": "2026-11-23",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "subtotal": "100000.00",
  "input_vat_amount": "18000.00",
  "withholding_tax_amount": "0.00",
  "grand_total": "118000.00",
  "amount_paid": "118000.00",
  "balance_due": "0.00",
  "status": "DRAFT",
  "journal_entry": 1,
  "grn_reference": "sample_grn_reference",
  "created_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "description": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00",
      "input_vat_rate": "18.00",
      "input_vat_amount": "18000.00",
      "line_total": "string",
      "expense_account": "string"
    }
  ]
}
```

---

### `DELETE /api/finance/vendor-bills/{id}/`

- **Endpoint**: `DELETE /api/finance/vendor-bills/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/finance/vendor-bills/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/finance/vendor-bills/{id}/post_bill/`

- **Endpoint**: `POST /api/finance/vendor-bills/{id}/post_bill/`
- **Summary**: Post a Draft Vendor Bill to AP and General Ledger

#### Example Request

```http
POST /api/finance/vendor-bills/{id}/post_bill/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "bill_number": "BILL-2026-0001",
  "vendor_invoice_ref": "sample_vendor_invoice_ref",
  "bill_date": "2026-11-23",
  "due_date": "2026-11-23",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "amount_paid": "118000.00",
  "grn_reference": "sample_grn_reference",
  "lines": [
    {
      "description": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00",
      "input_vat_rate": "18.00",
      "expense_account": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "supplier_name": "sample_supplier_name",
  "bill_number": "BILL-2026-0001",
  "vendor_invoice_ref": "sample_vendor_invoice_ref",
  "bill_date": "2026-11-23",
  "due_date": "2026-11-23",
  "currency": "LKR",
  "exchange_rate": "1.000000",
  "subtotal": "100000.00",
  "input_vat_amount": "18000.00",
  "withholding_tax_amount": "0.00",
  "grand_total": "118000.00",
  "amount_paid": "118000.00",
  "balance_due": "0.00",
  "status": "DRAFT",
  "journal_entry": 1,
  "grn_reference": "sample_grn_reference",
  "created_by": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "lines": [
    {
      "id": 1,
      "description": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00",
      "input_vat_rate": "18.00",
      "input_vat_amount": "18000.00",
      "line_total": "string",
      "expense_account": "string"
    }
  ]
}
```

---

## 7. Human Resources & Sri Lanka Statutory Payroll (ERP-HR & EPF/ETF/APIT)

### `GET /api/hr/attendance/`

- **Endpoint**: `GET /api/hr/attendance/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/attendance/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "employee_name": "string",
      "work_date": "string",
      "clock_in": "string",
      "clock_out": "string",
      "regular_hours": "string",
      "overtime_hours": "string",
      "is_present": "string",
      "notes": "Verified and recorded by administrator.",
      "tenant": 1,
      "employee": "string"
    }
  ]
}
```

---

### `POST /api/hr/attendance/`

- **Endpoint**: `POST /api/hr/attendance/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/hr/attendance/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "work_date": "2026-11-23",
  "clock_in": "2026-11-23T10:30:00+05:30",
  "clock_out": "2026-11-23T10:30:00+05:30",
  "regular_hours": "1000.00",
  "overtime_hours": "1000.00",
  "is_present": true,
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "employee": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "employee_name": "sample_employee_name",
  "work_date": "2026-11-23",
  "clock_in": "2026-11-23T10:30:00+05:30",
  "clock_out": "2026-11-23T10:30:00+05:30",
  "regular_hours": "1000.00",
  "overtime_hours": "1000.00",
  "is_present": true,
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "employee": 1
}
```

---

### `GET /api/hr/attendance/{id}/`

- **Endpoint**: `GET /api/hr/attendance/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/attendance/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "employee_name": "sample_employee_name",
  "work_date": "2026-11-23",
  "clock_in": "2026-11-23T10:30:00+05:30",
  "clock_out": "2026-11-23T10:30:00+05:30",
  "regular_hours": "1000.00",
  "overtime_hours": "1000.00",
  "is_present": true,
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "employee": 1
}
```

---

### `PUT /api/hr/attendance/{id}/`

- **Endpoint**: `PUT /api/hr/attendance/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/hr/attendance/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "work_date": "2026-11-23",
  "clock_in": "2026-11-23T10:30:00+05:30",
  "clock_out": "2026-11-23T10:30:00+05:30",
  "regular_hours": "1000.00",
  "overtime_hours": "1000.00",
  "is_present": true,
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "employee": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "employee_name": "sample_employee_name",
  "work_date": "2026-11-23",
  "clock_in": "2026-11-23T10:30:00+05:30",
  "clock_out": "2026-11-23T10:30:00+05:30",
  "regular_hours": "1000.00",
  "overtime_hours": "1000.00",
  "is_present": true,
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "employee": 1
}
```

---

### `PATCH /api/hr/attendance/{id}/`

- **Endpoint**: `PATCH /api/hr/attendance/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/hr/attendance/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "work_date": "2026-11-23",
  "clock_in": "2026-11-23T10:30:00+05:30",
  "clock_out": "2026-11-23T10:30:00+05:30",
  "regular_hours": "1000.00",
  "overtime_hours": "1000.00",
  "is_present": true,
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "employee": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "employee_name": "sample_employee_name",
  "work_date": "2026-11-23",
  "clock_in": "2026-11-23T10:30:00+05:30",
  "clock_out": "2026-11-23T10:30:00+05:30",
  "regular_hours": "1000.00",
  "overtime_hours": "1000.00",
  "is_present": true,
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "employee": 1
}
```

---

### `DELETE /api/hr/attendance/{id}/`

- **Endpoint**: `DELETE /api/hr/attendance/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/hr/attendance/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/hr/calculator/epf-etf-apit/`

- **Endpoint**: `POST /api/hr/calculator/epf-etf-apit/`
- **Summary**: Calculate Sri Lanka Statutory EPF (12% Employer / 8% Employee), ETF (3% Employer), and APIT (`ERP-HR-005`, `006`)

#### Example Request

```http
POST /api/hr/calculator/epf-etf-apit/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "basic_salary": "100000.00",
  "allowances": "0.00"
}
```

#### Example Response (`200 OK`)

```json
{
  "basic_salary": "100000.00",
  "allowances": "0.00",
  "gross_salary": "100000.00",
  "epf_employee_8_percent": "8000.00",
  "epf_employer_12_percent": "12000.00",
  "etf_employer_3_percent": "3000.00",
  "apit_tax": "0.00",
  "net_salary": "92000.00"
}
```

---

### `GET /api/hr/employees/`

- **Endpoint**: `GET /api/hr/employees/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/employees/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "years_of_service": "string",
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "employee_code": "EMP-001",
      "first_name": "Kasun",
      "last_name": "Perera",
      "email": "kasun@devriousretail.lk",
      "phone": "+94771234567",
      "nic_number": "199214503321",
      "tin_number": "TIN-100200300",
      "epf_member_number": "EPF-4402",
      "department": "Finance",
      "job_title": "Senior Accountant",
      "pay_grade": "string",
      "hire_date": "string",
      "termination_date": "string",
      "status": "string",
      "basic_salary": "100000.00",
      "fixed_allowances": "15000.00",
      "hourly_overtime_rate": "string",
      "bank_name": "string",
      "bank_branch_code": "string",
      "bank_account_number": "string",
      "annual_leave_balance": "string",
      "casual_leave_balance": "string",
      "medical_leave_balance": "string",
      "created_at": "string",
      "updated_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "user": 2
    }
  ]
}
```

---

### `POST /api/hr/employees/`

- **Endpoint**: `POST /api/hr/employees/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/hr/employees/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "employee_code": "EMP-001",
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "tin_number": "TIN-100200300",
  "epf_member_number": "EPF-4402",
  "department": "Finance",
  "job_title": "Senior Accountant",
  "pay_grade": "sample_pay_grade",
  "hire_date": "2026-11-23",
  "termination_date": "2026-11-23",
  "status": "ACTIVE",
  "basic_salary": "100000.00",
  "fixed_allowances": "15000.00",
  "hourly_overtime_rate": "1000.00",
  "bank_name": "sample_bank_name",
  "bank_branch_code": "sample_bank_branch_code",
  "bank_account_number": "sample_bank_account_number",
  "annual_leave_balance": "1000.00",
  "casual_leave_balance": "1000.00",
  "medical_leave_balance": "1000.00",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "user": 2
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "years_of_service": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "employee_code": "EMP-001",
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "tin_number": "TIN-100200300",
  "epf_member_number": "EPF-4402",
  "department": "Finance",
  "job_title": "Senior Accountant",
  "pay_grade": "sample_pay_grade",
  "hire_date": "2026-11-23",
  "termination_date": "2026-11-23",
  "status": "ACTIVE",
  "basic_salary": "100000.00",
  "fixed_allowances": "15000.00",
  "hourly_overtime_rate": "1000.00",
  "bank_name": "sample_bank_name",
  "bank_branch_code": "sample_bank_branch_code",
  "bank_account_number": "sample_bank_account_number",
  "annual_leave_balance": "1000.00",
  "casual_leave_balance": "1000.00",
  "medical_leave_balance": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "user": 2
}
```

---

### `GET /api/hr/employees/{id}/`

- **Endpoint**: `GET /api/hr/employees/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/employees/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "years_of_service": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "employee_code": "EMP-001",
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "tin_number": "TIN-100200300",
  "epf_member_number": "EPF-4402",
  "department": "Finance",
  "job_title": "Senior Accountant",
  "pay_grade": "sample_pay_grade",
  "hire_date": "2026-11-23",
  "termination_date": "2026-11-23",
  "status": "ACTIVE",
  "basic_salary": "100000.00",
  "fixed_allowances": "15000.00",
  "hourly_overtime_rate": "1000.00",
  "bank_name": "sample_bank_name",
  "bank_branch_code": "sample_bank_branch_code",
  "bank_account_number": "sample_bank_account_number",
  "annual_leave_balance": "1000.00",
  "casual_leave_balance": "1000.00",
  "medical_leave_balance": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "user": 2
}
```

---

### `PUT /api/hr/employees/{id}/`

- **Endpoint**: `PUT /api/hr/employees/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/hr/employees/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "employee_code": "EMP-001",
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "tin_number": "TIN-100200300",
  "epf_member_number": "EPF-4402",
  "department": "Finance",
  "job_title": "Senior Accountant",
  "pay_grade": "sample_pay_grade",
  "hire_date": "2026-11-23",
  "termination_date": "2026-11-23",
  "status": "ACTIVE",
  "basic_salary": "100000.00",
  "fixed_allowances": "15000.00",
  "hourly_overtime_rate": "1000.00",
  "bank_name": "sample_bank_name",
  "bank_branch_code": "sample_bank_branch_code",
  "bank_account_number": "sample_bank_account_number",
  "annual_leave_balance": "1000.00",
  "casual_leave_balance": "1000.00",
  "medical_leave_balance": "1000.00",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "user": 2
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "years_of_service": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "employee_code": "EMP-001",
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "tin_number": "TIN-100200300",
  "epf_member_number": "EPF-4402",
  "department": "Finance",
  "job_title": "Senior Accountant",
  "pay_grade": "sample_pay_grade",
  "hire_date": "2026-11-23",
  "termination_date": "2026-11-23",
  "status": "ACTIVE",
  "basic_salary": "100000.00",
  "fixed_allowances": "15000.00",
  "hourly_overtime_rate": "1000.00",
  "bank_name": "sample_bank_name",
  "bank_branch_code": "sample_bank_branch_code",
  "bank_account_number": "sample_bank_account_number",
  "annual_leave_balance": "1000.00",
  "casual_leave_balance": "1000.00",
  "medical_leave_balance": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "user": 2
}
```

---

### `PATCH /api/hr/employees/{id}/`

- **Endpoint**: `PATCH /api/hr/employees/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/hr/employees/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "employee_code": "EMP-001",
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "tin_number": "TIN-100200300",
  "epf_member_number": "EPF-4402",
  "department": "Finance",
  "job_title": "Senior Accountant",
  "pay_grade": "sample_pay_grade",
  "hire_date": "2026-11-23",
  "termination_date": "2026-11-23",
  "status": "ACTIVE",
  "basic_salary": "100000.00",
  "fixed_allowances": "15000.00",
  "hourly_overtime_rate": "1000.00",
  "bank_name": "sample_bank_name",
  "bank_branch_code": "sample_bank_branch_code",
  "bank_account_number": "sample_bank_account_number",
  "annual_leave_balance": "1000.00",
  "casual_leave_balance": "1000.00",
  "medical_leave_balance": "1000.00",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "user": 2
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "years_of_service": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "employee_code": "EMP-001",
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "tin_number": "TIN-100200300",
  "epf_member_number": "EPF-4402",
  "department": "Finance",
  "job_title": "Senior Accountant",
  "pay_grade": "sample_pay_grade",
  "hire_date": "2026-11-23",
  "termination_date": "2026-11-23",
  "status": "ACTIVE",
  "basic_salary": "100000.00",
  "fixed_allowances": "15000.00",
  "hourly_overtime_rate": "1000.00",
  "bank_name": "sample_bank_name",
  "bank_branch_code": "sample_bank_branch_code",
  "bank_account_number": "sample_bank_account_number",
  "annual_leave_balance": "1000.00",
  "casual_leave_balance": "1000.00",
  "medical_leave_balance": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "user": 2
}
```

---

### `DELETE /api/hr/employees/{id}/`

- **Endpoint**: `DELETE /api/hr/employees/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/hr/employees/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/hr/holidays/`

- **Endpoint**: `GET /api/hr/holidays/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/holidays/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "name": "Devrious Retail Group (Pvt) Ltd",
      "holiday_date": "string",
      "is_poya_day": "string",
      "is_mercantile_holiday": "string",
      "tenant": 1,
      "company": 1
    }
  ]
}
```

---

### `POST /api/hr/holidays/`

- **Endpoint**: `POST /api/hr/holidays/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/hr/holidays/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "holiday_date": "2026-11-23",
  "is_poya_day": true,
  "is_mercantile_holiday": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "holiday_date": "2026-11-23",
  "is_poya_day": true,
  "is_mercantile_holiday": true,
  "tenant": 1,
  "company": 1
}
```

---

### `GET /api/hr/holidays/{id}/`

- **Endpoint**: `GET /api/hr/holidays/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/holidays/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "holiday_date": "2026-11-23",
  "is_poya_day": true,
  "is_mercantile_holiday": true,
  "tenant": 1,
  "company": 1
}
```

---

### `PUT /api/hr/holidays/{id}/`

- **Endpoint**: `PUT /api/hr/holidays/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/hr/holidays/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "holiday_date": "2026-11-23",
  "is_poya_day": true,
  "is_mercantile_holiday": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "holiday_date": "2026-11-23",
  "is_poya_day": true,
  "is_mercantile_holiday": true,
  "tenant": 1,
  "company": 1
}
```

---

### `PATCH /api/hr/holidays/{id}/`

- **Endpoint**: `PATCH /api/hr/holidays/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/hr/holidays/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "holiday_date": "2026-11-23",
  "is_poya_day": true,
  "is_mercantile_holiday": true,
  "tenant": 1,
  "company": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "holiday_date": "2026-11-23",
  "is_poya_day": true,
  "is_mercantile_holiday": true,
  "tenant": 1,
  "company": 1
}
```

---

### `DELETE /api/hr/holidays/{id}/`

- **Endpoint**: `DELETE /api/hr/holidays/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/hr/holidays/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/hr/job-applicants/`

- **Endpoint**: `GET /api/hr/job-applicants/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/job-applicants/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "first_name": "Kasun",
      "last_name": "Perera",
      "email": "kasun@devriousretail.lk",
      "phone": "+94771234567",
      "nic_number": "199214503321",
      "interview_feedback": "string",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "job_opening": "string",
      "created_employee": "string"
    }
  ]
}
```

---

### `POST /api/hr/job-applicants/`

- **Endpoint**: `POST /api/hr/job-applicants/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/hr/job-applicants/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "interview_feedback": "sample_interview_feedback",
  "status": "APPLIED",
  "tenant": 1,
  "job_opening": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "interview_feedback": "sample_interview_feedback",
  "status": "APPLIED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "job_opening": 1,
  "created_employee": 1
}
```

---

### `GET /api/hr/job-applicants/{id}/`

- **Endpoint**: `GET /api/hr/job-applicants/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/job-applicants/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "interview_feedback": "sample_interview_feedback",
  "status": "APPLIED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "job_opening": 1,
  "created_employee": 1
}
```

---

### `PUT /api/hr/job-applicants/{id}/`

- **Endpoint**: `PUT /api/hr/job-applicants/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/hr/job-applicants/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "interview_feedback": "sample_interview_feedback",
  "status": "APPLIED",
  "tenant": 1,
  "job_opening": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "interview_feedback": "sample_interview_feedback",
  "status": "APPLIED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "job_opening": 1,
  "created_employee": 1
}
```

---

### `PATCH /api/hr/job-applicants/{id}/`

- **Endpoint**: `PATCH /api/hr/job-applicants/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/hr/job-applicants/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "interview_feedback": "sample_interview_feedback",
  "status": "APPLIED",
  "tenant": 1,
  "job_opening": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "interview_feedback": "sample_interview_feedback",
  "status": "APPLIED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "job_opening": 1,
  "created_employee": 1
}
```

---

### `DELETE /api/hr/job-applicants/{id}/`

- **Endpoint**: `DELETE /api/hr/job-applicants/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/hr/job-applicants/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/hr/job-applicants/{id}/hire/`

- **Endpoint**: `POST /api/hr/job-applicants/{id}/hire/`
- **Summary**: Hire an Applicant & Auto-Create Employee Record (ERP-HR-010)

#### Example Request

```http
POST /api/hr/job-applicants/{id}/hire/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "interview_feedback": "sample_interview_feedback",
  "status": "APPLIED",
  "tenant": 1,
  "job_opening": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "first_name": "Kasun",
  "last_name": "Perera",
  "email": "kasun@devriousretail.lk",
  "phone": "+94771234567",
  "nic_number": "199214503321",
  "interview_feedback": "sample_interview_feedback",
  "status": "APPLIED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "job_opening": 1,
  "created_employee": 1
}
```

---

### `GET /api/hr/job-openings/`

- **Endpoint**: `GET /api/hr/job-openings/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/job-openings/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "title": "string",
      "department": "Finance",
      "description": "string",
      "offered_basic_salary": "string",
      "is_open": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1
    }
  ]
}
```

---

### `POST /api/hr/job-openings/`

- **Endpoint**: `POST /api/hr/job-openings/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/hr/job-openings/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "title": "sample_title",
  "department": "Finance",
  "description": "sample_description",
  "offered_basic_salary": "1000.00",
  "is_open": true,
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "title": "sample_title",
  "department": "Finance",
  "description": "sample_description",
  "offered_basic_salary": "1000.00",
  "is_open": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

---

### `GET /api/hr/job-openings/{id}/`

- **Endpoint**: `GET /api/hr/job-openings/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/job-openings/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "title": "sample_title",
  "department": "Finance",
  "description": "sample_description",
  "offered_basic_salary": "1000.00",
  "is_open": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

---

### `PUT /api/hr/job-openings/{id}/`

- **Endpoint**: `PUT /api/hr/job-openings/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/hr/job-openings/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "title": "sample_title",
  "department": "Finance",
  "description": "sample_description",
  "offered_basic_salary": "1000.00",
  "is_open": true,
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "title": "sample_title",
  "department": "Finance",
  "description": "sample_description",
  "offered_basic_salary": "1000.00",
  "is_open": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

---

### `PATCH /api/hr/job-openings/{id}/`

- **Endpoint**: `PATCH /api/hr/job-openings/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/hr/job-openings/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "title": "sample_title",
  "department": "Finance",
  "description": "sample_description",
  "offered_basic_salary": "1000.00",
  "is_open": true,
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "title": "sample_title",
  "department": "Finance",
  "description": "sample_description",
  "offered_basic_salary": "1000.00",
  "is_open": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

---

### `DELETE /api/hr/job-openings/{id}/`

- **Endpoint**: `DELETE /api/hr/job-openings/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/hr/job-openings/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/hr/leaves/`

- **Endpoint**: `GET /api/hr/leaves/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/leaves/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "employee_code": "EMP-001",
      "leave_type": "string",
      "start_date": "string",
      "end_date": "string",
      "days_count": "string",
      "is_unpaid": "string",
      "reason": "Policy compliance / administrative action",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "employee": "string",
      "approved_by": "string"
    }
  ]
}
```

---

### `POST /api/hr/leaves/`

- **Endpoint**: `POST /api/hr/leaves/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/hr/leaves/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "leave_type": "ANNUAL",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "days_count": "1000.00",
  "is_unpaid": true,
  "reason": "Policy compliance / administrative action",
  "status": "PENDING",
  "tenant": 1,
  "employee": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "employee_code": "EMP-001",
  "leave_type": "ANNUAL",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "days_count": "1000.00",
  "is_unpaid": true,
  "reason": "Policy compliance / administrative action",
  "status": "PENDING",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "employee": 1,
  "approved_by": 1
}
```

---

### `GET /api/hr/leaves/{id}/`

- **Endpoint**: `GET /api/hr/leaves/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/leaves/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "employee_code": "EMP-001",
  "leave_type": "ANNUAL",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "days_count": "1000.00",
  "is_unpaid": true,
  "reason": "Policy compliance / administrative action",
  "status": "PENDING",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "employee": 1,
  "approved_by": 1
}
```

---

### `PUT /api/hr/leaves/{id}/`

- **Endpoint**: `PUT /api/hr/leaves/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/hr/leaves/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "leave_type": "ANNUAL",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "days_count": "1000.00",
  "is_unpaid": true,
  "reason": "Policy compliance / administrative action",
  "status": "PENDING",
  "tenant": 1,
  "employee": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "employee_code": "EMP-001",
  "leave_type": "ANNUAL",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "days_count": "1000.00",
  "is_unpaid": true,
  "reason": "Policy compliance / administrative action",
  "status": "PENDING",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "employee": 1,
  "approved_by": 1
}
```

---

### `PATCH /api/hr/leaves/{id}/`

- **Endpoint**: `PATCH /api/hr/leaves/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/hr/leaves/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "leave_type": "ANNUAL",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "days_count": "1000.00",
  "is_unpaid": true,
  "reason": "Policy compliance / administrative action",
  "status": "PENDING",
  "tenant": 1,
  "employee": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "employee_code": "EMP-001",
  "leave_type": "ANNUAL",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "days_count": "1000.00",
  "is_unpaid": true,
  "reason": "Policy compliance / administrative action",
  "status": "PENDING",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "employee": 1,
  "approved_by": 1
}
```

---

### `DELETE /api/hr/leaves/{id}/`

- **Endpoint**: `DELETE /api/hr/leaves/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/hr/leaves/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/hr/leaves/{id}/approve/`

- **Endpoint**: `POST /api/hr/leaves/{id}/approve/`
- **Summary**: Approve an Employee Leave Request and deduct leave balance

#### Example Request

```http
POST /api/hr/leaves/{id}/approve/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "leave_type": "ANNUAL",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "days_count": "1000.00",
  "is_unpaid": true,
  "reason": "Policy compliance / administrative action",
  "status": "PENDING",
  "tenant": 1,
  "employee": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "employee_code": "EMP-001",
  "leave_type": "ANNUAL",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "days_count": "1000.00",
  "is_unpaid": true,
  "reason": "Policy compliance / administrative action",
  "status": "PENDING",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "employee": 1,
  "approved_by": 1
}
```

---

### `POST /api/hr/leaves/{id}/reject/`

- **Endpoint**: `POST /api/hr/leaves/{id}/reject/`
- **Summary**: Reject an Employee Leave Request

#### Example Request

```http
POST /api/hr/leaves/{id}/reject/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "leave_type": "ANNUAL",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "days_count": "1000.00",
  "is_unpaid": true,
  "reason": "Policy compliance / administrative action",
  "status": "PENDING",
  "tenant": 1,
  "employee": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "employee_code": "EMP-001",
  "leave_type": "ANNUAL",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "days_count": "1000.00",
  "is_unpaid": true,
  "reason": "Policy compliance / administrative action",
  "status": "PENDING",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "employee": 1,
  "approved_by": 1
}
```

---

### `GET /api/hr/payroll-runs/`

- **Endpoint**: `GET /api/hr/payroll-runs/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/payroll-runs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "payslips": "string",
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "run_code": "PR-2026-11",
      "period_year": "string",
      "period_month": "string",
      "pay_date": "string",
      "status": "string",
      "total_gross_pay": "string",
      "total_epf_employee_8": "string",
      "total_epf_employer_12": "string",
      "total_etf_employer_3": "string",
      "total_apit_tax": "string",
      "total_net_pay": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "journal_entry": "string",
      "processed_by": "string"
    }
  ]
}
```

---

### `POST /api/hr/payroll-runs/`

- **Endpoint**: `POST /api/hr/payroll-runs/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/hr/payroll-runs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "run_code": "PR-2026-11",
  "period_year": 1,
  "period_month": 1,
  "pay_date": "2026-11-23",
  "status": "DRAFT",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "payslips": [
    {
      "id": 1,
      "employee_code": "EMP-001",
      "employee_name": "string",
      "epf_member_number": "EPF-4402",
      "basic_salary": "100000.00",
      "allowances": "string",
      "overtime_pay": "string",
      "unpaid_leave_deduction": "string",
      "loan_advance_recovery": "string",
      "gross_pay": "115000.00",
      "epf_employee_8_percent": "8000.00",
      "epf_employer_12_percent": "12000.00",
      "etf_employer_3_percent": "3000.00",
      "apit_tax_withheld": "0.00",
      "gratuity_accrual": "string",
      "net_pay": "107000.00",
      "created_at": "string",
      "payroll_run": "string",
      "employee": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "run_code": "PR-2026-11",
  "period_year": 1,
  "period_month": 1,
  "pay_date": "2026-11-23",
  "status": "DRAFT",
  "total_gross_pay": "1000.00",
  "total_epf_employee_8": "1000.00",
  "total_epf_employer_12": "1000.00",
  "total_etf_employer_3": "1000.00",
  "total_apit_tax": "1000.00",
  "total_net_pay": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "journal_entry": 1,
  "processed_by": 1
}
```

---

### `GET /api/hr/payroll-runs/{id}/`

- **Endpoint**: `GET /api/hr/payroll-runs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/payroll-runs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "payslips": [
    {
      "id": 1,
      "employee_code": "EMP-001",
      "employee_name": "string",
      "epf_member_number": "EPF-4402",
      "basic_salary": "100000.00",
      "allowances": "string",
      "overtime_pay": "string",
      "unpaid_leave_deduction": "string",
      "loan_advance_recovery": "string",
      "gross_pay": "115000.00",
      "epf_employee_8_percent": "8000.00",
      "epf_employer_12_percent": "12000.00",
      "etf_employer_3_percent": "3000.00",
      "apit_tax_withheld": "0.00",
      "gratuity_accrual": "string",
      "net_pay": "107000.00",
      "created_at": "string",
      "payroll_run": "string",
      "employee": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "run_code": "PR-2026-11",
  "period_year": 1,
  "period_month": 1,
  "pay_date": "2026-11-23",
  "status": "DRAFT",
  "total_gross_pay": "1000.00",
  "total_epf_employee_8": "1000.00",
  "total_epf_employer_12": "1000.00",
  "total_etf_employer_3": "1000.00",
  "total_apit_tax": "1000.00",
  "total_net_pay": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "journal_entry": 1,
  "processed_by": 1
}
```

---

### `PUT /api/hr/payroll-runs/{id}/`

- **Endpoint**: `PUT /api/hr/payroll-runs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/hr/payroll-runs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "run_code": "PR-2026-11",
  "period_year": 1,
  "period_month": 1,
  "pay_date": "2026-11-23",
  "status": "DRAFT",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "payslips": [
    {
      "id": 1,
      "employee_code": "EMP-001",
      "employee_name": "string",
      "epf_member_number": "EPF-4402",
      "basic_salary": "100000.00",
      "allowances": "string",
      "overtime_pay": "string",
      "unpaid_leave_deduction": "string",
      "loan_advance_recovery": "string",
      "gross_pay": "115000.00",
      "epf_employee_8_percent": "8000.00",
      "epf_employer_12_percent": "12000.00",
      "etf_employer_3_percent": "3000.00",
      "apit_tax_withheld": "0.00",
      "gratuity_accrual": "string",
      "net_pay": "107000.00",
      "created_at": "string",
      "payroll_run": "string",
      "employee": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "run_code": "PR-2026-11",
  "period_year": 1,
  "period_month": 1,
  "pay_date": "2026-11-23",
  "status": "DRAFT",
  "total_gross_pay": "1000.00",
  "total_epf_employee_8": "1000.00",
  "total_epf_employer_12": "1000.00",
  "total_etf_employer_3": "1000.00",
  "total_apit_tax": "1000.00",
  "total_net_pay": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "journal_entry": 1,
  "processed_by": 1
}
```

---

### `PATCH /api/hr/payroll-runs/{id}/`

- **Endpoint**: `PATCH /api/hr/payroll-runs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/hr/payroll-runs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "run_code": "PR-2026-11",
  "period_year": 1,
  "period_month": 1,
  "pay_date": "2026-11-23",
  "status": "DRAFT",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "payslips": [
    {
      "id": 1,
      "employee_code": "EMP-001",
      "employee_name": "string",
      "epf_member_number": "EPF-4402",
      "basic_salary": "100000.00",
      "allowances": "string",
      "overtime_pay": "string",
      "unpaid_leave_deduction": "string",
      "loan_advance_recovery": "string",
      "gross_pay": "115000.00",
      "epf_employee_8_percent": "8000.00",
      "epf_employer_12_percent": "12000.00",
      "etf_employer_3_percent": "3000.00",
      "apit_tax_withheld": "0.00",
      "gratuity_accrual": "string",
      "net_pay": "107000.00",
      "created_at": "string",
      "payroll_run": "string",
      "employee": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "run_code": "PR-2026-11",
  "period_year": 1,
  "period_month": 1,
  "pay_date": "2026-11-23",
  "status": "DRAFT",
  "total_gross_pay": "1000.00",
  "total_epf_employee_8": "1000.00",
  "total_epf_employer_12": "1000.00",
  "total_etf_employer_3": "1000.00",
  "total_apit_tax": "1000.00",
  "total_net_pay": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "journal_entry": 1,
  "processed_by": 1
}
```

---

### `DELETE /api/hr/payroll-runs/{id}/`

- **Endpoint**: `DELETE /api/hr/payroll-runs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/hr/payroll-runs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/hr/payroll-runs/{id}/process/`

- **Endpoint**: `POST /api/hr/payroll-runs/{id}/process/`
- **Summary**: Execute Payroll Run (Computes EPF 12%/8%, ETF 3%, APIT, Gratuity & Posts Payroll Journal to GL)

#### Example Request

```http
POST /api/hr/payroll-runs/{id}/process/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "run_code": "PR-2026-11",
  "period_year": 1,
  "period_month": 1,
  "pay_date": "2026-11-23",
  "status": "DRAFT",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "payslips": [
    {
      "id": 1,
      "employee_code": "EMP-001",
      "employee_name": "string",
      "epf_member_number": "EPF-4402",
      "basic_salary": "100000.00",
      "allowances": "string",
      "overtime_pay": "string",
      "unpaid_leave_deduction": "string",
      "loan_advance_recovery": "string",
      "gross_pay": "115000.00",
      "epf_employee_8_percent": "8000.00",
      "epf_employer_12_percent": "12000.00",
      "etf_employer_3_percent": "3000.00",
      "apit_tax_withheld": "0.00",
      "gratuity_accrual": "string",
      "net_pay": "107000.00",
      "created_at": "string",
      "payroll_run": "string",
      "employee": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "run_code": "PR-2026-11",
  "period_year": 1,
  "period_month": 1,
  "pay_date": "2026-11-23",
  "status": "DRAFT",
  "total_gross_pay": "1000.00",
  "total_epf_employee_8": "1000.00",
  "total_epf_employer_12": "1000.00",
  "total_etf_employer_3": "1000.00",
  "total_apit_tax": "1000.00",
  "total_net_pay": "1000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "journal_entry": 1,
  "processed_by": 1
}
```

---

### `GET /api/hr/payroll-runs/{id}/statutory-report/`

- **Endpoint**: `GET /api/hr/payroll-runs/{id}/statutory-report/`
- **Summary**: Generate Sri Lanka Statutory Form IRD 7 / EPF C-Form & ETF Schedule + Bank Salary Upload File (`ERP-HR-007`, `014`)

#### Example Request

```http
GET /api/hr/payroll-runs/{id}/statutory-report/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "path_params": {
    "id": 1
  }
}
```

#### Example Response (`200 OK`)

```json
{
  "run_code": "PR-2026-11",
  "company": "Devrious Retail Group (Pvt) Ltd",
  "employer_tin": "TIN-100200300",
  "period": "2026-11",
  "totals": {
    "total_gross_pay": "100000.00",
    "total_epf_employee_8_percent": "8000.00",
    "total_epf_employer_12_percent": "12000.00",
    "total_epf_remittance_20_percent": "20000.00",
    "total_etf_remittance_3_percent": "3000.00",
    "total_apit_remittance_to_ird": "0.00",
    "total_net_pay_disbursement": "92000.00"
  },
  "epf_etf_ird_form_7_schedule": [
    {
      "employee_code": "EMP-001",
      "name": "Chaminda Vaas",
      "nic_number": "199012304567",
      "tin_number": "TIN-EMP-001",
      "epf_member_number": "EPF-001",
      "basic_salary": "100000.00",
      "gross_pay": "100000.00",
      "epf_employee_8_percent": "8000.00",
      "epf_employer_12_percent": "12000.00",
      "epf_total_20_percent": "20000.00",
      "etf_employer_3_percent": "3000.00",
      "apit_tax_withheld": "0.00",
      "gratuity_accrual": "0.00",
      "net_pay": "92000.00"
    }
  ],
  "bank_salary_upload_instructions": [
    {
      "employee_code": "EMP-001",
      "beneficiary_name": "Chaminda Vaas",
      "bank_name": "Bank of Ceylon",
      "branch_code": "001",
      "account_number": "0088991122",
      "amount": "92000.00",
      "currency": "LKR"
    }
  ]
}
```

---

### `GET /api/hr/payslips/`

- **Endpoint**: `GET /api/hr/payslips/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/payslips/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "employee_code": "EMP-001",
      "employee_name": "string",
      "epf_member_number": "EPF-4402",
      "basic_salary": "100000.00",
      "allowances": "string",
      "overtime_pay": "string",
      "unpaid_leave_deduction": "string",
      "loan_advance_recovery": "string",
      "gross_pay": "115000.00",
      "epf_employee_8_percent": "8000.00",
      "epf_employer_12_percent": "12000.00",
      "etf_employer_3_percent": "3000.00",
      "apit_tax_withheld": "0.00",
      "gratuity_accrual": "string",
      "net_pay": "107000.00",
      "created_at": "string",
      "payroll_run": "string",
      "employee": "string"
    }
  ]
}
```

---

### `GET /api/hr/payslips/{id}/`

- **Endpoint**: `GET /api/hr/payslips/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/payslips/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "employee_code": "EMP-001",
  "employee_name": "sample_employee_name",
  "epf_member_number": "EPF-4402",
  "basic_salary": "100000.00",
  "allowances": "1000.00",
  "overtime_pay": "1000.00",
  "unpaid_leave_deduction": "1000.00",
  "loan_advance_recovery": "1000.00",
  "gross_pay": "115000.00",
  "epf_employee_8_percent": "8000.00",
  "epf_employer_12_percent": "12000.00",
  "etf_employer_3_percent": "3000.00",
  "apit_tax_withheld": "0.00",
  "gratuity_accrual": "1000.00",
  "net_pay": "107000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "payroll_run": 1,
  "employee": 1
}
```

---

### `GET /api/hr/salary-revisions/`

- **Endpoint**: `GET /api/hr/salary-revisions/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/salary-revisions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "previous_basic_salary": "string",
      "new_basic_salary": "string",
      "new_job_title": "string",
      "effective_date": "string",
      "reason": "Policy compliance / administrative action",
      "created_at": "string",
      "tenant": 1,
      "employee": "string",
      "approved_by": "string"
    }
  ]
}
```

---

### `POST /api/hr/salary-revisions/`

- **Endpoint**: `POST /api/hr/salary-revisions/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/hr/salary-revisions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "previous_basic_salary": "1000.00",
  "new_basic_salary": "1000.00",
  "new_job_title": "sample_new_job_title",
  "effective_date": "2026-11-23",
  "reason": "Policy compliance / administrative action",
  "tenant": 1,
  "employee": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "previous_basic_salary": "1000.00",
  "new_basic_salary": "1000.00",
  "new_job_title": "sample_new_job_title",
  "effective_date": "2026-11-23",
  "reason": "Policy compliance / administrative action",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "employee": 1,
  "approved_by": 1
}
```

---

### `GET /api/hr/salary-revisions/{id}/`

- **Endpoint**: `GET /api/hr/salary-revisions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/hr/salary-revisions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "previous_basic_salary": "1000.00",
  "new_basic_salary": "1000.00",
  "new_job_title": "sample_new_job_title",
  "effective_date": "2026-11-23",
  "reason": "Policy compliance / administrative action",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "employee": 1,
  "approved_by": 1
}
```

---

### `PUT /api/hr/salary-revisions/{id}/`

- **Endpoint**: `PUT /api/hr/salary-revisions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/hr/salary-revisions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "previous_basic_salary": "1000.00",
  "new_basic_salary": "1000.00",
  "new_job_title": "sample_new_job_title",
  "effective_date": "2026-11-23",
  "reason": "Policy compliance / administrative action",
  "tenant": 1,
  "employee": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "previous_basic_salary": "1000.00",
  "new_basic_salary": "1000.00",
  "new_job_title": "sample_new_job_title",
  "effective_date": "2026-11-23",
  "reason": "Policy compliance / administrative action",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "employee": 1,
  "approved_by": 1
}
```

---

### `PATCH /api/hr/salary-revisions/{id}/`

- **Endpoint**: `PATCH /api/hr/salary-revisions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/hr/salary-revisions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "previous_basic_salary": "1000.00",
  "new_basic_salary": "1000.00",
  "new_job_title": "sample_new_job_title",
  "effective_date": "2026-11-23",
  "reason": "Policy compliance / administrative action",
  "tenant": 1,
  "employee": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "previous_basic_salary": "1000.00",
  "new_basic_salary": "1000.00",
  "new_job_title": "sample_new_job_title",
  "effective_date": "2026-11-23",
  "reason": "Policy compliance / administrative action",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "employee": 1,
  "approved_by": 1
}
```

---

### `DELETE /api/hr/salary-revisions/{id}/`

- **Endpoint**: `DELETE /api/hr/salary-revisions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/hr/salary-revisions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/hr/self-service/`

- **Endpoint**: `GET /api/hr/self-service/`
- **Summary**: Employee Self-Service Portal Summary (Payslips, Leave Balances, Profile)

#### Example Request

```http
GET /api/hr/self-service/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "key": "value"
}
```

---

## 8. Customer Support / Service Desk & SLA Escalation (ERP-SD)

### `GET /api/service-desk/contracts/`

- **Endpoint**: `GET /api/service-desk/contracts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/service-desk/contracts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "is_currently_valid": "string",
      "contract_number": "CNT-2026-0001",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "start_date": "string",
      "end_date": "string",
      "response_sla_minutes": "string",
      "resolution_sla_minutes": 120,
      "is_no_charge_covered": "string",
      "is_active": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "customer": "string"
    }
  ]
}
```

---

### `POST /api/service-desk/contracts/`

- **Endpoint**: `POST /api/service-desk/contracts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/service-desk/contracts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "contract_number": "CNT-2026-0001",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "response_sla_minutes": 1,
  "resolution_sla_minutes": 120,
  "is_no_charge_covered": true,
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "customer": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "is_currently_valid": true,
  "contract_number": "CNT-2026-0001",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "response_sla_minutes": 1,
  "resolution_sla_minutes": 120,
  "is_no_charge_covered": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "customer": 1
}
```

---

### `GET /api/service-desk/contracts/{id}/`

- **Endpoint**: `GET /api/service-desk/contracts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/service-desk/contracts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "is_currently_valid": true,
  "contract_number": "CNT-2026-0001",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "response_sla_minutes": 1,
  "resolution_sla_minutes": 120,
  "is_no_charge_covered": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "customer": 1
}
```

---

### `PUT /api/service-desk/contracts/{id}/`

- **Endpoint**: `PUT /api/service-desk/contracts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/service-desk/contracts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "contract_number": "CNT-2026-0001",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "response_sla_minutes": 1,
  "resolution_sla_minutes": 120,
  "is_no_charge_covered": true,
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "customer": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "is_currently_valid": true,
  "contract_number": "CNT-2026-0001",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "response_sla_minutes": 1,
  "resolution_sla_minutes": 120,
  "is_no_charge_covered": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "customer": 1
}
```

---

### `PATCH /api/service-desk/contracts/{id}/`

- **Endpoint**: `PATCH /api/service-desk/contracts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/service-desk/contracts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "contract_number": "CNT-2026-0001",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "response_sla_minutes": 1,
  "resolution_sla_minutes": 120,
  "is_no_charge_covered": true,
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "customer": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "is_currently_valid": true,
  "contract_number": "CNT-2026-0001",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "response_sla_minutes": 1,
  "resolution_sla_minutes": 120,
  "is_no_charge_covered": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "customer": 1
}
```

---

### `DELETE /api/service-desk/contracts/{id}/`

- **Endpoint**: `DELETE /api/service-desk/contracts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/service-desk/contracts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/service-desk/knowledge-base/`

- **Endpoint**: `GET /api/service-desk/knowledge-base/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/service-desk/knowledge-base/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "title": "string",
      "slug": "devrious-retail-group",
      "category": "string",
      "content": "string",
      "is_public_on_portal": "string",
      "view_count": "string",
      "created_at": "string",
      "updated_at": "string",
      "tenant": 1,
      "author": "string"
    }
  ]
}
```

---

### `POST /api/service-desk/knowledge-base/`

- **Endpoint**: `POST /api/service-desk/knowledge-base/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/service-desk/knowledge-base/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "title": "sample_title",
  "slug": "devrious-retail-group",
  "category": "sample_category",
  "content": "sample_content",
  "is_public_on_portal": true,
  "tenant": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "title": "sample_title",
  "slug": "devrious-retail-group",
  "category": "sample_category",
  "content": "sample_content",
  "is_public_on_portal": true,
  "view_count": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "author": 1
}
```

---

### `GET /api/service-desk/knowledge-base/{id}/`

- **Endpoint**: `GET /api/service-desk/knowledge-base/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/service-desk/knowledge-base/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "title": "sample_title",
  "slug": "devrious-retail-group",
  "category": "sample_category",
  "content": "sample_content",
  "is_public_on_portal": true,
  "view_count": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "author": 1
}
```

---

### `PUT /api/service-desk/knowledge-base/{id}/`

- **Endpoint**: `PUT /api/service-desk/knowledge-base/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/service-desk/knowledge-base/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "title": "sample_title",
  "slug": "devrious-retail-group",
  "category": "sample_category",
  "content": "sample_content",
  "is_public_on_portal": true,
  "tenant": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "title": "sample_title",
  "slug": "devrious-retail-group",
  "category": "sample_category",
  "content": "sample_content",
  "is_public_on_portal": true,
  "view_count": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "author": 1
}
```

---

### `PATCH /api/service-desk/knowledge-base/{id}/`

- **Endpoint**: `PATCH /api/service-desk/knowledge-base/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/service-desk/knowledge-base/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "title": "sample_title",
  "slug": "devrious-retail-group",
  "category": "sample_category",
  "content": "sample_content",
  "is_public_on_portal": true,
  "tenant": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "title": "sample_title",
  "slug": "devrious-retail-group",
  "category": "sample_category",
  "content": "sample_content",
  "is_public_on_portal": true,
  "view_count": 1,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "author": 1
}
```

---

### `DELETE /api/service-desk/knowledge-base/{id}/`

- **Endpoint**: `DELETE /api/service-desk/knowledge-base/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/service-desk/knowledge-base/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/service-desk/metrics/`

- **Endpoint**: `GET /api/service-desk/metrics/`
- **Summary**: Service Desk Metrics & SLA Performance Dashboard

#### Example Request

```http
GET /api/service-desk/metrics/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "key": "value"
}
```

---

### `GET /api/service-desk/tickets/`

- **Endpoint**: `GET /api/service-desk/tickets/`
- **Summary**: Ticketing system with SLA enforcement, escalation alerts (e.g., 75% elapsed / 1.5h on 2h SLA), refund Credit Note generation, and customer satisfaction feedback (ERP-SD-001..011).

#### Example Request

```http
GET /api/service-desk/tickets/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "ticket_number": "TKT-20261123-9F8E1",
      "customer": "string",
      "customer_name": "string",
      "contract": "string",
      "related_invoice": "string",
      "refund_credit_note": "string",
      "linked_kb_articles": "string",
      "subject": "string",
      "description": "string",
      "category": "string",
      "priority": "string",
      "status": "string",
      "source_channel": "string",
      "assigned_to": "string",
      "resolution_sla_minutes": 120,
      "response_due_at": "string",
      "resolution_due_at": "string",
      "first_responded_at": "string",
      "resolved_at": "string",
      "is_escalated": "string",
      "escalated_at": "string",
      "escalation_reason": "string",
      "satisfaction_rating": 5,
      "customer_feedback": "string",
      "created_at": "string",
      "updated_at": "string",
      "messages": "string",
      "customer_purchase_history": "string"
    }
  ]
}
```

---

### `POST /api/service-desk/tickets/`

- **Endpoint**: `POST /api/service-desk/tickets/`
- **Summary**: Ticketing system with SLA enforcement, escalation alerts (e.g., 75% elapsed / 1.5h on 2h SLA), refund Credit Note generation, and customer satisfaction feedback (ERP-SD-001..011).

#### Example Request

```http
POST /api/service-desk/tickets/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "contract": 1,
  "related_invoice": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback"
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "ticket_number": "TKT-20261123-9F8E1",
  "customer": 1,
  "customer_name": "sample_customer_name",
  "contract": 1,
  "related_invoice": 1,
  "refund_credit_note": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "first_responded_at": "2026-11-23T10:30:00+05:30",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalated_at": "2026-11-23T10:30:00+05:30",
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "messages": [
    {
      "id": 1,
      "ticket": "string",
      "author": "string",
      "author_username": "string",
      "message": "string",
      "is_internal_note": "string",
      "created_at": "string"
    }
  ],
  "customer_purchase_history": [
    {
      "key": "value"
    }
  ]
}
```

---

### `POST /api/service-desk/tickets/check-sla-escalations/`

- **Endpoint**: `POST /api/service-desk/tickets/check-sla-escalations/`
- **Summary**: Evaluate SLA & Trigger Escalation Alert (75% threshold or SLA breach - ERP-SD-003)

#### Example Request

```http
POST /api/service-desk/tickets/check-sla-escalations/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "contract": 1,
  "related_invoice": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "ticket_number": "TKT-20261123-9F8E1",
  "customer": 1,
  "customer_name": "sample_customer_name",
  "contract": 1,
  "related_invoice": 1,
  "refund_credit_note": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "first_responded_at": "2026-11-23T10:30:00+05:30",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalated_at": "2026-11-23T10:30:00+05:30",
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "messages": [
    {
      "id": 1,
      "ticket": "string",
      "author": "string",
      "author_username": "string",
      "message": "string",
      "is_internal_note": "string",
      "created_at": "string"
    }
  ],
  "customer_purchase_history": [
    {
      "key": "value"
    }
  ]
}
```

---

### `GET /api/service-desk/tickets/{id}/`

- **Endpoint**: `GET /api/service-desk/tickets/{id}/`
- **Summary**: Ticketing system with SLA enforcement, escalation alerts (e.g., 75% elapsed / 1.5h on 2h SLA), refund Credit Note generation, and customer satisfaction feedback (ERP-SD-001..011).

#### Example Request

```http
GET /api/service-desk/tickets/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "ticket_number": "TKT-20261123-9F8E1",
  "customer": 1,
  "customer_name": "sample_customer_name",
  "contract": 1,
  "related_invoice": 1,
  "refund_credit_note": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "first_responded_at": "2026-11-23T10:30:00+05:30",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalated_at": "2026-11-23T10:30:00+05:30",
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "messages": [
    {
      "id": 1,
      "ticket": "string",
      "author": "string",
      "author_username": "string",
      "message": "string",
      "is_internal_note": "string",
      "created_at": "string"
    }
  ],
  "customer_purchase_history": [
    {
      "key": "value"
    }
  ]
}
```

---

### `PUT /api/service-desk/tickets/{id}/`

- **Endpoint**: `PUT /api/service-desk/tickets/{id}/`
- **Summary**: Ticketing system with SLA enforcement, escalation alerts (e.g., 75% elapsed / 1.5h on 2h SLA), refund Credit Note generation, and customer satisfaction feedback (ERP-SD-001..011).

#### Example Request

```http
PUT /api/service-desk/tickets/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "contract": 1,
  "related_invoice": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "ticket_number": "TKT-20261123-9F8E1",
  "customer": 1,
  "customer_name": "sample_customer_name",
  "contract": 1,
  "related_invoice": 1,
  "refund_credit_note": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "first_responded_at": "2026-11-23T10:30:00+05:30",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalated_at": "2026-11-23T10:30:00+05:30",
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "messages": [
    {
      "id": 1,
      "ticket": "string",
      "author": "string",
      "author_username": "string",
      "message": "string",
      "is_internal_note": "string",
      "created_at": "string"
    }
  ],
  "customer_purchase_history": [
    {
      "key": "value"
    }
  ]
}
```

---

### `PATCH /api/service-desk/tickets/{id}/`

- **Endpoint**: `PATCH /api/service-desk/tickets/{id}/`
- **Summary**: Ticketing system with SLA enforcement, escalation alerts (e.g., 75% elapsed / 1.5h on 2h SLA), refund Credit Note generation, and customer satisfaction feedback (ERP-SD-001..011).

#### Example Request

```http
PATCH /api/service-desk/tickets/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "contract": 1,
  "related_invoice": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "ticket_number": "TKT-20261123-9F8E1",
  "customer": 1,
  "customer_name": "sample_customer_name",
  "contract": 1,
  "related_invoice": 1,
  "refund_credit_note": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "first_responded_at": "2026-11-23T10:30:00+05:30",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalated_at": "2026-11-23T10:30:00+05:30",
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "messages": [
    {
      "id": 1,
      "ticket": "string",
      "author": "string",
      "author_username": "string",
      "message": "string",
      "is_internal_note": "string",
      "created_at": "string"
    }
  ],
  "customer_purchase_history": [
    {
      "key": "value"
    }
  ]
}
```

---

### `DELETE /api/service-desk/tickets/{id}/`

- **Endpoint**: `DELETE /api/service-desk/tickets/{id}/`
- **Summary**: Ticketing system with SLA enforcement, escalation alerts (e.g., 75% elapsed / 1.5h on 2h SLA), refund Credit Note generation, and customer satisfaction feedback (ERP-SD-001..011).

#### Example Request

```http
DELETE /api/service-desk/tickets/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/service-desk/tickets/{id}/add-message/`

- **Endpoint**: `POST /api/service-desk/tickets/{id}/add-message/`
- **Summary**: Add a reply or internal note to a Support Ticket

#### Example Request

```http
POST /api/service-desk/tickets/{id}/add-message/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "contract": 1,
  "related_invoice": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "ticket_number": "TKT-20261123-9F8E1",
  "customer": 1,
  "customer_name": "sample_customer_name",
  "contract": 1,
  "related_invoice": 1,
  "refund_credit_note": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "first_responded_at": "2026-11-23T10:30:00+05:30",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalated_at": "2026-11-23T10:30:00+05:30",
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "messages": [
    {
      "id": 1,
      "ticket": "string",
      "author": "string",
      "author_username": "string",
      "message": "string",
      "is_internal_note": "string",
      "created_at": "string"
    }
  ],
  "customer_purchase_history": [
    {
      "key": "value"
    }
  ]
}
```

---

### `POST /api/service-desk/tickets/{id}/issue-refund-credit-note/`

- **Endpoint**: `POST /api/service-desk/tickets/{id}/issue-refund-credit-note/`
- **Summary**: Issue a Finance Refund Credit Note from a Support/Warranty Ticket (ERP-SD-011)

#### Example Request

```http
POST /api/service-desk/tickets/{id}/issue-refund-credit-note/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "contract": 1,
  "related_invoice": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "ticket_number": "TKT-20261123-9F8E1",
  "customer": 1,
  "customer_name": "sample_customer_name",
  "contract": 1,
  "related_invoice": 1,
  "refund_credit_note": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "first_responded_at": "2026-11-23T10:30:00+05:30",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalated_at": "2026-11-23T10:30:00+05:30",
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "messages": [
    {
      "id": 1,
      "ticket": "string",
      "author": "string",
      "author_username": "string",
      "message": "string",
      "is_internal_note": "string",
      "created_at": "string"
    }
  ],
  "customer_purchase_history": [
    {
      "key": "value"
    }
  ]
}
```

---

### `POST /api/service-desk/tickets/{id}/resolve/`

- **Endpoint**: `POST /api/service-desk/tickets/{id}/resolve/`
- **Summary**: Resolve a Support Ticket

#### Example Request

```http
POST /api/service-desk/tickets/{id}/resolve/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "contract": 1,
  "related_invoice": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "ticket_number": "TKT-20261123-9F8E1",
  "customer": 1,
  "customer_name": "sample_customer_name",
  "contract": 1,
  "related_invoice": 1,
  "refund_credit_note": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "first_responded_at": "2026-11-23T10:30:00+05:30",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalated_at": "2026-11-23T10:30:00+05:30",
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "messages": [
    {
      "id": 1,
      "ticket": "string",
      "author": "string",
      "author_username": "string",
      "message": "string",
      "is_internal_note": "string",
      "created_at": "string"
    }
  ],
  "customer_purchase_history": [
    {
      "key": "value"
    }
  ]
}
```

---

### `POST /api/service-desk/tickets/{id}/submit-feedback/`

- **Endpoint**: `POST /api/service-desk/tickets/{id}/submit-feedback/`
- **Summary**: Submit Customer Satisfaction Rating & Feedback (ERP-SD-010)

#### Example Request

```http
POST /api/service-desk/tickets/{id}/submit-feedback/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "contract": 1,
  "related_invoice": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback"
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "ticket_number": "TKT-20261123-9F8E1",
  "customer": 1,
  "customer_name": "sample_customer_name",
  "contract": 1,
  "related_invoice": 1,
  "refund_credit_note": 1,
  "linked_kb_articles": [
    1
  ],
  "subject": "sample_subject",
  "description": "sample_description",
  "category": "TECHNICAL",
  "priority": "LOW",
  "status": "OPEN",
  "source_channel": "sample_source_channel",
  "assigned_to": 1,
  "resolution_sla_minutes": 120,
  "response_due_at": "2026-11-23T10:30:00+05:30",
  "resolution_due_at": "2026-11-23T10:30:00+05:30",
  "first_responded_at": "2026-11-23T10:30:00+05:30",
  "resolved_at": "2026-11-23T10:30:00+05:30",
  "is_escalated": true,
  "escalated_at": "2026-11-23T10:30:00+05:30",
  "escalation_reason": "sample_escalation_reason",
  "satisfaction_rating": 5,
  "customer_feedback": "sample_customer_feedback",
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "messages": [
    {
      "id": 1,
      "ticket": "string",
      "author": "string",
      "author_username": "string",
      "message": "string",
      "is_internal_note": "string",
      "created_at": "string"
    }
  ],
  "customer_purchase_history": [
    {
      "key": "value"
    }
  ]
}
```

---

## 9. Point of Sale (ERP-POS: Cash Drawer Shifts & Real-Time/Offline Sales)

### `GET /api/inventory/pos/orders/`

- **Endpoint**: `GET /api/inventory/pos/orders/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/pos/orders/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "lines": "string",
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "receipt_number": "SUB-RCP-20261123-A1B2C3",
      "offline_receipt_uid": "string",
      "is_offline_synced": "string",
      "payment_method": "string",
      "subtotal": "100000.00",
      "discount_amount": "0.00",
      "loyalty_points_earned": "string",
      "loyalty_points_redeemed": "string",
      "tax_amount": "18000.00",
      "grand_total": "118000.00",
      "status": "string",
      "provisional_receipt_note": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "shift": "string",
      "customer": "string",
      "ar_invoice": "string",
      "cashier": "string"
    }
  ]
}
```

---

### `POST /api/inventory/pos/orders/`

- **Endpoint**: `POST /api/inventory/pos/orders/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/pos/orders/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "uom_code": "BOX",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00"
    }
  ],
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "offline_receipt_uid": "sample_offline_receipt_uid",
  "is_offline_synced": true,
  "payment_method": "CASH",
  "discount_amount": "0.00",
  "loyalty_points_redeemed": 1,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "shift": 1,
  "customer": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "product_name": "string",
      "uom_code": "BOX",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_amount": "18000.00",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "offline_receipt_uid": "sample_offline_receipt_uid",
  "is_offline_synced": true,
  "payment_method": "CASH",
  "subtotal": "100000.00",
  "discount_amount": "0.00",
  "loyalty_points_earned": 1,
  "loyalty_points_redeemed": 1,
  "tax_amount": "18000.00",
  "grand_total": "118000.00",
  "status": "COMPLETED",
  "provisional_receipt_note": "sample_provisional_receipt_note",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "shift": 1,
  "customer": 1,
  "ar_invoice": 1,
  "cashier": 1
}
```

---

### `GET /api/inventory/pos/orders/{id}/`

- **Endpoint**: `GET /api/inventory/pos/orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/pos/orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "product_name": "string",
      "uom_code": "BOX",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_amount": "18000.00",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "offline_receipt_uid": "sample_offline_receipt_uid",
  "is_offline_synced": true,
  "payment_method": "CASH",
  "subtotal": "100000.00",
  "discount_amount": "0.00",
  "loyalty_points_earned": 1,
  "loyalty_points_redeemed": 1,
  "tax_amount": "18000.00",
  "grand_total": "118000.00",
  "status": "COMPLETED",
  "provisional_receipt_note": "sample_provisional_receipt_note",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "shift": 1,
  "customer": 1,
  "ar_invoice": 1,
  "cashier": 1
}
```

---

### `PUT /api/inventory/pos/orders/{id}/`

- **Endpoint**: `PUT /api/inventory/pos/orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/pos/orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "uom_code": "BOX",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00"
    }
  ],
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "offline_receipt_uid": "sample_offline_receipt_uid",
  "is_offline_synced": true,
  "payment_method": "CASH",
  "discount_amount": "0.00",
  "loyalty_points_redeemed": 1,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "shift": 1,
  "customer": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "product_name": "string",
      "uom_code": "BOX",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_amount": "18000.00",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "offline_receipt_uid": "sample_offline_receipt_uid",
  "is_offline_synced": true,
  "payment_method": "CASH",
  "subtotal": "100000.00",
  "discount_amount": "0.00",
  "loyalty_points_earned": 1,
  "loyalty_points_redeemed": 1,
  "tax_amount": "18000.00",
  "grand_total": "118000.00",
  "status": "COMPLETED",
  "provisional_receipt_note": "sample_provisional_receipt_note",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "shift": 1,
  "customer": 1,
  "ar_invoice": 1,
  "cashier": 1
}
```

---

### `PATCH /api/inventory/pos/orders/{id}/`

- **Endpoint**: `PATCH /api/inventory/pos/orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/pos/orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "uom_code": "BOX",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00"
    }
  ],
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "offline_receipt_uid": "sample_offline_receipt_uid",
  "is_offline_synced": true,
  "payment_method": "CASH",
  "discount_amount": "0.00",
  "loyalty_points_redeemed": 1,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "shift": 1,
  "customer": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "product_name": "string",
      "uom_code": "BOX",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_amount": "18000.00",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "offline_receipt_uid": "sample_offline_receipt_uid",
  "is_offline_synced": true,
  "payment_method": "CASH",
  "subtotal": "100000.00",
  "discount_amount": "0.00",
  "loyalty_points_earned": 1,
  "loyalty_points_redeemed": 1,
  "tax_amount": "18000.00",
  "grand_total": "118000.00",
  "status": "COMPLETED",
  "provisional_receipt_note": "sample_provisional_receipt_note",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "shift": 1,
  "customer": 1,
  "ar_invoice": 1,
  "cashier": 1
}
```

---

### `DELETE /api/inventory/pos/orders/{id}/`

- **Endpoint**: `DELETE /api/inventory/pos/orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/pos/orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/pos/orders/{id}/return-or-void/`

- **Endpoint**: `POST /api/inventory/pos/orders/{id}/return-or-void/`
- **Summary**: Process POS Return / Refund or Void Receipt (ERP-POS-003, ERP-POS-006)

#### Example Request

```http
POST /api/inventory/pos/orders/{id}/return-or-void/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "uom_code": "BOX",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00"
    }
  ],
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "offline_receipt_uid": "sample_offline_receipt_uid",
  "is_offline_synced": true,
  "payment_method": "CASH",
  "discount_amount": "0.00",
  "loyalty_points_redeemed": 1,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "shift": 1,
  "customer": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "product_name": "string",
      "uom_code": "BOX",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "discount_amount": "0.00",
      "tax_amount": "18000.00",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "receipt_number": "SUB-RCP-20261123-A1B2C3",
  "offline_receipt_uid": "sample_offline_receipt_uid",
  "is_offline_synced": true,
  "payment_method": "CASH",
  "subtotal": "100000.00",
  "discount_amount": "0.00",
  "loyalty_points_earned": 1,
  "loyalty_points_redeemed": 1,
  "tax_amount": "18000.00",
  "grand_total": "118000.00",
  "status": "COMPLETED",
  "provisional_receipt_note": "sample_provisional_receipt_note",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "shift": 1,
  "customer": 1,
  "ar_invoice": 1,
  "cashier": 1
}
```

---

### `GET /api/inventory/pos/shifts/`

- **Endpoint**: `GET /api/inventory/pos/shifts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/pos/shifts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "opened_at": "string",
      "closed_at": "string",
      "opening_cash": "string",
      "cash_sales_total": "string",
      "actual_closing_cash": "string",
      "cash_variance": "string",
      "status": "string",
      "tenant": 1,
      "branch": 1,
      "cashier": "string"
    }
  ]
}
```

---

### `POST /api/inventory/pos/shifts/`

- **Endpoint**: `POST /api/inventory/pos/shifts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/pos/shifts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "opening_cash": "1000.00",
  "actual_closing_cash": "1000.00",
  "tenant": 1,
  "branch": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "opened_at": "2026-11-23T10:30:00+05:30",
  "closed_at": "2026-11-23T10:30:00+05:30",
  "opening_cash": "1000.00",
  "cash_sales_total": "1000.00",
  "actual_closing_cash": "1000.00",
  "cash_variance": "1000.00",
  "status": "OPEN",
  "tenant": 1,
  "branch": 1,
  "cashier": 1
}
```

---

### `GET /api/inventory/pos/shifts/{id}/`

- **Endpoint**: `GET /api/inventory/pos/shifts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/pos/shifts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "opened_at": "2026-11-23T10:30:00+05:30",
  "closed_at": "2026-11-23T10:30:00+05:30",
  "opening_cash": "1000.00",
  "cash_sales_total": "1000.00",
  "actual_closing_cash": "1000.00",
  "cash_variance": "1000.00",
  "status": "OPEN",
  "tenant": 1,
  "branch": 1,
  "cashier": 1
}
```

---

### `PUT /api/inventory/pos/shifts/{id}/`

- **Endpoint**: `PUT /api/inventory/pos/shifts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/pos/shifts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "opening_cash": "1000.00",
  "actual_closing_cash": "1000.00",
  "tenant": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "opened_at": "2026-11-23T10:30:00+05:30",
  "closed_at": "2026-11-23T10:30:00+05:30",
  "opening_cash": "1000.00",
  "cash_sales_total": "1000.00",
  "actual_closing_cash": "1000.00",
  "cash_variance": "1000.00",
  "status": "OPEN",
  "tenant": 1,
  "branch": 1,
  "cashier": 1
}
```

---

### `PATCH /api/inventory/pos/shifts/{id}/`

- **Endpoint**: `PATCH /api/inventory/pos/shifts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/pos/shifts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "opening_cash": "1000.00",
  "actual_closing_cash": "1000.00",
  "tenant": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "opened_at": "2026-11-23T10:30:00+05:30",
  "closed_at": "2026-11-23T10:30:00+05:30",
  "opening_cash": "1000.00",
  "cash_sales_total": "1000.00",
  "actual_closing_cash": "1000.00",
  "cash_variance": "1000.00",
  "status": "OPEN",
  "tenant": 1,
  "branch": 1,
  "cashier": 1
}
```

---

### `DELETE /api/inventory/pos/shifts/{id}/`

- **Endpoint**: `DELETE /api/inventory/pos/shifts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/pos/shifts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/pos/shifts/{id}/close_shift/`

- **Endpoint**: `POST /api/inventory/pos/shifts/{id}/close_shift/`
- **Summary**: Close POS Shift & Reconcile Cash Drawer (ERP-POS-007)

#### Example Request

```http
POST /api/inventory/pos/shifts/{id}/close_shift/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "opening_cash": "1000.00",
  "actual_closing_cash": "1000.00",
  "tenant": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "opened_at": "2026-11-23T10:30:00+05:30",
  "closed_at": "2026-11-23T10:30:00+05:30",
  "opening_cash": "1000.00",
  "cash_sales_total": "1000.00",
  "actual_closing_cash": "1000.00",
  "cash_variance": "1000.00",
  "status": "OPEN",
  "tenant": 1,
  "branch": 1,
  "cashier": 1
}
```

---

## 10. Fleet & Transportation Management (FLT-01 to FLT-42)

### `GET /api/inventory/fleet/accidents/`

- **Endpoint**: `GET /api/inventory/fleet/accidents/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/accidents/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "incident_number": "ACC-2026-0001",
      "incident_date": "string",
      "location": "string",
      "damage_description": "string",
      "injuries_reported": "string",
      "estimated_repair_cost": "string",
      "insurance_claim_number": "string",
      "insurance_claim_status": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "vehicle": "string",
      "driver": "string",
      "generated_work_order": "string"
    }
  ]
}
```

---

### `POST /api/inventory/fleet/accidents/`

- **Endpoint**: `POST /api/inventory/fleet/accidents/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/accidents/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "incident_number": "ACC-2026-0001",
  "incident_date": "2026-11-23",
  "location": "sample_location",
  "damage_description": "sample_damage_description",
  "injuries_reported": "sample_injuries_reported",
  "estimated_repair_cost": "1000.00",
  "insurance_claim_number": "sample_insurance_claim_number",
  "insurance_claim_status": "sample_insurance_claim_status",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "incident_number": "ACC-2026-0001",
  "incident_date": "2026-11-23",
  "location": "sample_location",
  "damage_description": "sample_damage_description",
  "injuries_reported": "sample_injuries_reported",
  "estimated_repair_cost": "1000.00",
  "insurance_claim_number": "sample_insurance_claim_number",
  "insurance_claim_status": "sample_insurance_claim_status",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "generated_work_order": 1
}
```

---

### `GET /api/inventory/fleet/accidents/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/accidents/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/accidents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "incident_number": "ACC-2026-0001",
  "incident_date": "2026-11-23",
  "location": "sample_location",
  "damage_description": "sample_damage_description",
  "injuries_reported": "sample_injuries_reported",
  "estimated_repair_cost": "1000.00",
  "insurance_claim_number": "sample_insurance_claim_number",
  "insurance_claim_status": "sample_insurance_claim_status",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "generated_work_order": 1
}
```

---

### `PUT /api/inventory/fleet/accidents/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/accidents/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/accidents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "incident_number": "ACC-2026-0001",
  "incident_date": "2026-11-23",
  "location": "sample_location",
  "damage_description": "sample_damage_description",
  "injuries_reported": "sample_injuries_reported",
  "estimated_repair_cost": "1000.00",
  "insurance_claim_number": "sample_insurance_claim_number",
  "insurance_claim_status": "sample_insurance_claim_status",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "incident_number": "ACC-2026-0001",
  "incident_date": "2026-11-23",
  "location": "sample_location",
  "damage_description": "sample_damage_description",
  "injuries_reported": "sample_injuries_reported",
  "estimated_repair_cost": "1000.00",
  "insurance_claim_number": "sample_insurance_claim_number",
  "insurance_claim_status": "sample_insurance_claim_status",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "generated_work_order": 1
}
```

---

### `PATCH /api/inventory/fleet/accidents/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/accidents/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/accidents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "incident_number": "ACC-2026-0001",
  "incident_date": "2026-11-23",
  "location": "sample_location",
  "damage_description": "sample_damage_description",
  "injuries_reported": "sample_injuries_reported",
  "estimated_repair_cost": "1000.00",
  "insurance_claim_number": "sample_insurance_claim_number",
  "insurance_claim_status": "sample_insurance_claim_status",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "incident_number": "ACC-2026-0001",
  "incident_date": "2026-11-23",
  "location": "sample_location",
  "damage_description": "sample_damage_description",
  "injuries_reported": "sample_injuries_reported",
  "estimated_repair_cost": "1000.00",
  "insurance_claim_number": "sample_insurance_claim_number",
  "insurance_claim_status": "sample_insurance_claim_status",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "generated_work_order": 1
}
```

---

### `DELETE /api/inventory/fleet/accidents/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/accidents/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/accidents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/fleet/carriers/`

- **Endpoint**: `GET /api/inventory/fleet/carriers/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/carriers/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "name": "Devrious Retail Group (Pvt) Ltd",
      "contact_person": "string",
      "phone": "+94771234567",
      "email": "kasun@devriousretail.lk",
      "rate_per_km_per_kg": "string",
      "base_handling_fee": "string",
      "on_time_performance_percent": "string",
      "is_active": "string",
      "created_at": "string",
      "tenant": 1
    }
  ]
}
```

---

### `POST /api/inventory/fleet/carriers/`

- **Endpoint**: `POST /api/inventory/fleet/carriers/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/carriers/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "rate_per_km_per_kg": "1000.00",
  "base_handling_fee": "1000.00",
  "on_time_performance_percent": "1000.00",
  "is_active": true,
  "tenant": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "rate_per_km_per_kg": "1000.00",
  "base_handling_fee": "1000.00",
  "on_time_performance_percent": "1000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `GET /api/inventory/fleet/carriers/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/carriers/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/carriers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "rate_per_km_per_kg": "1000.00",
  "base_handling_fee": "1000.00",
  "on_time_performance_percent": "1000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `PUT /api/inventory/fleet/carriers/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/carriers/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/carriers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "rate_per_km_per_kg": "1000.00",
  "base_handling_fee": "1000.00",
  "on_time_performance_percent": "1000.00",
  "is_active": true,
  "tenant": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "rate_per_km_per_kg": "1000.00",
  "base_handling_fee": "1000.00",
  "on_time_performance_percent": "1000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `PATCH /api/inventory/fleet/carriers/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/carriers/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/carriers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "rate_per_km_per_kg": "1000.00",
  "base_handling_fee": "1000.00",
  "on_time_performance_percent": "1000.00",
  "is_active": true,
  "tenant": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "contact_person": "sample_contact_person",
  "phone": "+94771234567",
  "email": "kasun@devriousretail.lk",
  "rate_per_km_per_kg": "1000.00",
  "base_handling_fee": "1000.00",
  "on_time_performance_percent": "1000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1
}
```

---

### `DELETE /api/inventory/fleet/carriers/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/carriers/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/carriers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/fleet/compliance-documents/`

- **Endpoint**: `GET /api/inventory/fleet/compliance-documents/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/compliance-documents/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "document_type": "string",
      "document_number": "string",
      "issue_date": "string",
      "expiry_date": "string",
      "alert_window_days": "string",
      "is_active": "string",
      "tenant": 1,
      "vehicle": "string"
    }
  ]
}
```

---

### `POST /api/inventory/fleet/compliance-documents/`

- **Endpoint**: `POST /api/inventory/fleet/compliance-documents/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/compliance-documents/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "document_type": "REGISTRATION",
  "document_number": "sample_document_number",
  "issue_date": "2026-11-23",
  "expiry_date": "2026-11-23",
  "alert_window_days": 1,
  "is_active": true,
  "tenant": 1,
  "vehicle": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "document_type": "REGISTRATION",
  "document_number": "sample_document_number",
  "issue_date": "2026-11-23",
  "expiry_date": "2026-11-23",
  "alert_window_days": 1,
  "is_active": true,
  "tenant": 1,
  "vehicle": 1
}
```

---

### `POST /api/inventory/fleet/compliance-documents/check-compliance/`

- **Endpoint**: `POST /api/inventory/fleet/compliance-documents/check-compliance/`
- **Summary**: Check Expiring/Expired Vehicle Compliance Documents (60-day alert & dispatch block - FLT-03)

#### Example Request

```http
POST /api/inventory/fleet/compliance-documents/check-compliance/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "document_type": "REGISTRATION",
  "document_number": "sample_document_number",
  "issue_date": "2026-11-23",
  "expiry_date": "2026-11-23",
  "alert_window_days": 1,
  "is_active": true,
  "tenant": 1,
  "vehicle": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "document_type": "REGISTRATION",
  "document_number": "sample_document_number",
  "issue_date": "2026-11-23",
  "expiry_date": "2026-11-23",
  "alert_window_days": 1,
  "is_active": true,
  "tenant": 1,
  "vehicle": 1
}
```

---

### `GET /api/inventory/fleet/compliance-documents/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/compliance-documents/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/compliance-documents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "document_type": "REGISTRATION",
  "document_number": "sample_document_number",
  "issue_date": "2026-11-23",
  "expiry_date": "2026-11-23",
  "alert_window_days": 1,
  "is_active": true,
  "tenant": 1,
  "vehicle": 1
}
```

---

### `PUT /api/inventory/fleet/compliance-documents/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/compliance-documents/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/compliance-documents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "document_type": "REGISTRATION",
  "document_number": "sample_document_number",
  "issue_date": "2026-11-23",
  "expiry_date": "2026-11-23",
  "alert_window_days": 1,
  "is_active": true,
  "tenant": 1,
  "vehicle": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "document_type": "REGISTRATION",
  "document_number": "sample_document_number",
  "issue_date": "2026-11-23",
  "expiry_date": "2026-11-23",
  "alert_window_days": 1,
  "is_active": true,
  "tenant": 1,
  "vehicle": 1
}
```

---

### `PATCH /api/inventory/fleet/compliance-documents/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/compliance-documents/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/compliance-documents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "document_type": "REGISTRATION",
  "document_number": "sample_document_number",
  "issue_date": "2026-11-23",
  "expiry_date": "2026-11-23",
  "alert_window_days": 1,
  "is_active": true,
  "tenant": 1,
  "vehicle": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "document_type": "REGISTRATION",
  "document_number": "sample_document_number",
  "issue_date": "2026-11-23",
  "expiry_date": "2026-11-23",
  "alert_window_days": 1,
  "is_active": true,
  "tenant": 1,
  "vehicle": 1
}
```

---

### `DELETE /api/inventory/fleet/compliance-documents/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/compliance-documents/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/compliance-documents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/fleet/drivers/`

- **Endpoint**: `GET /api/inventory/fleet/drivers/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/drivers/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "driver_code": "string",
      "full_name": "Sunil Mendis",
      "phone": "+94771234567",
      "license_number": "string",
      "license_categories": "string",
      "license_expiry_date": "string",
      "medical_cert_expiry_date": "string",
      "safety_training_expiry_date": "string",
      "driving_hours_today": "string",
      "max_daily_driving_hours": "string",
      "is_on_mandatory_rest": "string",
      "safety_score": "string",
      "coaching_required": "string",
      "is_active": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "employee": "string",
      "user": 2
    }
  ]
}
```

---

### `POST /api/inventory/fleet/drivers/`

- **Endpoint**: `POST /api/inventory/fleet/drivers/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/drivers/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "driver_code": "sample_driver_code",
  "full_name": "Sunil Mendis",
  "phone": "+94771234567",
  "license_number": "sample_license_number",
  "license_categories": {
    "key": "value"
  },
  "license_expiry_date": "2026-11-23",
  "medical_cert_expiry_date": "2026-11-23",
  "safety_training_expiry_date": "2026-11-23",
  "driving_hours_today": "1000.00",
  "max_daily_driving_hours": "1000.00",
  "is_on_mandatory_rest": true,
  "safety_score": "1000.00",
  "coaching_required": true,
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "employee": 1,
  "user": 2
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "driver_code": "sample_driver_code",
  "full_name": "Sunil Mendis",
  "phone": "+94771234567",
  "license_number": "sample_license_number",
  "license_categories": {
    "key": "value"
  },
  "license_expiry_date": "2026-11-23",
  "medical_cert_expiry_date": "2026-11-23",
  "safety_training_expiry_date": "2026-11-23",
  "driving_hours_today": "1000.00",
  "max_daily_driving_hours": "1000.00",
  "is_on_mandatory_rest": true,
  "safety_score": "1000.00",
  "coaching_required": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "employee": 1,
  "user": 2
}
```

---

### `GET /api/inventory/fleet/drivers/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/drivers/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/drivers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "driver_code": "sample_driver_code",
  "full_name": "Sunil Mendis",
  "phone": "+94771234567",
  "license_number": "sample_license_number",
  "license_categories": {
    "key": "value"
  },
  "license_expiry_date": "2026-11-23",
  "medical_cert_expiry_date": "2026-11-23",
  "safety_training_expiry_date": "2026-11-23",
  "driving_hours_today": "1000.00",
  "max_daily_driving_hours": "1000.00",
  "is_on_mandatory_rest": true,
  "safety_score": "1000.00",
  "coaching_required": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "employee": 1,
  "user": 2
}
```

---

### `PUT /api/inventory/fleet/drivers/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/drivers/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/drivers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "driver_code": "sample_driver_code",
  "full_name": "Sunil Mendis",
  "phone": "+94771234567",
  "license_number": "sample_license_number",
  "license_categories": {
    "key": "value"
  },
  "license_expiry_date": "2026-11-23",
  "medical_cert_expiry_date": "2026-11-23",
  "safety_training_expiry_date": "2026-11-23",
  "driving_hours_today": "1000.00",
  "max_daily_driving_hours": "1000.00",
  "is_on_mandatory_rest": true,
  "safety_score": "1000.00",
  "coaching_required": true,
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "employee": 1,
  "user": 2
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "driver_code": "sample_driver_code",
  "full_name": "Sunil Mendis",
  "phone": "+94771234567",
  "license_number": "sample_license_number",
  "license_categories": {
    "key": "value"
  },
  "license_expiry_date": "2026-11-23",
  "medical_cert_expiry_date": "2026-11-23",
  "safety_training_expiry_date": "2026-11-23",
  "driving_hours_today": "1000.00",
  "max_daily_driving_hours": "1000.00",
  "is_on_mandatory_rest": true,
  "safety_score": "1000.00",
  "coaching_required": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "employee": 1,
  "user": 2
}
```

---

### `PATCH /api/inventory/fleet/drivers/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/drivers/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/drivers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "driver_code": "sample_driver_code",
  "full_name": "Sunil Mendis",
  "phone": "+94771234567",
  "license_number": "sample_license_number",
  "license_categories": {
    "key": "value"
  },
  "license_expiry_date": "2026-11-23",
  "medical_cert_expiry_date": "2026-11-23",
  "safety_training_expiry_date": "2026-11-23",
  "driving_hours_today": "1000.00",
  "max_daily_driving_hours": "1000.00",
  "is_on_mandatory_rest": true,
  "safety_score": "1000.00",
  "coaching_required": true,
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "employee": 1,
  "user": 2
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "driver_code": "sample_driver_code",
  "full_name": "Sunil Mendis",
  "phone": "+94771234567",
  "license_number": "sample_license_number",
  "license_categories": {
    "key": "value"
  },
  "license_expiry_date": "2026-11-23",
  "medical_cert_expiry_date": "2026-11-23",
  "safety_training_expiry_date": "2026-11-23",
  "driving_hours_today": "1000.00",
  "max_daily_driving_hours": "1000.00",
  "is_on_mandatory_rest": true,
  "safety_score": "1000.00",
  "coaching_required": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "employee": 1,
  "user": 2
}
```

---

### `DELETE /api/inventory/fleet/drivers/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/drivers/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/drivers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/fleet/drivers/{id}/log-driving-hours/`

- **Endpoint**: `POST /api/inventory/fleet/drivers/{id}/log-driving-hours/`
- **Summary**: Log Driving Hours & Enforce 10-Hour Daily ELD / Hours-of-Service Limit (FLT-26)

#### Example Request

```http
POST /api/inventory/fleet/drivers/{id}/log-driving-hours/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "driver_code": "sample_driver_code",
  "full_name": "Sunil Mendis",
  "phone": "+94771234567",
  "license_number": "sample_license_number",
  "license_categories": {
    "key": "value"
  },
  "license_expiry_date": "2026-11-23",
  "medical_cert_expiry_date": "2026-11-23",
  "safety_training_expiry_date": "2026-11-23",
  "driving_hours_today": "1000.00",
  "max_daily_driving_hours": "1000.00",
  "is_on_mandatory_rest": true,
  "safety_score": "1000.00",
  "coaching_required": true,
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "employee": 1,
  "user": 2
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "driver_code": "sample_driver_code",
  "full_name": "Sunil Mendis",
  "phone": "+94771234567",
  "license_number": "sample_license_number",
  "license_categories": {
    "key": "value"
  },
  "license_expiry_date": "2026-11-23",
  "medical_cert_expiry_date": "2026-11-23",
  "safety_training_expiry_date": "2026-11-23",
  "driving_hours_today": "1000.00",
  "max_daily_driving_hours": "1000.00",
  "is_on_mandatory_rest": true,
  "safety_score": "1000.00",
  "coaching_required": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "employee": 1,
  "user": 2
}
```

---

### `GET /api/inventory/fleet/dtc-alerts/`

- **Endpoint**: `GET /api/inventory/fleet/dtc-alerts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/dtc-alerts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "dtc_code": "string",
      "severity": "string",
      "description": "string",
      "is_resolved": "string",
      "reported_at": "string",
      "tenant": 1,
      "vehicle": "string",
      "generated_work_order": "string"
    }
  ]
}
```

---

### `POST /api/inventory/fleet/dtc-alerts/`

- **Endpoint**: `POST /api/inventory/fleet/dtc-alerts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/dtc-alerts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "dtc_code": "sample_dtc_code",
  "severity": "sample_severity",
  "description": "sample_description",
  "is_resolved": true,
  "tenant": 1,
  "vehicle": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "dtc_code": "sample_dtc_code",
  "severity": "sample_severity",
  "description": "sample_description",
  "is_resolved": true,
  "reported_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "vehicle": 1,
  "generated_work_order": 1
}
```

---

### `GET /api/inventory/fleet/dtc-alerts/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/dtc-alerts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/dtc-alerts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "dtc_code": "sample_dtc_code",
  "severity": "sample_severity",
  "description": "sample_description",
  "is_resolved": true,
  "reported_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "vehicle": 1,
  "generated_work_order": 1
}
```

---

### `PUT /api/inventory/fleet/dtc-alerts/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/dtc-alerts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/dtc-alerts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "dtc_code": "sample_dtc_code",
  "severity": "sample_severity",
  "description": "sample_description",
  "is_resolved": true,
  "tenant": 1,
  "vehicle": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "dtc_code": "sample_dtc_code",
  "severity": "sample_severity",
  "description": "sample_description",
  "is_resolved": true,
  "reported_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "vehicle": 1,
  "generated_work_order": 1
}
```

---

### `PATCH /api/inventory/fleet/dtc-alerts/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/dtc-alerts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/dtc-alerts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "dtc_code": "sample_dtc_code",
  "severity": "sample_severity",
  "description": "sample_description",
  "is_resolved": true,
  "tenant": 1,
  "vehicle": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "dtc_code": "sample_dtc_code",
  "severity": "sample_severity",
  "description": "sample_description",
  "is_resolved": true,
  "reported_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "vehicle": 1,
  "generated_work_order": 1
}
```

---

### `DELETE /api/inventory/fleet/dtc-alerts/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/dtc-alerts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/dtc-alerts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/fleet/dvirs/`

- **Endpoint**: `GET /api/inventory/fleet/dvirs/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/dvirs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "inspection_type": "string",
      "odometer_km": "14500.0",
      "checklist_json": "string",
      "defects_found": "string",
      "defect_notes": "string",
      "is_offline_synced": "string",
      "created_at": "string",
      "tenant": 1,
      "vehicle": "string",
      "driver": "string",
      "generated_work_order": "string"
    }
  ]
}
```

---

### `POST /api/inventory/fleet/dvirs/`

- **Endpoint**: `POST /api/inventory/fleet/dvirs/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/dvirs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "inspection_type": "sample_inspection_type",
  "odometer_km": "14500.0",
  "checklist_json": {
    "key": "value"
  },
  "defects_found": true,
  "defect_notes": "sample_defect_notes",
  "is_offline_synced": true,
  "tenant": 1,
  "vehicle": 1,
  "driver": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "inspection_type": "sample_inspection_type",
  "odometer_km": "14500.0",
  "checklist_json": {
    "key": "value"
  },
  "defects_found": true,
  "defect_notes": "sample_defect_notes",
  "is_offline_synced": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "vehicle": 1,
  "driver": 1,
  "generated_work_order": 1
}
```

---

### `GET /api/inventory/fleet/dvirs/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/dvirs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/dvirs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "inspection_type": "sample_inspection_type",
  "odometer_km": "14500.0",
  "checklist_json": {
    "key": "value"
  },
  "defects_found": true,
  "defect_notes": "sample_defect_notes",
  "is_offline_synced": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "vehicle": 1,
  "driver": 1,
  "generated_work_order": 1
}
```

---

### `PUT /api/inventory/fleet/dvirs/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/dvirs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/dvirs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "inspection_type": "sample_inspection_type",
  "odometer_km": "14500.0",
  "checklist_json": {
    "key": "value"
  },
  "defects_found": true,
  "defect_notes": "sample_defect_notes",
  "is_offline_synced": true,
  "tenant": 1,
  "vehicle": 1,
  "driver": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "inspection_type": "sample_inspection_type",
  "odometer_km": "14500.0",
  "checklist_json": {
    "key": "value"
  },
  "defects_found": true,
  "defect_notes": "sample_defect_notes",
  "is_offline_synced": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "vehicle": 1,
  "driver": 1,
  "generated_work_order": 1
}
```

---

### `PATCH /api/inventory/fleet/dvirs/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/dvirs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/dvirs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "inspection_type": "sample_inspection_type",
  "odometer_km": "14500.0",
  "checklist_json": {
    "key": "value"
  },
  "defects_found": true,
  "defect_notes": "sample_defect_notes",
  "is_offline_synced": true,
  "tenant": 1,
  "vehicle": 1,
  "driver": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "inspection_type": "sample_inspection_type",
  "odometer_km": "14500.0",
  "checklist_json": {
    "key": "value"
  },
  "defects_found": true,
  "defect_notes": "sample_defect_notes",
  "is_offline_synced": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "vehicle": 1,
  "driver": 1,
  "generated_work_order": 1
}
```

---

### `DELETE /api/inventory/fleet/dvirs/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/dvirs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/dvirs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/fleet/freight-shipments/`

- **Endpoint**: `GET /api/inventory/fleet/freight-shipments/`
- **Summary**: Outsourced 3PL Freight Shipment with automatic freight rating: freight = rate * distance * weight (FLT-30, FLT-31).

#### Example Request

```http
GET /api/inventory/fleet/freight-shipments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "bol_number": "BOL-2026-0001",
      "carrier_tracking_number": "string",
      "origin_address": "Colombo Main Distribution Warehouse, Colombo 01",
      "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
      "distance_km": "200.00",
      "weight_kg": "1000.00",
      "calculated_freight_cost": "10000.00",
      "status": "string",
      "exception_notes": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "carrier": "string",
      "customer": "string"
    }
  ]
}
```

---

### `POST /api/inventory/fleet/freight-shipments/`

- **Endpoint**: `POST /api/inventory/fleet/freight-shipments/`
- **Summary**: Outsourced 3PL Freight Shipment with automatic freight rating: freight = rate * distance * weight (FLT-30, FLT-31).

#### Example Request

```http
POST /api/inventory/fleet/freight-shipments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "bol_number": "BOL-2026-0001",
  "carrier_tracking_number": "sample_carrier_tracking_number",
  "origin_address": "Colombo Main Distribution Warehouse, Colombo 01",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "distance_km": "200.00",
  "weight_kg": "1000.00",
  "status": "TENDERED",
  "exception_notes": "sample_exception_notes",
  "tenant": 1,
  "company": 1,
  "carrier": 1,
  "customer": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "bol_number": "BOL-2026-0001",
  "carrier_tracking_number": "sample_carrier_tracking_number",
  "origin_address": "Colombo Main Distribution Warehouse, Colombo 01",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "distance_km": "200.00",
  "weight_kg": "1000.00",
  "calculated_freight_cost": "10000.00",
  "status": "TENDERED",
  "exception_notes": "sample_exception_notes",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "carrier": 1,
  "customer": 1
}
```

---

### `GET /api/inventory/fleet/freight-shipments/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/freight-shipments/{id}/`
- **Summary**: Outsourced 3PL Freight Shipment with automatic freight rating: freight = rate * distance * weight (FLT-30, FLT-31).

#### Example Request

```http
GET /api/inventory/fleet/freight-shipments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "bol_number": "BOL-2026-0001",
  "carrier_tracking_number": "sample_carrier_tracking_number",
  "origin_address": "Colombo Main Distribution Warehouse, Colombo 01",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "distance_km": "200.00",
  "weight_kg": "1000.00",
  "calculated_freight_cost": "10000.00",
  "status": "TENDERED",
  "exception_notes": "sample_exception_notes",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "carrier": 1,
  "customer": 1
}
```

---

### `PUT /api/inventory/fleet/freight-shipments/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/freight-shipments/{id}/`
- **Summary**: Outsourced 3PL Freight Shipment with automatic freight rating: freight = rate * distance * weight (FLT-30, FLT-31).

#### Example Request

```http
PUT /api/inventory/fleet/freight-shipments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "bol_number": "BOL-2026-0001",
  "carrier_tracking_number": "sample_carrier_tracking_number",
  "origin_address": "Colombo Main Distribution Warehouse, Colombo 01",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "distance_km": "200.00",
  "weight_kg": "1000.00",
  "status": "TENDERED",
  "exception_notes": "sample_exception_notes",
  "tenant": 1,
  "company": 1,
  "carrier": 1,
  "customer": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "bol_number": "BOL-2026-0001",
  "carrier_tracking_number": "sample_carrier_tracking_number",
  "origin_address": "Colombo Main Distribution Warehouse, Colombo 01",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "distance_km": "200.00",
  "weight_kg": "1000.00",
  "calculated_freight_cost": "10000.00",
  "status": "TENDERED",
  "exception_notes": "sample_exception_notes",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "carrier": 1,
  "customer": 1
}
```

---

### `PATCH /api/inventory/fleet/freight-shipments/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/freight-shipments/{id}/`
- **Summary**: Outsourced 3PL Freight Shipment with automatic freight rating: freight = rate * distance * weight (FLT-30, FLT-31).

#### Example Request

```http
PATCH /api/inventory/fleet/freight-shipments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "bol_number": "BOL-2026-0001",
  "carrier_tracking_number": "sample_carrier_tracking_number",
  "origin_address": "Colombo Main Distribution Warehouse, Colombo 01",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "distance_km": "200.00",
  "weight_kg": "1000.00",
  "status": "TENDERED",
  "exception_notes": "sample_exception_notes",
  "tenant": 1,
  "company": 1,
  "carrier": 1,
  "customer": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "bol_number": "BOL-2026-0001",
  "carrier_tracking_number": "sample_carrier_tracking_number",
  "origin_address": "Colombo Main Distribution Warehouse, Colombo 01",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "distance_km": "200.00",
  "weight_kg": "1000.00",
  "calculated_freight_cost": "10000.00",
  "status": "TENDERED",
  "exception_notes": "sample_exception_notes",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "carrier": 1,
  "customer": 1
}
```

---

### `DELETE /api/inventory/fleet/freight-shipments/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/freight-shipments/{id}/`
- **Summary**: Outsourced 3PL Freight Shipment with automatic freight rating: freight = rate * distance * weight (FLT-30, FLT-31).

#### Example Request

```http
DELETE /api/inventory/fleet/freight-shipments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/fleet/fuel-transactions/`

- **Endpoint**: `GET /api/inventory/fleet/fuel-transactions/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/fuel-transactions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "card_reference": "string",
      "transaction_date": "string",
      "station_location": "string",
      "liters": "95.00",
      "total_cost": "1800000.00",
      "odometer_km": "14500.0",
      "calculated_km_per_liter": "string",
      "telematics_location_verified": "string",
      "is_reconciled": "string",
      "is_flagged_anomaly": "string",
      "anomaly_reason": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "vehicle": "string",
      "driver": "string"
    }
  ]
}
```

---

### `POST /api/inventory/fleet/fuel-transactions/`

- **Endpoint**: `POST /api/inventory/fleet/fuel-transactions/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/fuel-transactions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "card_reference": "sample_card_reference",
  "transaction_date": "2026-11-23",
  "station_location": "sample_station_location",
  "liters": "95.00",
  "total_cost": "1800000.00",
  "odometer_km": "14500.0",
  "telematics_location_verified": true,
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "card_reference": "sample_card_reference",
  "transaction_date": "2026-11-23",
  "station_location": "sample_station_location",
  "liters": "95.00",
  "total_cost": "1800000.00",
  "odometer_km": "14500.0",
  "calculated_km_per_liter": "1000.00",
  "telematics_location_verified": true,
  "is_reconciled": true,
  "is_flagged_anomaly": false,
  "anomaly_reason": "sample_anomaly_reason",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

---

### `GET /api/inventory/fleet/fuel-transactions/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/fuel-transactions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/fuel-transactions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "card_reference": "sample_card_reference",
  "transaction_date": "2026-11-23",
  "station_location": "sample_station_location",
  "liters": "95.00",
  "total_cost": "1800000.00",
  "odometer_km": "14500.0",
  "calculated_km_per_liter": "1000.00",
  "telematics_location_verified": true,
  "is_reconciled": true,
  "is_flagged_anomaly": false,
  "anomaly_reason": "sample_anomaly_reason",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

---

### `PUT /api/inventory/fleet/fuel-transactions/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/fuel-transactions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/fuel-transactions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "card_reference": "sample_card_reference",
  "transaction_date": "2026-11-23",
  "station_location": "sample_station_location",
  "liters": "95.00",
  "total_cost": "1800000.00",
  "odometer_km": "14500.0",
  "telematics_location_verified": true,
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "card_reference": "sample_card_reference",
  "transaction_date": "2026-11-23",
  "station_location": "sample_station_location",
  "liters": "95.00",
  "total_cost": "1800000.00",
  "odometer_km": "14500.0",
  "calculated_km_per_liter": "1000.00",
  "telematics_location_verified": true,
  "is_reconciled": true,
  "is_flagged_anomaly": false,
  "anomaly_reason": "sample_anomaly_reason",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

---

### `PATCH /api/inventory/fleet/fuel-transactions/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/fuel-transactions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/fuel-transactions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "card_reference": "sample_card_reference",
  "transaction_date": "2026-11-23",
  "station_location": "sample_station_location",
  "liters": "95.00",
  "total_cost": "1800000.00",
  "odometer_km": "14500.0",
  "telematics_location_verified": true,
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "card_reference": "sample_card_reference",
  "transaction_date": "2026-11-23",
  "station_location": "sample_station_location",
  "liters": "95.00",
  "total_cost": "1800000.00",
  "odometer_km": "14500.0",
  "calculated_km_per_liter": "1000.00",
  "telematics_location_verified": true,
  "is_reconciled": true,
  "is_flagged_anomaly": false,
  "anomaly_reason": "sample_anomaly_reason",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

---

### `DELETE /api/inventory/fleet/fuel-transactions/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/fuel-transactions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/fuel-transactions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/fleet/geofences/`

- **Endpoint**: `GET /api/inventory/fleet/geofences/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/geofences/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "name": "Devrious Retail Group (Pvt) Ltd",
      "center_latitude": "6.927079",
      "center_longitude": "79.861244",
      "radius_meters": "500.00",
      "is_active": "string",
      "tenant": 1,
      "branch": 1
    }
  ]
}
```

---

### `POST /api/inventory/fleet/geofences/`

- **Endpoint**: `POST /api/inventory/fleet/geofences/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/geofences/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "center_latitude": "6.927079",
  "center_longitude": "79.861244",
  "radius_meters": "500.00",
  "is_active": true,
  "tenant": 1,
  "branch": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "center_latitude": "6.927079",
  "center_longitude": "79.861244",
  "radius_meters": "500.00",
  "is_active": true,
  "tenant": 1,
  "branch": 1
}
```

---

### `GET /api/inventory/fleet/geofences/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/geofences/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/geofences/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "center_latitude": "6.927079",
  "center_longitude": "79.861244",
  "radius_meters": "500.00",
  "is_active": true,
  "tenant": 1,
  "branch": 1
}
```

---

### `PUT /api/inventory/fleet/geofences/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/geofences/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/geofences/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "center_latitude": "6.927079",
  "center_longitude": "79.861244",
  "radius_meters": "500.00",
  "is_active": true,
  "tenant": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "center_latitude": "6.927079",
  "center_longitude": "79.861244",
  "radius_meters": "500.00",
  "is_active": true,
  "tenant": 1,
  "branch": 1
}
```

---

### `PATCH /api/inventory/fleet/geofences/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/geofences/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/geofences/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "center_latitude": "6.927079",
  "center_longitude": "79.861244",
  "radius_meters": "500.00",
  "is_active": true,
  "tenant": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "center_latitude": "6.927079",
  "center_longitude": "79.861244",
  "radius_meters": "500.00",
  "is_active": true,
  "tenant": 1,
  "branch": 1
}
```

---

### `DELETE /api/inventory/fleet/geofences/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/geofences/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/geofences/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/fleet/maintenance-orders/`

- **Endpoint**: `GET /api/inventory/fleet/maintenance-orders/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/maintenance-orders/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "parts_used": "string",
      "mow_number": "MOW-2026-0001",
      "service_type": "string",
      "description": "string",
      "scheduled_date": "string",
      "completed_date": "string",
      "downtime_days": "string",
      "labor_hours": "string",
      "labor_cost": "string",
      "parts_cost": "string",
      "total_cost": "1800000.00",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "vehicle": "string",
      "assigned_mechanic": "string",
      "journal_entry": "string"
    }
  ]
}
```

---

### `POST /api/inventory/fleet/maintenance-orders/`

- **Endpoint**: `POST /api/inventory/fleet/maintenance-orders/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/maintenance-orders/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "parts_used": [
    {
      "part_product": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00"
    }
  ],
  "mow_number": "MOW-2026-0001",
  "service_type": "PREVENTIVE_MILEAGE",
  "description": "sample_description",
  "scheduled_date": "2026-11-23",
  "downtime_days": "1000.00",
  "labor_hours": "1000.00",
  "labor_cost": "1000.00",
  "status": "SCHEDULED",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "vehicle": 1,
  "assigned_mechanic": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "parts_used": [
    {
      "id": 1,
      "part_product": "string",
      "part_sku": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00"
    }
  ],
  "mow_number": "MOW-2026-0001",
  "service_type": "PREVENTIVE_MILEAGE",
  "description": "sample_description",
  "scheduled_date": "2026-11-23",
  "completed_date": "2026-11-23",
  "downtime_days": "1000.00",
  "labor_hours": "1000.00",
  "labor_cost": "1000.00",
  "parts_cost": "1000.00",
  "total_cost": "1800000.00",
  "status": "SCHEDULED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "vehicle": 1,
  "assigned_mechanic": 1,
  "journal_entry": 1
}
```

---

### `GET /api/inventory/fleet/maintenance-orders/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/maintenance-orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/maintenance-orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "parts_used": [
    {
      "id": 1,
      "part_product": "string",
      "part_sku": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00"
    }
  ],
  "mow_number": "MOW-2026-0001",
  "service_type": "PREVENTIVE_MILEAGE",
  "description": "sample_description",
  "scheduled_date": "2026-11-23",
  "completed_date": "2026-11-23",
  "downtime_days": "1000.00",
  "labor_hours": "1000.00",
  "labor_cost": "1000.00",
  "parts_cost": "1000.00",
  "total_cost": "1800000.00",
  "status": "SCHEDULED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "vehicle": 1,
  "assigned_mechanic": 1,
  "journal_entry": 1
}
```

---

### `PUT /api/inventory/fleet/maintenance-orders/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/maintenance-orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/maintenance-orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "parts_used": [
    {
      "part_product": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00"
    }
  ],
  "mow_number": "MOW-2026-0001",
  "service_type": "PREVENTIVE_MILEAGE",
  "description": "sample_description",
  "scheduled_date": "2026-11-23",
  "downtime_days": "1000.00",
  "labor_hours": "1000.00",
  "labor_cost": "1000.00",
  "status": "SCHEDULED",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "vehicle": 1,
  "assigned_mechanic": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "parts_used": [
    {
      "id": 1,
      "part_product": "string",
      "part_sku": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00"
    }
  ],
  "mow_number": "MOW-2026-0001",
  "service_type": "PREVENTIVE_MILEAGE",
  "description": "sample_description",
  "scheduled_date": "2026-11-23",
  "completed_date": "2026-11-23",
  "downtime_days": "1000.00",
  "labor_hours": "1000.00",
  "labor_cost": "1000.00",
  "parts_cost": "1000.00",
  "total_cost": "1800000.00",
  "status": "SCHEDULED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "vehicle": 1,
  "assigned_mechanic": 1,
  "journal_entry": 1
}
```

---

### `PATCH /api/inventory/fleet/maintenance-orders/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/maintenance-orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/maintenance-orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "parts_used": [
    {
      "part_product": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00"
    }
  ],
  "mow_number": "MOW-2026-0001",
  "service_type": "PREVENTIVE_MILEAGE",
  "description": "sample_description",
  "scheduled_date": "2026-11-23",
  "downtime_days": "1000.00",
  "labor_hours": "1000.00",
  "labor_cost": "1000.00",
  "status": "SCHEDULED",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "vehicle": 1,
  "assigned_mechanic": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "parts_used": [
    {
      "id": 1,
      "part_product": "string",
      "part_sku": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00"
    }
  ],
  "mow_number": "MOW-2026-0001",
  "service_type": "PREVENTIVE_MILEAGE",
  "description": "sample_description",
  "scheduled_date": "2026-11-23",
  "completed_date": "2026-11-23",
  "downtime_days": "1000.00",
  "labor_hours": "1000.00",
  "labor_cost": "1000.00",
  "parts_cost": "1000.00",
  "total_cost": "1800000.00",
  "status": "SCHEDULED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "vehicle": 1,
  "assigned_mechanic": 1,
  "journal_entry": 1
}
```

---

### `DELETE /api/inventory/fleet/maintenance-orders/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/maintenance-orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/maintenance-orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/fleet/maintenance-orders/{id}/complete-work-order/`

- **Endpoint**: `POST /api/inventory/fleet/maintenance-orders/{id}/complete-work-order/`
- **Summary**: Complete Maintenance Work Order, Deduct Spare Parts from Inventory & Post to Finance GL (FLT-16, FLT-19, FLT-35)

#### Example Request

```http
POST /api/inventory/fleet/maintenance-orders/{id}/complete-work-order/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "parts_used": [
    {
      "part_product": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00"
    }
  ],
  "mow_number": "MOW-2026-0001",
  "service_type": "PREVENTIVE_MILEAGE",
  "description": "sample_description",
  "scheduled_date": "2026-11-23",
  "downtime_days": "1000.00",
  "labor_hours": "1000.00",
  "labor_cost": "1000.00",
  "status": "SCHEDULED",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "vehicle": 1,
  "assigned_mechanic": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "parts_used": [
    {
      "id": 1,
      "part_product": "string",
      "part_sku": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00"
    }
  ],
  "mow_number": "MOW-2026-0001",
  "service_type": "PREVENTIVE_MILEAGE",
  "description": "sample_description",
  "scheduled_date": "2026-11-23",
  "completed_date": "2026-11-23",
  "downtime_days": "1000.00",
  "labor_hours": "1000.00",
  "labor_cost": "1000.00",
  "parts_cost": "1000.00",
  "total_cost": "1800000.00",
  "status": "SCHEDULED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "vehicle": 1,
  "assigned_mechanic": 1,
  "journal_entry": 1
}
```

---

### `GET /api/inventory/fleet/telemetry-logs/`

- **Endpoint**: `GET /api/inventory/fleet/telemetry-logs/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/telemetry-logs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "latitude": "6.927079",
      "longitude": "79.861244",
      "speed_kmh": "string",
      "odometer_km": "14500.0",
      "event_kind": "string",
      "recorded_at": "string",
      "tenant": 1,
      "vehicle": "string",
      "trip": "string",
      "geofence": "string"
    }
  ]
}
```

---

### `POST /api/inventory/fleet/telemetry-logs/`

- **Endpoint**: `POST /api/inventory/fleet/telemetry-logs/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/telemetry-logs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "latitude": "6.927079",
  "longitude": "79.861244",
  "speed_kmh": "1000.00",
  "odometer_km": "14500.0",
  "event_kind": "GPS_PING",
  "tenant": 1,
  "vehicle": 1,
  "trip": 1,
  "geofence": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "latitude": "6.927079",
  "longitude": "79.861244",
  "speed_kmh": "1000.00",
  "odometer_km": "14500.0",
  "event_kind": "GPS_PING",
  "recorded_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "vehicle": 1,
  "trip": 1,
  "geofence": 1
}
```

---

### `GET /api/inventory/fleet/telemetry-logs/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/telemetry-logs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/telemetry-logs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "latitude": "6.927079",
  "longitude": "79.861244",
  "speed_kmh": "1000.00",
  "odometer_km": "14500.0",
  "event_kind": "GPS_PING",
  "recorded_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "vehicle": 1,
  "trip": 1,
  "geofence": 1
}
```

---

### `PUT /api/inventory/fleet/telemetry-logs/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/telemetry-logs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/telemetry-logs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "latitude": "6.927079",
  "longitude": "79.861244",
  "speed_kmh": "1000.00",
  "odometer_km": "14500.0",
  "event_kind": "GPS_PING",
  "tenant": 1,
  "vehicle": 1,
  "trip": 1,
  "geofence": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "latitude": "6.927079",
  "longitude": "79.861244",
  "speed_kmh": "1000.00",
  "odometer_km": "14500.0",
  "event_kind": "GPS_PING",
  "recorded_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "vehicle": 1,
  "trip": 1,
  "geofence": 1
}
```

---

### `PATCH /api/inventory/fleet/telemetry-logs/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/telemetry-logs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/telemetry-logs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "latitude": "6.927079",
  "longitude": "79.861244",
  "speed_kmh": "1000.00",
  "odometer_km": "14500.0",
  "event_kind": "GPS_PING",
  "tenant": 1,
  "vehicle": 1,
  "trip": 1,
  "geofence": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "latitude": "6.927079",
  "longitude": "79.861244",
  "speed_kmh": "1000.00",
  "odometer_km": "14500.0",
  "event_kind": "GPS_PING",
  "recorded_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "vehicle": 1,
  "trip": 1,
  "geofence": 1
}
```

---

### `DELETE /api/inventory/fleet/telemetry-logs/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/telemetry-logs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/telemetry-logs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/fleet/tolls-fines/`

- **Endpoint**: `GET /api/inventory/fleet/tolls-fines/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/tolls-fines/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "charge_type": "string",
      "incident_date": "string",
      "amount": "35000.00",
      "deduct_from_driver": "string",
      "reference_number": "BOC-SLIP-998877",
      "notes": "Verified and recorded by administrator.",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "vehicle": "string",
      "driver": "string"
    }
  ]
}
```

---

### `POST /api/inventory/fleet/tolls-fines/`

- **Endpoint**: `POST /api/inventory/fleet/tolls-fines/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/tolls-fines/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "charge_type": "TOLL",
  "incident_date": "2026-11-23",
  "amount": "35000.00",
  "deduct_from_driver": true,
  "reference_number": "BOC-SLIP-998877",
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "charge_type": "TOLL",
  "incident_date": "2026-11-23",
  "amount": "35000.00",
  "deduct_from_driver": true,
  "reference_number": "BOC-SLIP-998877",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

---

### `GET /api/inventory/fleet/tolls-fines/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/tolls-fines/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/tolls-fines/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "charge_type": "TOLL",
  "incident_date": "2026-11-23",
  "amount": "35000.00",
  "deduct_from_driver": true,
  "reference_number": "BOC-SLIP-998877",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

---

### `PUT /api/inventory/fleet/tolls-fines/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/tolls-fines/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/tolls-fines/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "charge_type": "TOLL",
  "incident_date": "2026-11-23",
  "amount": "35000.00",
  "deduct_from_driver": true,
  "reference_number": "BOC-SLIP-998877",
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "charge_type": "TOLL",
  "incident_date": "2026-11-23",
  "amount": "35000.00",
  "deduct_from_driver": true,
  "reference_number": "BOC-SLIP-998877",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

---

### `PATCH /api/inventory/fleet/tolls-fines/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/tolls-fines/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/tolls-fines/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "charge_type": "TOLL",
  "incident_date": "2026-11-23",
  "amount": "35000.00",
  "deduct_from_driver": true,
  "reference_number": "BOC-SLIP-998877",
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "charge_type": "TOLL",
  "incident_date": "2026-11-23",
  "amount": "35000.00",
  "deduct_from_driver": true,
  "reference_number": "BOC-SLIP-998877",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1
}
```

---

### `DELETE /api/inventory/fleet/tolls-fines/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/tolls-fines/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/tolls-fines/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/fleet/trips/`

- **Endpoint**: `GET /api/inventory/fleet/trips/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/trips/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "trip_number": "TRIP-2026-0001",
      "delivery_note_number": "DN-2026-0001",
      "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
      "planned_load_weight_kg": "1200.00",
      "planned_distance_km": "string",
      "actual_distance_km": "string",
      "estimated_arrival_at": "string",
      "route_stops_json": "string",
      "fuel_cost": "string",
      "maintenance_cost": "string",
      "status": "string",
      "signed_off_by": "string",
      "departure_at": "string",
      "delivered_at": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "vehicle": "string",
      "driver": "string",
      "stock_transfer": "string",
      "origin_branch": "string",
      "journal_entry": "string"
    }
  ]
}
```

---

### `POST /api/inventory/fleet/trips/`

- **Endpoint**: `POST /api/inventory/fleet/trips/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/trips/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "trip_number": "TRIP-2026-0001",
  "delivery_note_number": "DN-2026-0001",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "planned_load_weight_kg": "1200.00",
  "planned_distance_km": "1000.00",
  "actual_distance_km": "1000.00",
  "estimated_arrival_at": "2026-11-23T10:30:00+05:30",
  "route_stops_json": {
    "key": "value"
  },
  "fuel_cost": "1000.00",
  "maintenance_cost": "1000.00",
  "status": "SCHEDULED",
  "signed_off_by": "sample_signed_off_by",
  "departure_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "stock_transfer": 1,
  "origin_branch": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "trip_number": "TRIP-2026-0001",
  "delivery_note_number": "DN-2026-0001",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "planned_load_weight_kg": "1200.00",
  "planned_distance_km": "1000.00",
  "actual_distance_km": "1000.00",
  "estimated_arrival_at": "2026-11-23T10:30:00+05:30",
  "route_stops_json": {
    "key": "value"
  },
  "fuel_cost": "1000.00",
  "maintenance_cost": "1000.00",
  "status": "SCHEDULED",
  "signed_off_by": "sample_signed_off_by",
  "departure_at": "2026-11-23T10:30:00+05:30",
  "delivered_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "stock_transfer": 1,
  "origin_branch": 1,
  "journal_entry": 1
}
```

---

### `POST /api/inventory/fleet/trips/optimize-routes/`

- **Endpoint**: `POST /api/inventory/fleet/trips/optimize-routes/`
- **Summary**: Optimize Multi-Stop Delivery Routes Across Available Fleet Vehicles Respecting Payload Capacity (`FLT-09`)

#### Example Request

```http
POST /api/inventory/fleet/trips/optimize-routes/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "vehicle_ids": [
    1,
    2
  ],
  "stops": [
    {
      "stop_order": 1,
      "address": "Negombo Branch",
      "weight_kg": "450.00"
    },
    {
      "stop_order": 2,
      "address": "Chilaw Store",
      "weight_kg": "600.00"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "optimized_vehicle_routes": [
    {
      "vehicle_id": 1,
      "capacity_kg": "3500.00",
      "assigned_stops": [
        {
          "stop_order": 1,
          "address": "Negombo Branch",
          "weight_kg": "450.00"
        }
      ],
      "total_weight_kg": "450.00"
    },
    {
      "vehicle_id": 2,
      "capacity_kg": "3500.00",
      "assigned_stops": [
        {
          "stop_order": 2,
          "address": "Chilaw Store",
          "weight_kg": "600.00"
        }
      ],
      "total_weight_kg": "600.00"
    }
  ]
}
```

---

### `GET /api/inventory/fleet/trips/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/trips/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/trips/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "trip_number": "TRIP-2026-0001",
  "delivery_note_number": "DN-2026-0001",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "planned_load_weight_kg": "1200.00",
  "planned_distance_km": "1000.00",
  "actual_distance_km": "1000.00",
  "estimated_arrival_at": "2026-11-23T10:30:00+05:30",
  "route_stops_json": {
    "key": "value"
  },
  "fuel_cost": "1000.00",
  "maintenance_cost": "1000.00",
  "status": "SCHEDULED",
  "signed_off_by": "sample_signed_off_by",
  "departure_at": "2026-11-23T10:30:00+05:30",
  "delivered_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "stock_transfer": 1,
  "origin_branch": 1,
  "journal_entry": 1
}
```

---

### `PUT /api/inventory/fleet/trips/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/trips/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/trips/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "trip_number": "TRIP-2026-0001",
  "delivery_note_number": "DN-2026-0001",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "planned_load_weight_kg": "1200.00",
  "planned_distance_km": "1000.00",
  "actual_distance_km": "1000.00",
  "estimated_arrival_at": "2026-11-23T10:30:00+05:30",
  "route_stops_json": {
    "key": "value"
  },
  "fuel_cost": "1000.00",
  "maintenance_cost": "1000.00",
  "status": "SCHEDULED",
  "signed_off_by": "sample_signed_off_by",
  "departure_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "stock_transfer": 1,
  "origin_branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "trip_number": "TRIP-2026-0001",
  "delivery_note_number": "DN-2026-0001",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "planned_load_weight_kg": "1200.00",
  "planned_distance_km": "1000.00",
  "actual_distance_km": "1000.00",
  "estimated_arrival_at": "2026-11-23T10:30:00+05:30",
  "route_stops_json": {
    "key": "value"
  },
  "fuel_cost": "1000.00",
  "maintenance_cost": "1000.00",
  "status": "SCHEDULED",
  "signed_off_by": "sample_signed_off_by",
  "departure_at": "2026-11-23T10:30:00+05:30",
  "delivered_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "stock_transfer": 1,
  "origin_branch": 1,
  "journal_entry": 1
}
```

---

### `PATCH /api/inventory/fleet/trips/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/trips/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/trips/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "trip_number": "TRIP-2026-0001",
  "delivery_note_number": "DN-2026-0001",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "planned_load_weight_kg": "1200.00",
  "planned_distance_km": "1000.00",
  "actual_distance_km": "1000.00",
  "estimated_arrival_at": "2026-11-23T10:30:00+05:30",
  "route_stops_json": {
    "key": "value"
  },
  "fuel_cost": "1000.00",
  "maintenance_cost": "1000.00",
  "status": "SCHEDULED",
  "signed_off_by": "sample_signed_off_by",
  "departure_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "stock_transfer": 1,
  "origin_branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "trip_number": "TRIP-2026-0001",
  "delivery_note_number": "DN-2026-0001",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "planned_load_weight_kg": "1200.00",
  "planned_distance_km": "1000.00",
  "actual_distance_km": "1000.00",
  "estimated_arrival_at": "2026-11-23T10:30:00+05:30",
  "route_stops_json": {
    "key": "value"
  },
  "fuel_cost": "1000.00",
  "maintenance_cost": "1000.00",
  "status": "SCHEDULED",
  "signed_off_by": "sample_signed_off_by",
  "departure_at": "2026-11-23T10:30:00+05:30",
  "delivered_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "stock_transfer": 1,
  "origin_branch": 1,
  "journal_entry": 1
}
```

---

### `DELETE /api/inventory/fleet/trips/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/trips/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/trips/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/fleet/trips/{id}/complete-delivery/`

- **Endpoint**: `POST /api/inventory/fleet/trips/{id}/complete-delivery/`
- **Summary**: Complete Delivery Trip, Sign Off Delivery Note, & Post Fuel/Maintenance Costs (ERP-INV-017..020)

#### Example Request

```http
POST /api/inventory/fleet/trips/{id}/complete-delivery/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "trip_number": "TRIP-2026-0001",
  "delivery_note_number": "DN-2026-0001",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "planned_load_weight_kg": "1200.00",
  "planned_distance_km": "1000.00",
  "actual_distance_km": "1000.00",
  "estimated_arrival_at": "2026-11-23T10:30:00+05:30",
  "route_stops_json": {
    "key": "value"
  },
  "fuel_cost": "1000.00",
  "maintenance_cost": "1000.00",
  "status": "SCHEDULED",
  "signed_off_by": "sample_signed_off_by",
  "departure_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "stock_transfer": 1,
  "origin_branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "trip_number": "TRIP-2026-0001",
  "delivery_note_number": "DN-2026-0001",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "planned_load_weight_kg": "1200.00",
  "planned_distance_km": "1000.00",
  "actual_distance_km": "1000.00",
  "estimated_arrival_at": "2026-11-23T10:30:00+05:30",
  "route_stops_json": {
    "key": "value"
  },
  "fuel_cost": "1000.00",
  "maintenance_cost": "1000.00",
  "status": "SCHEDULED",
  "signed_off_by": "sample_signed_off_by",
  "departure_at": "2026-11-23T10:30:00+05:30",
  "delivered_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "stock_transfer": 1,
  "origin_branch": 1,
  "journal_entry": 1
}
```

---

### `GET /api/inventory/fleet/trips/{id}/route-replay/`

- **Endpoint**: `GET /api/inventory/fleet/trips/{id}/route-replay/`
- **Summary**: Retrieve Full GPS Route History Replay for a Trip (FLT-14)

#### Example Request

```http
GET /api/inventory/fleet/trips/{id}/route-replay/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "trip_number": "TRIP-2026-0001",
  "delivery_note_number": "DN-2026-0001",
  "destination_address": "No. 15, Peradeniya Road, Kandy, Sri Lanka",
  "planned_load_weight_kg": "1200.00",
  "planned_distance_km": "1000.00",
  "actual_distance_km": "1000.00",
  "estimated_arrival_at": "2026-11-23T10:30:00+05:30",
  "route_stops_json": {
    "key": "value"
  },
  "fuel_cost": "1000.00",
  "maintenance_cost": "1000.00",
  "status": "SCHEDULED",
  "signed_off_by": "sample_signed_off_by",
  "departure_at": "2026-11-23T10:30:00+05:30",
  "delivered_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "vehicle": 1,
  "driver": 1,
  "stock_transfer": 1,
  "origin_branch": 1,
  "journal_entry": 1
}
```

---

### `GET /api/inventory/fleet/vehicles/`

- **Endpoint**: `GET /api/inventory/fleet/vehicles/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/vehicles/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "compliance_documents": "string",
      "registration_number": "WP-LK-9900",
      "vin_serial": "VIN-ISUZU-2026-9900",
      "make_model": "Isuzu ELF Heavy Truck",
      "manufacture_year": "string",
      "asset_category": "string",
      "vehicle_type": "string",
      "required_license_category": "string",
      "ownership_type": "string",
      "lease_contract_number": "string",
      "lease_end_date": "string",
      "monthly_lease_cost": "string",
      "purchase_cost": "string",
      "accumulated_depreciation": "string",
      "driver_name": "string",
      "driver_phone": "string",
      "seating_capacity": "string",
      "capacity_kg": "3500.00",
      "capacity_volume_cbm": "string",
      "fuel_type": "string",
      "fuel_tank_capacity_liters": "string",
      "baseline_km_per_liter": "string",
      "current_odometer_km": "string",
      "next_service_odometer_km": "string",
      "telematics_device_id": "string",
      "current_latitude": "string",
      "current_longitude": "string",
      "last_gps_ping_at": "string",
      "is_available": "string",
      "is_dispatch_blocked_compliance": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "attached_to_vehicle": "string"
    }
  ]
}
```

---

### `POST /api/inventory/fleet/vehicles/`

- **Endpoint**: `POST /api/inventory/fleet/vehicles/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/fleet/vehicles/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "registration_number": "WP-LK-9900",
  "vin_serial": "VIN-ISUZU-2026-9900",
  "make_model": "Isuzu ELF Heavy Truck",
  "manufacture_year": 1,
  "asset_category": "TRUCK",
  "vehicle_type": "sample_vehicle_type",
  "required_license_category": "sample_required_license_category",
  "ownership_type": "OWNED",
  "lease_contract_number": "sample_lease_contract_number",
  "lease_end_date": "2026-11-23",
  "monthly_lease_cost": "1000.00",
  "purchase_cost": "1000.00",
  "accumulated_depreciation": "1000.00",
  "driver_name": "sample_driver_name",
  "driver_phone": "sample_driver_phone",
  "seating_capacity": 1,
  "capacity_kg": "3500.00",
  "capacity_volume_cbm": "1000.00",
  "fuel_type": "sample_fuel_type",
  "fuel_tank_capacity_liters": "1000.00",
  "baseline_km_per_liter": "1000.00",
  "current_odometer_km": "1000.00",
  "next_service_odometer_km": "1000.00",
  "telematics_device_id": "sample_telematics_device_id",
  "current_latitude": "1000.00",
  "current_longitude": "1000.00",
  "last_gps_ping_at": "2026-11-23T10:30:00+05:30",
  "is_available": true,
  "is_dispatch_blocked_compliance": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "attached_to_vehicle": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "compliance_documents": [
    {
      "id": 1,
      "document_type": "string",
      "document_number": "string",
      "issue_date": "string",
      "expiry_date": "string",
      "alert_window_days": "string",
      "is_active": "string",
      "tenant": 1,
      "vehicle": "string"
    }
  ],
  "registration_number": "WP-LK-9900",
  "vin_serial": "VIN-ISUZU-2026-9900",
  "make_model": "Isuzu ELF Heavy Truck",
  "manufacture_year": 1,
  "asset_category": "TRUCK",
  "vehicle_type": "sample_vehicle_type",
  "required_license_category": "sample_required_license_category",
  "ownership_type": "OWNED",
  "lease_contract_number": "sample_lease_contract_number",
  "lease_end_date": "2026-11-23",
  "monthly_lease_cost": "1000.00",
  "purchase_cost": "1000.00",
  "accumulated_depreciation": "1000.00",
  "driver_name": "sample_driver_name",
  "driver_phone": "sample_driver_phone",
  "seating_capacity": 1,
  "capacity_kg": "3500.00",
  "capacity_volume_cbm": "1000.00",
  "fuel_type": "sample_fuel_type",
  "fuel_tank_capacity_liters": "1000.00",
  "baseline_km_per_liter": "1000.00",
  "current_odometer_km": "1000.00",
  "next_service_odometer_km": "1000.00",
  "telematics_device_id": "sample_telematics_device_id",
  "current_latitude": "1000.00",
  "current_longitude": "1000.00",
  "last_gps_ping_at": "2026-11-23T10:30:00+05:30",
  "is_available": true,
  "is_dispatch_blocked_compliance": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "attached_to_vehicle": 1
}
```

---

### `GET /api/inventory/fleet/vehicles/{id}/`

- **Endpoint**: `GET /api/inventory/fleet/vehicles/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/fleet/vehicles/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "compliance_documents": [
    {
      "id": 1,
      "document_type": "string",
      "document_number": "string",
      "issue_date": "string",
      "expiry_date": "string",
      "alert_window_days": "string",
      "is_active": "string",
      "tenant": 1,
      "vehicle": "string"
    }
  ],
  "registration_number": "WP-LK-9900",
  "vin_serial": "VIN-ISUZU-2026-9900",
  "make_model": "Isuzu ELF Heavy Truck",
  "manufacture_year": 1,
  "asset_category": "TRUCK",
  "vehicle_type": "sample_vehicle_type",
  "required_license_category": "sample_required_license_category",
  "ownership_type": "OWNED",
  "lease_contract_number": "sample_lease_contract_number",
  "lease_end_date": "2026-11-23",
  "monthly_lease_cost": "1000.00",
  "purchase_cost": "1000.00",
  "accumulated_depreciation": "1000.00",
  "driver_name": "sample_driver_name",
  "driver_phone": "sample_driver_phone",
  "seating_capacity": 1,
  "capacity_kg": "3500.00",
  "capacity_volume_cbm": "1000.00",
  "fuel_type": "sample_fuel_type",
  "fuel_tank_capacity_liters": "1000.00",
  "baseline_km_per_liter": "1000.00",
  "current_odometer_km": "1000.00",
  "next_service_odometer_km": "1000.00",
  "telematics_device_id": "sample_telematics_device_id",
  "current_latitude": "1000.00",
  "current_longitude": "1000.00",
  "last_gps_ping_at": "2026-11-23T10:30:00+05:30",
  "is_available": true,
  "is_dispatch_blocked_compliance": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "attached_to_vehicle": 1
}
```

---

### `PUT /api/inventory/fleet/vehicles/{id}/`

- **Endpoint**: `PUT /api/inventory/fleet/vehicles/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/fleet/vehicles/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "registration_number": "WP-LK-9900",
  "vin_serial": "VIN-ISUZU-2026-9900",
  "make_model": "Isuzu ELF Heavy Truck",
  "manufacture_year": 1,
  "asset_category": "TRUCK",
  "vehicle_type": "sample_vehicle_type",
  "required_license_category": "sample_required_license_category",
  "ownership_type": "OWNED",
  "lease_contract_number": "sample_lease_contract_number",
  "lease_end_date": "2026-11-23",
  "monthly_lease_cost": "1000.00",
  "purchase_cost": "1000.00",
  "accumulated_depreciation": "1000.00",
  "driver_name": "sample_driver_name",
  "driver_phone": "sample_driver_phone",
  "seating_capacity": 1,
  "capacity_kg": "3500.00",
  "capacity_volume_cbm": "1000.00",
  "fuel_type": "sample_fuel_type",
  "fuel_tank_capacity_liters": "1000.00",
  "baseline_km_per_liter": "1000.00",
  "current_odometer_km": "1000.00",
  "next_service_odometer_km": "1000.00",
  "telematics_device_id": "sample_telematics_device_id",
  "current_latitude": "1000.00",
  "current_longitude": "1000.00",
  "last_gps_ping_at": "2026-11-23T10:30:00+05:30",
  "is_available": true,
  "is_dispatch_blocked_compliance": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "attached_to_vehicle": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "compliance_documents": [
    {
      "id": 1,
      "document_type": "string",
      "document_number": "string",
      "issue_date": "string",
      "expiry_date": "string",
      "alert_window_days": "string",
      "is_active": "string",
      "tenant": 1,
      "vehicle": "string"
    }
  ],
  "registration_number": "WP-LK-9900",
  "vin_serial": "VIN-ISUZU-2026-9900",
  "make_model": "Isuzu ELF Heavy Truck",
  "manufacture_year": 1,
  "asset_category": "TRUCK",
  "vehicle_type": "sample_vehicle_type",
  "required_license_category": "sample_required_license_category",
  "ownership_type": "OWNED",
  "lease_contract_number": "sample_lease_contract_number",
  "lease_end_date": "2026-11-23",
  "monthly_lease_cost": "1000.00",
  "purchase_cost": "1000.00",
  "accumulated_depreciation": "1000.00",
  "driver_name": "sample_driver_name",
  "driver_phone": "sample_driver_phone",
  "seating_capacity": 1,
  "capacity_kg": "3500.00",
  "capacity_volume_cbm": "1000.00",
  "fuel_type": "sample_fuel_type",
  "fuel_tank_capacity_liters": "1000.00",
  "baseline_km_per_liter": "1000.00",
  "current_odometer_km": "1000.00",
  "next_service_odometer_km": "1000.00",
  "telematics_device_id": "sample_telematics_device_id",
  "current_latitude": "1000.00",
  "current_longitude": "1000.00",
  "last_gps_ping_at": "2026-11-23T10:30:00+05:30",
  "is_available": true,
  "is_dispatch_blocked_compliance": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "attached_to_vehicle": 1
}
```

---

### `PATCH /api/inventory/fleet/vehicles/{id}/`

- **Endpoint**: `PATCH /api/inventory/fleet/vehicles/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/fleet/vehicles/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "registration_number": "WP-LK-9900",
  "vin_serial": "VIN-ISUZU-2026-9900",
  "make_model": "Isuzu ELF Heavy Truck",
  "manufacture_year": 1,
  "asset_category": "TRUCK",
  "vehicle_type": "sample_vehicle_type",
  "required_license_category": "sample_required_license_category",
  "ownership_type": "OWNED",
  "lease_contract_number": "sample_lease_contract_number",
  "lease_end_date": "2026-11-23",
  "monthly_lease_cost": "1000.00",
  "purchase_cost": "1000.00",
  "accumulated_depreciation": "1000.00",
  "driver_name": "sample_driver_name",
  "driver_phone": "sample_driver_phone",
  "seating_capacity": 1,
  "capacity_kg": "3500.00",
  "capacity_volume_cbm": "1000.00",
  "fuel_type": "sample_fuel_type",
  "fuel_tank_capacity_liters": "1000.00",
  "baseline_km_per_liter": "1000.00",
  "current_odometer_km": "1000.00",
  "next_service_odometer_km": "1000.00",
  "telematics_device_id": "sample_telematics_device_id",
  "current_latitude": "1000.00",
  "current_longitude": "1000.00",
  "last_gps_ping_at": "2026-11-23T10:30:00+05:30",
  "is_available": true,
  "is_dispatch_blocked_compliance": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "attached_to_vehicle": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "compliance_documents": [
    {
      "id": 1,
      "document_type": "string",
      "document_number": "string",
      "issue_date": "string",
      "expiry_date": "string",
      "alert_window_days": "string",
      "is_active": "string",
      "tenant": 1,
      "vehicle": "string"
    }
  ],
  "registration_number": "WP-LK-9900",
  "vin_serial": "VIN-ISUZU-2026-9900",
  "make_model": "Isuzu ELF Heavy Truck",
  "manufacture_year": 1,
  "asset_category": "TRUCK",
  "vehicle_type": "sample_vehicle_type",
  "required_license_category": "sample_required_license_category",
  "ownership_type": "OWNED",
  "lease_contract_number": "sample_lease_contract_number",
  "lease_end_date": "2026-11-23",
  "monthly_lease_cost": "1000.00",
  "purchase_cost": "1000.00",
  "accumulated_depreciation": "1000.00",
  "driver_name": "sample_driver_name",
  "driver_phone": "sample_driver_phone",
  "seating_capacity": 1,
  "capacity_kg": "3500.00",
  "capacity_volume_cbm": "1000.00",
  "fuel_type": "sample_fuel_type",
  "fuel_tank_capacity_liters": "1000.00",
  "baseline_km_per_liter": "1000.00",
  "current_odometer_km": "1000.00",
  "next_service_odometer_km": "1000.00",
  "telematics_device_id": "sample_telematics_device_id",
  "current_latitude": "1000.00",
  "current_longitude": "1000.00",
  "last_gps_ping_at": "2026-11-23T10:30:00+05:30",
  "is_available": true,
  "is_dispatch_blocked_compliance": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "attached_to_vehicle": 1
}
```

---

### `DELETE /api/inventory/fleet/vehicles/{id}/`

- **Endpoint**: `DELETE /api/inventory/fleet/vehicles/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/fleet/vehicles/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/fleet/vehicles/{id}/telemetry-ping/`

- **Endpoint**: `POST /api/inventory/fleet/vehicles/{id}/telemetry-ping/`
- **Summary**: Receive Live GPS Telematics Ping, Check Geofences, Route Replay, & Driver Safety Events (FLT-05, FLT-13..15, FLT-27)

#### Example Request

```http
POST /api/inventory/fleet/vehicles/{id}/telemetry-ping/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "registration_number": "WP-LK-9900",
  "vin_serial": "VIN-ISUZU-2026-9900",
  "make_model": "Isuzu ELF Heavy Truck",
  "manufacture_year": 1,
  "asset_category": "TRUCK",
  "vehicle_type": "sample_vehicle_type",
  "required_license_category": "sample_required_license_category",
  "ownership_type": "OWNED",
  "lease_contract_number": "sample_lease_contract_number",
  "lease_end_date": "2026-11-23",
  "monthly_lease_cost": "1000.00",
  "purchase_cost": "1000.00",
  "accumulated_depreciation": "1000.00",
  "driver_name": "sample_driver_name",
  "driver_phone": "sample_driver_phone",
  "seating_capacity": 1,
  "capacity_kg": "3500.00",
  "capacity_volume_cbm": "1000.00",
  "fuel_type": "sample_fuel_type",
  "fuel_tank_capacity_liters": "1000.00",
  "baseline_km_per_liter": "1000.00",
  "current_odometer_km": "1000.00",
  "next_service_odometer_km": "1000.00",
  "telematics_device_id": "sample_telematics_device_id",
  "current_latitude": "1000.00",
  "current_longitude": "1000.00",
  "last_gps_ping_at": "2026-11-23T10:30:00+05:30",
  "is_available": true,
  "is_dispatch_blocked_compliance": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "attached_to_vehicle": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "compliance_documents": [
    {
      "id": 1,
      "document_type": "string",
      "document_number": "string",
      "issue_date": "string",
      "expiry_date": "string",
      "alert_window_days": "string",
      "is_active": "string",
      "tenant": 1,
      "vehicle": "string"
    }
  ],
  "registration_number": "WP-LK-9900",
  "vin_serial": "VIN-ISUZU-2026-9900",
  "make_model": "Isuzu ELF Heavy Truck",
  "manufacture_year": 1,
  "asset_category": "TRUCK",
  "vehicle_type": "sample_vehicle_type",
  "required_license_category": "sample_required_license_category",
  "ownership_type": "OWNED",
  "lease_contract_number": "sample_lease_contract_number",
  "lease_end_date": "2026-11-23",
  "monthly_lease_cost": "1000.00",
  "purchase_cost": "1000.00",
  "accumulated_depreciation": "1000.00",
  "driver_name": "sample_driver_name",
  "driver_phone": "sample_driver_phone",
  "seating_capacity": 1,
  "capacity_kg": "3500.00",
  "capacity_volume_cbm": "1000.00",
  "fuel_type": "sample_fuel_type",
  "fuel_tank_capacity_liters": "1000.00",
  "baseline_km_per_liter": "1000.00",
  "current_odometer_km": "1000.00",
  "next_service_odometer_km": "1000.00",
  "telematics_device_id": "sample_telematics_device_id",
  "current_latitude": "1000.00",
  "current_longitude": "1000.00",
  "last_gps_ping_at": "2026-11-23T10:30:00+05:30",
  "is_available": true,
  "is_dispatch_blocked_compliance": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "attached_to_vehicle": 1
}
```

---

## 11. E-Commerce Orders & Online Returns (ERP-ECOM)

### `GET /api/inventory/ecommerce/orders/`

- **Endpoint**: `GET /api/inventory/ecommerce/orders/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/ecommerce/orders/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "lines": "string",
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "order_number": "ORD-2026-0001",
      "status": "string",
      "payment_gateway": "string",
      "payment_gateway_ref": "string",
      "coupon_code": "string",
      "subtotal": "100000.00",
      "discount_amount": "0.00",
      "shipping_fee": "string",
      "tax_amount": "18000.00",
      "grand_total": "118000.00",
      "shipping_address": "No. 88, Galle Road, Dehiwala, Sri Lanka",
      "is_in_store_pickup": "string",
      "created_at": "string",
      "updated_at": "string",
      "tenant": 1,
      "company": 1,
      "fulfillment_branch": "string",
      "customer": "string",
      "ar_invoice": "string"
    }
  ]
}
```

---

### `POST /api/inventory/ecommerce/orders/`

- **Endpoint**: `POST /api/inventory/ecommerce/orders/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/ecommerce/orders/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "quantity": "10.00",
      "unit_price": "100000.00"
    }
  ],
  "order_number": "ORD-2026-0001",
  "status": "PLACED",
  "payment_gateway": "sample_payment_gateway",
  "payment_gateway_ref": "sample_payment_gateway_ref",
  "coupon_code": "sample_coupon_code",
  "discount_amount": "0.00",
  "shipping_fee": "1000.00",
  "shipping_address": "No. 88, Galle Road, Dehiwala, Sri Lanka",
  "is_in_store_pickup": true,
  "tenant": 1,
  "company": 1,
  "fulfillment_branch": 1,
  "customer": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "tax_amount": "18000.00",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "order_number": "ORD-2026-0001",
  "status": "PLACED",
  "payment_gateway": "sample_payment_gateway",
  "payment_gateway_ref": "sample_payment_gateway_ref",
  "coupon_code": "sample_coupon_code",
  "subtotal": "100000.00",
  "discount_amount": "0.00",
  "shipping_fee": "1000.00",
  "tax_amount": "18000.00",
  "grand_total": "118000.00",
  "shipping_address": "No. 88, Galle Road, Dehiwala, Sri Lanka",
  "is_in_store_pickup": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "fulfillment_branch": 1,
  "customer": 1,
  "ar_invoice": 1
}
```

---

### `GET /api/inventory/ecommerce/orders/{id}/`

- **Endpoint**: `GET /api/inventory/ecommerce/orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/ecommerce/orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "tax_amount": "18000.00",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "order_number": "ORD-2026-0001",
  "status": "PLACED",
  "payment_gateway": "sample_payment_gateway",
  "payment_gateway_ref": "sample_payment_gateway_ref",
  "coupon_code": "sample_coupon_code",
  "subtotal": "100000.00",
  "discount_amount": "0.00",
  "shipping_fee": "1000.00",
  "tax_amount": "18000.00",
  "grand_total": "118000.00",
  "shipping_address": "No. 88, Galle Road, Dehiwala, Sri Lanka",
  "is_in_store_pickup": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "fulfillment_branch": 1,
  "customer": 1,
  "ar_invoice": 1
}
```

---

### `PUT /api/inventory/ecommerce/orders/{id}/`

- **Endpoint**: `PUT /api/inventory/ecommerce/orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/ecommerce/orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "quantity": "10.00",
      "unit_price": "100000.00"
    }
  ],
  "order_number": "ORD-2026-0001",
  "status": "PLACED",
  "payment_gateway": "sample_payment_gateway",
  "payment_gateway_ref": "sample_payment_gateway_ref",
  "coupon_code": "sample_coupon_code",
  "discount_amount": "0.00",
  "shipping_fee": "1000.00",
  "shipping_address": "No. 88, Galle Road, Dehiwala, Sri Lanka",
  "is_in_store_pickup": true,
  "tenant": 1,
  "company": 1,
  "fulfillment_branch": 1,
  "customer": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "tax_amount": "18000.00",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "order_number": "ORD-2026-0001",
  "status": "PLACED",
  "payment_gateway": "sample_payment_gateway",
  "payment_gateway_ref": "sample_payment_gateway_ref",
  "coupon_code": "sample_coupon_code",
  "subtotal": "100000.00",
  "discount_amount": "0.00",
  "shipping_fee": "1000.00",
  "tax_amount": "18000.00",
  "grand_total": "118000.00",
  "shipping_address": "No. 88, Galle Road, Dehiwala, Sri Lanka",
  "is_in_store_pickup": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "fulfillment_branch": 1,
  "customer": 1,
  "ar_invoice": 1
}
```

---

### `PATCH /api/inventory/ecommerce/orders/{id}/`

- **Endpoint**: `PATCH /api/inventory/ecommerce/orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/ecommerce/orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "quantity": "10.00",
      "unit_price": "100000.00"
    }
  ],
  "order_number": "ORD-2026-0001",
  "status": "PLACED",
  "payment_gateway": "sample_payment_gateway",
  "payment_gateway_ref": "sample_payment_gateway_ref",
  "coupon_code": "sample_coupon_code",
  "discount_amount": "0.00",
  "shipping_fee": "1000.00",
  "shipping_address": "No. 88, Galle Road, Dehiwala, Sri Lanka",
  "is_in_store_pickup": true,
  "tenant": 1,
  "company": 1,
  "fulfillment_branch": 1,
  "customer": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "tax_amount": "18000.00",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "order_number": "ORD-2026-0001",
  "status": "PLACED",
  "payment_gateway": "sample_payment_gateway",
  "payment_gateway_ref": "sample_payment_gateway_ref",
  "coupon_code": "sample_coupon_code",
  "subtotal": "100000.00",
  "discount_amount": "0.00",
  "shipping_fee": "1000.00",
  "tax_amount": "18000.00",
  "grand_total": "118000.00",
  "shipping_address": "No. 88, Galle Road, Dehiwala, Sri Lanka",
  "is_in_store_pickup": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "fulfillment_branch": 1,
  "customer": 1,
  "ar_invoice": 1
}
```

---

### `DELETE /api/inventory/ecommerce/orders/{id}/`

- **Endpoint**: `DELETE /api/inventory/ecommerce/orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/ecommerce/orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/ecommerce/orders/{id}/process-return/`

- **Endpoint**: `POST /api/inventory/ecommerce/orders/{id}/process-return/`
- **Summary**: Process E-Commerce Return Request (Restocks Warehouse & Issues Credit Note - ERP-ECOM-006)

#### Example Request

```http
POST /api/inventory/ecommerce/orders/{id}/process-return/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "quantity": "10.00",
      "unit_price": "100000.00"
    }
  ],
  "order_number": "ORD-2026-0001",
  "status": "PLACED",
  "payment_gateway": "sample_payment_gateway",
  "payment_gateway_ref": "sample_payment_gateway_ref",
  "coupon_code": "sample_coupon_code",
  "discount_amount": "0.00",
  "shipping_fee": "1000.00",
  "shipping_address": "No. 88, Galle Road, Dehiwala, Sri Lanka",
  "is_in_store_pickup": true,
  "tenant": 1,
  "company": 1,
  "fulfillment_branch": 1,
  "customer": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "quantity": "10.00",
      "unit_price": "100000.00",
      "tax_amount": "18000.00",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "order_number": "ORD-2026-0001",
  "status": "PLACED",
  "payment_gateway": "sample_payment_gateway",
  "payment_gateway_ref": "sample_payment_gateway_ref",
  "coupon_code": "sample_coupon_code",
  "subtotal": "100000.00",
  "discount_amount": "0.00",
  "shipping_fee": "1000.00",
  "tax_amount": "18000.00",
  "grand_total": "118000.00",
  "shipping_address": "No. 88, Galle Road, Dehiwala, Sri Lanka",
  "is_in_store_pickup": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "fulfillment_branch": 1,
  "customer": 1,
  "ar_invoice": 1
}
```

---

## 12. Advanced Inventory, Hierarchical Storage, Procurement, BOM, QC, Cycle Counts, Cold-Chain & MRP (STK-01 to STK-45)

### `GET /api/inventory/analytics/`

- **Endpoint**: `GET /api/inventory/analytics/`
- **Summary**: Inventory Valuation, ABC/XYZ & Dead Stock, Multi-Company Consolidation, and Fleet TCO / Utilization KPIs

#### Example Request

```http
GET /api/inventory/analytics/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "key": "value"
}
```

---

### `POST /api/inventory/analytics/`

- **Endpoint**: `POST /api/inventory/analytics/`
- **Summary**: Run ABC / XYZ Inventory Classification & Dead Stock Identification (STK-20)

#### Example Request

```http
POST /api/inventory/analytics/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "key": "value"
}
```

#### Example Response (`200 OK`)

```json
{
  "key": "value"
}
```

---

### `GET /api/inventory/batch-serials/`

- **Endpoint**: `GET /api/inventory/batch-serials/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/batch-serials/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "product_sku": "string",
      "batch_number": "BATCH-2026-11A",
      "serial_number": "SN-LP14-000991",
      "pallet_qr_code": "PALLET-QR-2026-100",
      "initial_quantity": "string",
      "quantity": "10.00",
      "unit_cost": "180000.00",
      "expiry_date": "string",
      "warranty_months": "string",
      "is_temperature_breached": "string",
      "sales_order_reference": "string",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "branch": 1,
      "bin_location": "string",
      "product": "string",
      "delivered_to_customer": "string"
    }
  ]
}
```

---

### `POST /api/inventory/batch-serials/`

- **Endpoint**: `POST /api/inventory/batch-serials/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/batch-serials/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "batch_number": "BATCH-2026-11A",
  "serial_number": "SN-LP14-000991",
  "pallet_qr_code": "PALLET-QR-2026-100",
  "initial_quantity": "1000.00",
  "quantity": "10.00",
  "unit_cost": "180000.00",
  "expiry_date": "2026-11-23",
  "warranty_months": 1,
  "is_temperature_breached": true,
  "sales_order_reference": "sample_sales_order_reference",
  "status": "IN_STOCK",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1,
  "delivered_to_customer": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "batch_number": "BATCH-2026-11A",
  "serial_number": "SN-LP14-000991",
  "pallet_qr_code": "PALLET-QR-2026-100",
  "initial_quantity": "1000.00",
  "quantity": "10.00",
  "unit_cost": "180000.00",
  "expiry_date": "2026-11-23",
  "warranty_months": 1,
  "is_temperature_breached": true,
  "sales_order_reference": "sample_sales_order_reference",
  "status": "IN_STOCK",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1,
  "delivered_to_customer": 1
}
```

---

### `GET /api/inventory/batch-serials/expiry-alerts/`

- **Endpoint**: `GET /api/inventory/batch-serials/expiry-alerts/`
- **Summary**: Get Batch Expiration Alerts within 60 days (STK-21, STK-40)

#### Example Request

```http
GET /api/inventory/batch-serials/expiry-alerts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "batch_number": "BATCH-2026-11A",
  "serial_number": "SN-LP14-000991",
  "pallet_qr_code": "PALLET-QR-2026-100",
  "initial_quantity": "1000.00",
  "quantity": "10.00",
  "unit_cost": "180000.00",
  "expiry_date": "2026-11-23",
  "warranty_months": 1,
  "is_temperature_breached": true,
  "sales_order_reference": "sample_sales_order_reference",
  "status": "IN_STOCK",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1,
  "delivered_to_customer": 1
}
```

---

### `GET /api/inventory/batch-serials/trace/`

- **Endpoint**: `GET /api/inventory/batch-serials/trace/`
- **Summary**: Trace a Serial Number or Batch across all warehouse movements and customer sales (STK-21)

#### Example Request

```http
GET /api/inventory/batch-serials/trace/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "batch_number": "BATCH-2026-11A",
  "serial_number": "SN-LP14-000991",
  "pallet_qr_code": "PALLET-QR-2026-100",
  "initial_quantity": "1000.00",
  "quantity": "10.00",
  "unit_cost": "180000.00",
  "expiry_date": "2026-11-23",
  "warranty_months": 1,
  "is_temperature_breached": true,
  "sales_order_reference": "sample_sales_order_reference",
  "status": "IN_STOCK",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1,
  "delivered_to_customer": 1
}
```

---

### `GET /api/inventory/batch-serials/{id}/`

- **Endpoint**: `GET /api/inventory/batch-serials/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/batch-serials/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "batch_number": "BATCH-2026-11A",
  "serial_number": "SN-LP14-000991",
  "pallet_qr_code": "PALLET-QR-2026-100",
  "initial_quantity": "1000.00",
  "quantity": "10.00",
  "unit_cost": "180000.00",
  "expiry_date": "2026-11-23",
  "warranty_months": 1,
  "is_temperature_breached": true,
  "sales_order_reference": "sample_sales_order_reference",
  "status": "IN_STOCK",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1,
  "delivered_to_customer": 1
}
```

---

### `PUT /api/inventory/batch-serials/{id}/`

- **Endpoint**: `PUT /api/inventory/batch-serials/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/batch-serials/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "batch_number": "BATCH-2026-11A",
  "serial_number": "SN-LP14-000991",
  "pallet_qr_code": "PALLET-QR-2026-100",
  "initial_quantity": "1000.00",
  "quantity": "10.00",
  "unit_cost": "180000.00",
  "expiry_date": "2026-11-23",
  "warranty_months": 1,
  "is_temperature_breached": true,
  "sales_order_reference": "sample_sales_order_reference",
  "status": "IN_STOCK",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1,
  "delivered_to_customer": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "batch_number": "BATCH-2026-11A",
  "serial_number": "SN-LP14-000991",
  "pallet_qr_code": "PALLET-QR-2026-100",
  "initial_quantity": "1000.00",
  "quantity": "10.00",
  "unit_cost": "180000.00",
  "expiry_date": "2026-11-23",
  "warranty_months": 1,
  "is_temperature_breached": true,
  "sales_order_reference": "sample_sales_order_reference",
  "status": "IN_STOCK",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1,
  "delivered_to_customer": 1
}
```

---

### `PATCH /api/inventory/batch-serials/{id}/`

- **Endpoint**: `PATCH /api/inventory/batch-serials/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/batch-serials/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "batch_number": "BATCH-2026-11A",
  "serial_number": "SN-LP14-000991",
  "pallet_qr_code": "PALLET-QR-2026-100",
  "initial_quantity": "1000.00",
  "quantity": "10.00",
  "unit_cost": "180000.00",
  "expiry_date": "2026-11-23",
  "warranty_months": 1,
  "is_temperature_breached": true,
  "sales_order_reference": "sample_sales_order_reference",
  "status": "IN_STOCK",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1,
  "delivered_to_customer": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "batch_number": "BATCH-2026-11A",
  "serial_number": "SN-LP14-000991",
  "pallet_qr_code": "PALLET-QR-2026-100",
  "initial_quantity": "1000.00",
  "quantity": "10.00",
  "unit_cost": "180000.00",
  "expiry_date": "2026-11-23",
  "warranty_months": 1,
  "is_temperature_breached": true,
  "sales_order_reference": "sample_sales_order_reference",
  "status": "IN_STOCK",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1,
  "delivered_to_customer": 1
}
```

---

### `DELETE /api/inventory/batch-serials/{id}/`

- **Endpoint**: `DELETE /api/inventory/batch-serials/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/batch-serials/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/boms/`

- **Endpoint**: `GET /api/inventory/boms/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/boms/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "tenant": 1,
      "finished_product": "string",
      "finished_product_sku": "string",
      "code": "CMB-01",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "output_quantity": "string",
      "is_active": "string",
      "created_at": "string",
      "components": "string"
    }
  ]
}
```

---

### `POST /api/inventory/boms/`

- **Endpoint**: `POST /api/inventory/boms/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/boms/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "finished_product": 1,
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "output_quantity": "1000.00",
  "is_active": true,
  "components": [
    {
      "component_product": "string",
      "sub_bom": "string",
      "quantity_required": "string",
      "scrap_factor_percent": "string"
    }
  ]
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "tenant": 1,
  "finished_product": 1,
  "finished_product_sku": "sample_finished_product_sku",
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "output_quantity": "1000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "components": [
    {
      "id": 1,
      "component_product": "string",
      "component_sku": "string",
      "sub_bom": "string",
      "quantity_required": "string",
      "scrap_factor_percent": "string"
    }
  ]
}
```

---

### `GET /api/inventory/boms/{id}/`

- **Endpoint**: `GET /api/inventory/boms/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/boms/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "tenant": 1,
  "finished_product": 1,
  "finished_product_sku": "sample_finished_product_sku",
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "output_quantity": "1000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "components": [
    {
      "id": 1,
      "component_product": "string",
      "component_sku": "string",
      "sub_bom": "string",
      "quantity_required": "string",
      "scrap_factor_percent": "string"
    }
  ]
}
```

---

### `PUT /api/inventory/boms/{id}/`

- **Endpoint**: `PUT /api/inventory/boms/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/boms/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "finished_product": 1,
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "output_quantity": "1000.00",
  "is_active": true,
  "components": [
    {
      "component_product": "string",
      "sub_bom": "string",
      "quantity_required": "string",
      "scrap_factor_percent": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "tenant": 1,
  "finished_product": 1,
  "finished_product_sku": "sample_finished_product_sku",
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "output_quantity": "1000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "components": [
    {
      "id": 1,
      "component_product": "string",
      "component_sku": "string",
      "sub_bom": "string",
      "quantity_required": "string",
      "scrap_factor_percent": "string"
    }
  ]
}
```

---

### `PATCH /api/inventory/boms/{id}/`

- **Endpoint**: `PATCH /api/inventory/boms/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/boms/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "tenant": 1,
  "finished_product": 1,
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "output_quantity": "1000.00",
  "is_active": true,
  "components": [
    {
      "component_product": "string",
      "sub_bom": "string",
      "quantity_required": "string",
      "scrap_factor_percent": "string"
    }
  ]
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "tenant": 1,
  "finished_product": 1,
  "finished_product_sku": "sample_finished_product_sku",
  "code": "CMB-01",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "output_quantity": "1000.00",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "components": [
    {
      "id": 1,
      "component_product": "string",
      "component_sku": "string",
      "sub_bom": "string",
      "quantity_required": "string",
      "scrap_factor_percent": "string"
    }
  ]
}
```

---

### `DELETE /api/inventory/boms/{id}/`

- **Endpoint**: `DELETE /api/inventory/boms/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/boms/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/categories/`

- **Endpoint**: `GET /api/inventory/categories/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/categories/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "name": "Devrious Retail Group (Pvt) Ltd",
      "slug": "devrious-retail-group",
      "is_active": "string",
      "tenant": 1,
      "parent": "string"
    }
  ]
}
```

---

### `POST /api/inventory/categories/`

- **Endpoint**: `POST /api/inventory/categories/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/categories/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "is_active": true,
  "tenant": 1,
  "parent": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "is_active": true,
  "tenant": 1,
  "parent": 1
}
```

---

### `GET /api/inventory/categories/{id}/`

- **Endpoint**: `GET /api/inventory/categories/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/categories/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "is_active": true,
  "tenant": 1,
  "parent": 1
}
```

---

### `PUT /api/inventory/categories/{id}/`

- **Endpoint**: `PUT /api/inventory/categories/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/categories/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "is_active": true,
  "tenant": 1,
  "parent": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "is_active": true,
  "tenant": 1,
  "parent": 1
}
```

---

### `PATCH /api/inventory/categories/{id}/`

- **Endpoint**: `PATCH /api/inventory/categories/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/categories/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "is_active": true,
  "tenant": 1,
  "parent": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "slug": "devrious-retail-group",
  "is_active": true,
  "tenant": 1,
  "parent": 1
}
```

---

### `DELETE /api/inventory/categories/{id}/`

- **Endpoint**: `DELETE /api/inventory/categories/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/categories/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/cycle-counts/`

- **Endpoint**: `GET /api/inventory/cycle-counts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/cycle-counts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "items": "string",
      "session_number": "CC-2026-0001",
      "abc_filter": "string",
      "is_offline_synced": "string",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "bin_location": "string",
      "counted_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/cycle-counts/`

- **Endpoint**: `POST /api/inventory/cycle-counts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/cycle-counts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "items": [
    {
      "product": "string",
      "counted_quantity": "string",
      "reason": "Policy compliance / administrative action"
    }
  ],
  "session_number": "CC-2026-0001",
  "abc_filter": "sample_abc_filter",
  "is_offline_synced": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bin_location": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "items": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "system_quantity": "string",
      "counted_quantity": "string",
      "variance": "string",
      "variance_category": "string",
      "reason": "Policy compliance / administrative action"
    }
  ],
  "session_number": "CC-2026-0001",
  "abc_filter": "sample_abc_filter",
  "is_offline_synced": true,
  "status": "SCHEDULED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bin_location": 1,
  "counted_by": 1
}
```

---

### `GET /api/inventory/cycle-counts/{id}/`

- **Endpoint**: `GET /api/inventory/cycle-counts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/cycle-counts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "items": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "system_quantity": "string",
      "counted_quantity": "string",
      "variance": "string",
      "variance_category": "string",
      "reason": "Policy compliance / administrative action"
    }
  ],
  "session_number": "CC-2026-0001",
  "abc_filter": "sample_abc_filter",
  "is_offline_synced": true,
  "status": "SCHEDULED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bin_location": 1,
  "counted_by": 1
}
```

---

### `PUT /api/inventory/cycle-counts/{id}/`

- **Endpoint**: `PUT /api/inventory/cycle-counts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/cycle-counts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "items": [
    {
      "product": "string",
      "counted_quantity": "string",
      "reason": "Policy compliance / administrative action"
    }
  ],
  "session_number": "CC-2026-0001",
  "abc_filter": "sample_abc_filter",
  "is_offline_synced": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bin_location": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "items": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "system_quantity": "string",
      "counted_quantity": "string",
      "variance": "string",
      "variance_category": "string",
      "reason": "Policy compliance / administrative action"
    }
  ],
  "session_number": "CC-2026-0001",
  "abc_filter": "sample_abc_filter",
  "is_offline_synced": true,
  "status": "SCHEDULED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bin_location": 1,
  "counted_by": 1
}
```

---

### `PATCH /api/inventory/cycle-counts/{id}/`

- **Endpoint**: `PATCH /api/inventory/cycle-counts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/cycle-counts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "items": [
    {
      "product": "string",
      "counted_quantity": "string",
      "reason": "Policy compliance / administrative action"
    }
  ],
  "session_number": "CC-2026-0001",
  "abc_filter": "sample_abc_filter",
  "is_offline_synced": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bin_location": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "items": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "system_quantity": "string",
      "counted_quantity": "string",
      "variance": "string",
      "variance_category": "string",
      "reason": "Policy compliance / administrative action"
    }
  ],
  "session_number": "CC-2026-0001",
  "abc_filter": "sample_abc_filter",
  "is_offline_synced": true,
  "status": "SCHEDULED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bin_location": 1,
  "counted_by": 1
}
```

---

### `DELETE /api/inventory/cycle-counts/{id}/`

- **Endpoint**: `DELETE /api/inventory/cycle-counts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/cycle-counts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/cycle-counts/{id}/reconcile/`

- **Endpoint**: `POST /api/inventory/cycle-counts/{id}/reconcile/`
- **Summary**: Reconcile Cycle Count Variances & Update On-Hand Inventory (STK-19)

#### Example Request

```http
POST /api/inventory/cycle-counts/{id}/reconcile/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "items": [
    {
      "product": "string",
      "counted_quantity": "string",
      "reason": "Policy compliance / administrative action"
    }
  ],
  "session_number": "CC-2026-0001",
  "abc_filter": "sample_abc_filter",
  "is_offline_synced": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bin_location": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "items": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "system_quantity": "string",
      "counted_quantity": "string",
      "variance": "string",
      "variance_category": "string",
      "reason": "Policy compliance / administrative action"
    }
  ],
  "session_number": "CC-2026-0001",
  "abc_filter": "sample_abc_filter",
  "is_offline_synced": true,
  "status": "SCHEDULED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bin_location": 1,
  "counted_by": 1
}
```

---

### `GET /api/inventory/forecasts/`

- **Endpoint**: `GET /api/inventory/forecasts/`
- **Summary**: Demand Forecasting based on historical sales movements and seasonality (STK-35).

#### Example Request

```http
GET /api/inventory/forecasts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "forecast_period": "string",
      "historical_period_sales": "string",
      "seasonality_factor": "string",
      "forecasted_demand_qty": "string",
      "recommended_safety_stock": "string",
      "recommended_reorder_point": "string",
      "generated_at": "string",
      "tenant": 1,
      "branch": 1,
      "product": "string"
    }
  ]
}
```

---

### `POST /api/inventory/forecasts/`

- **Endpoint**: `POST /api/inventory/forecasts/`
- **Summary**: Demand Forecasting based on historical sales movements and seasonality (STK-35).

#### Example Request

```http
POST /api/inventory/forecasts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "forecast_period": "sample_forecast_period",
  "historical_period_sales": "1000.00",
  "seasonality_factor": "1000.00",
  "forecasted_demand_qty": "1000.00",
  "recommended_safety_stock": "1000.00",
  "recommended_reorder_point": "1000.00",
  "tenant": 1,
  "branch": 1,
  "product": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "forecast_period": "sample_forecast_period",
  "historical_period_sales": "1000.00",
  "seasonality_factor": "1000.00",
  "forecasted_demand_qty": "1000.00",
  "recommended_safety_stock": "1000.00",
  "recommended_reorder_point": "1000.00",
  "generated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "product": 1
}
```

---

### `POST /api/inventory/forecasts/generate/`

- **Endpoint**: `POST /api/inventory/forecasts/generate/`
- **Summary**: Generate Demand Forecast for Next Quarter from Historical Sales (STK-35)

#### Example Request

```http
POST /api/inventory/forecasts/generate/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "forecast_period": "sample_forecast_period",
  "historical_period_sales": "1000.00",
  "seasonality_factor": "1000.00",
  "forecasted_demand_qty": "1000.00",
  "recommended_safety_stock": "1000.00",
  "recommended_reorder_point": "1000.00",
  "tenant": 1,
  "branch": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "forecast_period": "sample_forecast_period",
  "historical_period_sales": "1000.00",
  "seasonality_factor": "1000.00",
  "forecasted_demand_qty": "1000.00",
  "recommended_safety_stock": "1000.00",
  "recommended_reorder_point": "1000.00",
  "generated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "product": 1
}
```

---

### `GET /api/inventory/forecasts/{id}/`

- **Endpoint**: `GET /api/inventory/forecasts/{id}/`
- **Summary**: Demand Forecasting based on historical sales movements and seasonality (STK-35).

#### Example Request

```http
GET /api/inventory/forecasts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "forecast_period": "sample_forecast_period",
  "historical_period_sales": "1000.00",
  "seasonality_factor": "1000.00",
  "forecasted_demand_qty": "1000.00",
  "recommended_safety_stock": "1000.00",
  "recommended_reorder_point": "1000.00",
  "generated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "product": 1
}
```

---

### `PUT /api/inventory/forecasts/{id}/`

- **Endpoint**: `PUT /api/inventory/forecasts/{id}/`
- **Summary**: Demand Forecasting based on historical sales movements and seasonality (STK-35).

#### Example Request

```http
PUT /api/inventory/forecasts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "forecast_period": "sample_forecast_period",
  "historical_period_sales": "1000.00",
  "seasonality_factor": "1000.00",
  "forecasted_demand_qty": "1000.00",
  "recommended_safety_stock": "1000.00",
  "recommended_reorder_point": "1000.00",
  "tenant": 1,
  "branch": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "forecast_period": "sample_forecast_period",
  "historical_period_sales": "1000.00",
  "seasonality_factor": "1000.00",
  "forecasted_demand_qty": "1000.00",
  "recommended_safety_stock": "1000.00",
  "recommended_reorder_point": "1000.00",
  "generated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "product": 1
}
```

---

### `PATCH /api/inventory/forecasts/{id}/`

- **Endpoint**: `PATCH /api/inventory/forecasts/{id}/`
- **Summary**: Demand Forecasting based on historical sales movements and seasonality (STK-35).

#### Example Request

```http
PATCH /api/inventory/forecasts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "forecast_period": "sample_forecast_period",
  "historical_period_sales": "1000.00",
  "seasonality_factor": "1000.00",
  "forecasted_demand_qty": "1000.00",
  "recommended_safety_stock": "1000.00",
  "recommended_reorder_point": "1000.00",
  "tenant": 1,
  "branch": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "forecast_period": "sample_forecast_period",
  "historical_period_sales": "1000.00",
  "seasonality_factor": "1000.00",
  "forecasted_demand_qty": "1000.00",
  "recommended_safety_stock": "1000.00",
  "recommended_reorder_point": "1000.00",
  "generated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "product": 1
}
```

---

### `DELETE /api/inventory/forecasts/{id}/`

- **Endpoint**: `DELETE /api/inventory/forecasts/{id}/`
- **Summary**: Demand Forecasting based on historical sales movements and seasonality (STK-35).

#### Example Request

```http
DELETE /api/inventory/forecasts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/goods-receipts/`

- **Endpoint**: `GET /api/inventory/goods-receipts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/goods-receipts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "lines": "string",
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "grn_number": "GRN-2026-0001",
      "received_date": "string",
      "is_consignment_receipt": "string",
      "place_in_quarantine": "string",
      "status": "string",
      "total_cost": "1800000.00",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "supplier": "string",
      "purchase_order": "string",
      "journal_entry": "string",
      "generated_vendor_bill": "string",
      "received_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/goods-receipts/`

- **Endpoint**: `POST /api/inventory/goods-receipts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/goods-receipts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "po_line": "string",
      "uom_code": "BOX",
      "received_quantity": "10.00",
      "unit_cost": "180000.00",
      "batch_number": "BATCH-2026-11A",
      "serial_number": "SN-LP14-000991",
      "pallet_qr_code": "PALLET-QR-2026-100",
      "expiry_date": "string",
      "is_cross_dock": "string"
    }
  ],
  "grn_number": "GRN-2026-0001",
  "received_date": "2026-11-23",
  "is_consignment_receipt": true,
  "place_in_quarantine": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "purchase_order": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "po_line": "string",
      "uom_code": "BOX",
      "received_quantity": "10.00",
      "unit_cost": "180000.00",
      "batch_number": "BATCH-2026-11A",
      "serial_number": "SN-LP14-000991",
      "pallet_qr_code": "PALLET-QR-2026-100",
      "expiry_date": "string",
      "is_cross_dock": "string",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "grn_number": "GRN-2026-0001",
  "received_date": "2026-11-23",
  "is_consignment_receipt": true,
  "place_in_quarantine": true,
  "status": "DRAFT",
  "total_cost": "1800000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "purchase_order": 1,
  "journal_entry": 1,
  "generated_vendor_bill": 1,
  "received_by": 1
}
```

---

### `GET /api/inventory/goods-receipts/{id}/`

- **Endpoint**: `GET /api/inventory/goods-receipts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/goods-receipts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "po_line": "string",
      "uom_code": "BOX",
      "received_quantity": "10.00",
      "unit_cost": "180000.00",
      "batch_number": "BATCH-2026-11A",
      "serial_number": "SN-LP14-000991",
      "pallet_qr_code": "PALLET-QR-2026-100",
      "expiry_date": "string",
      "is_cross_dock": "string",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "grn_number": "GRN-2026-0001",
  "received_date": "2026-11-23",
  "is_consignment_receipt": true,
  "place_in_quarantine": true,
  "status": "DRAFT",
  "total_cost": "1800000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "purchase_order": 1,
  "journal_entry": 1,
  "generated_vendor_bill": 1,
  "received_by": 1
}
```

---

### `PUT /api/inventory/goods-receipts/{id}/`

- **Endpoint**: `PUT /api/inventory/goods-receipts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/goods-receipts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "po_line": "string",
      "uom_code": "BOX",
      "received_quantity": "10.00",
      "unit_cost": "180000.00",
      "batch_number": "BATCH-2026-11A",
      "serial_number": "SN-LP14-000991",
      "pallet_qr_code": "PALLET-QR-2026-100",
      "expiry_date": "string",
      "is_cross_dock": "string"
    }
  ],
  "grn_number": "GRN-2026-0001",
  "received_date": "2026-11-23",
  "is_consignment_receipt": true,
  "place_in_quarantine": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "purchase_order": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "po_line": "string",
      "uom_code": "BOX",
      "received_quantity": "10.00",
      "unit_cost": "180000.00",
      "batch_number": "BATCH-2026-11A",
      "serial_number": "SN-LP14-000991",
      "pallet_qr_code": "PALLET-QR-2026-100",
      "expiry_date": "string",
      "is_cross_dock": "string",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "grn_number": "GRN-2026-0001",
  "received_date": "2026-11-23",
  "is_consignment_receipt": true,
  "place_in_quarantine": true,
  "status": "DRAFT",
  "total_cost": "1800000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "purchase_order": 1,
  "journal_entry": 1,
  "generated_vendor_bill": 1,
  "received_by": 1
}
```

---

### `PATCH /api/inventory/goods-receipts/{id}/`

- **Endpoint**: `PATCH /api/inventory/goods-receipts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/goods-receipts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "po_line": "string",
      "uom_code": "BOX",
      "received_quantity": "10.00",
      "unit_cost": "180000.00",
      "batch_number": "BATCH-2026-11A",
      "serial_number": "SN-LP14-000991",
      "pallet_qr_code": "PALLET-QR-2026-100",
      "expiry_date": "string",
      "is_cross_dock": "string"
    }
  ],
  "grn_number": "GRN-2026-0001",
  "received_date": "2026-11-23",
  "is_consignment_receipt": true,
  "place_in_quarantine": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "purchase_order": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "po_line": "string",
      "uom_code": "BOX",
      "received_quantity": "10.00",
      "unit_cost": "180000.00",
      "batch_number": "BATCH-2026-11A",
      "serial_number": "SN-LP14-000991",
      "pallet_qr_code": "PALLET-QR-2026-100",
      "expiry_date": "string",
      "is_cross_dock": "string",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "grn_number": "GRN-2026-0001",
  "received_date": "2026-11-23",
  "is_consignment_receipt": true,
  "place_in_quarantine": true,
  "status": "DRAFT",
  "total_cost": "1800000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "purchase_order": 1,
  "journal_entry": 1,
  "generated_vendor_bill": 1,
  "received_by": 1
}
```

---

### `DELETE /api/inventory/goods-receipts/{id}/`

- **Endpoint**: `DELETE /api/inventory/goods-receipts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/goods-receipts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/goods-receipts/{id}/post_grn/`

- **Endpoint**: `POST /api/inventory/goods-receipts/{id}/post_grn/`
- **Summary**: Post a Draft Goods Receipt Note to Inventory and Finance GL

#### Example Request

```http
POST /api/inventory/goods-receipts/{id}/post_grn/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "po_line": "string",
      "uom_code": "BOX",
      "received_quantity": "10.00",
      "unit_cost": "180000.00",
      "batch_number": "BATCH-2026-11A",
      "serial_number": "SN-LP14-000991",
      "pallet_qr_code": "PALLET-QR-2026-100",
      "expiry_date": "string",
      "is_cross_dock": "string"
    }
  ],
  "grn_number": "GRN-2026-0001",
  "received_date": "2026-11-23",
  "is_consignment_receipt": true,
  "place_in_quarantine": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "purchase_order": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "po_line": "string",
      "uom_code": "BOX",
      "received_quantity": "10.00",
      "unit_cost": "180000.00",
      "batch_number": "BATCH-2026-11A",
      "serial_number": "SN-LP14-000991",
      "pallet_qr_code": "PALLET-QR-2026-100",
      "expiry_date": "string",
      "is_cross_dock": "string",
      "line_total": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "grn_number": "GRN-2026-0001",
  "received_date": "2026-11-23",
  "is_consignment_receipt": true,
  "place_in_quarantine": true,
  "status": "DRAFT",
  "total_cost": "1800000.00",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "purchase_order": 1,
  "journal_entry": 1,
  "generated_vendor_bill": 1,
  "received_by": 1
}
```

---

### `GET /api/inventory/locations/`

- **Endpoint**: `GET /api/inventory/locations/`
- **Summary**: Hierarchical Storage Model: Region -> Sub-Region -> Regional Store Room -> Branch -> Warehouse -> Zone -> Aisle -> Rack -> Shelf -> Bin (STK-09, STK-10, STK-11, STK-24).

#### Example Request

```http
GET /api/inventory/locations/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "full_path": "W > Aisle 1 > Shelf A > Bin B",
      "effective_lead_time_days": "string",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "code": "CMB-01",
      "barcode_qr": "LOC-W-A1-SA-BINB",
      "location_type": "string",
      "bin_type": "string",
      "default_lead_time_days": "string",
      "max_capacity_units": "string",
      "is_temperature_controlled": "string",
      "min_temp_celsius": "string",
      "max_temp_celsius": "string",
      "allows_hazardous": "string",
      "is_active": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "parent": "string",
      "region_manager": "string"
    }
  ]
}
```

---

### `POST /api/inventory/locations/`

- **Endpoint**: `POST /api/inventory/locations/`
- **Summary**: Hierarchical Storage Model: Region -> Sub-Region -> Regional Store Room -> Branch -> Warehouse -> Zone -> Aisle -> Rack -> Shelf -> Bin (STK-09, STK-10, STK-11, STK-24).

#### Example Request

```http
POST /api/inventory/locations/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "barcode_qr": "LOC-W-A1-SA-BINB",
  "location_type": "REGION",
  "bin_type": "STANDARD_SHELF",
  "default_lead_time_days": 1,
  "max_capacity_units": "1000.00",
  "is_temperature_controlled": true,
  "min_temp_celsius": "1000.00",
  "max_temp_celsius": "1000.00",
  "allows_hazardous": true,
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "parent": 1,
  "region_manager": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "full_path": "W > Aisle 1 > Shelf A > Bin B",
  "effective_lead_time_days": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "barcode_qr": "LOC-W-A1-SA-BINB",
  "location_type": "REGION",
  "bin_type": "STANDARD_SHELF",
  "default_lead_time_days": 1,
  "max_capacity_units": "1000.00",
  "is_temperature_controlled": true,
  "min_temp_celsius": "1000.00",
  "max_temp_celsius": "1000.00",
  "allows_hazardous": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "parent": 1,
  "region_manager": 1
}
```

---

### `GET /api/inventory/locations/{id}/`

- **Endpoint**: `GET /api/inventory/locations/{id}/`
- **Summary**: Hierarchical Storage Model: Region -> Sub-Region -> Regional Store Room -> Branch -> Warehouse -> Zone -> Aisle -> Rack -> Shelf -> Bin (STK-09, STK-10, STK-11, STK-24).

#### Example Request

```http
GET /api/inventory/locations/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "full_path": "W > Aisle 1 > Shelf A > Bin B",
  "effective_lead_time_days": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "barcode_qr": "LOC-W-A1-SA-BINB",
  "location_type": "REGION",
  "bin_type": "STANDARD_SHELF",
  "default_lead_time_days": 1,
  "max_capacity_units": "1000.00",
  "is_temperature_controlled": true,
  "min_temp_celsius": "1000.00",
  "max_temp_celsius": "1000.00",
  "allows_hazardous": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "parent": 1,
  "region_manager": 1
}
```

---

### `PUT /api/inventory/locations/{id}/`

- **Endpoint**: `PUT /api/inventory/locations/{id}/`
- **Summary**: Hierarchical Storage Model: Region -> Sub-Region -> Regional Store Room -> Branch -> Warehouse -> Zone -> Aisle -> Rack -> Shelf -> Bin (STK-09, STK-10, STK-11, STK-24).

#### Example Request

```http
PUT /api/inventory/locations/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "barcode_qr": "LOC-W-A1-SA-BINB",
  "location_type": "REGION",
  "bin_type": "STANDARD_SHELF",
  "default_lead_time_days": 1,
  "max_capacity_units": "1000.00",
  "is_temperature_controlled": true,
  "min_temp_celsius": "1000.00",
  "max_temp_celsius": "1000.00",
  "allows_hazardous": true,
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "parent": 1,
  "region_manager": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "full_path": "W > Aisle 1 > Shelf A > Bin B",
  "effective_lead_time_days": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "barcode_qr": "LOC-W-A1-SA-BINB",
  "location_type": "REGION",
  "bin_type": "STANDARD_SHELF",
  "default_lead_time_days": 1,
  "max_capacity_units": "1000.00",
  "is_temperature_controlled": true,
  "min_temp_celsius": "1000.00",
  "max_temp_celsius": "1000.00",
  "allows_hazardous": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "parent": 1,
  "region_manager": 1
}
```

---

### `PATCH /api/inventory/locations/{id}/`

- **Endpoint**: `PATCH /api/inventory/locations/{id}/`
- **Summary**: Hierarchical Storage Model: Region -> Sub-Region -> Regional Store Room -> Branch -> Warehouse -> Zone -> Aisle -> Rack -> Shelf -> Bin (STK-09, STK-10, STK-11, STK-24).

#### Example Request

```http
PATCH /api/inventory/locations/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "barcode_qr": "LOC-W-A1-SA-BINB",
  "location_type": "REGION",
  "bin_type": "STANDARD_SHELF",
  "default_lead_time_days": 1,
  "max_capacity_units": "1000.00",
  "is_temperature_controlled": true,
  "min_temp_celsius": "1000.00",
  "max_temp_celsius": "1000.00",
  "allows_hazardous": true,
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "parent": 1,
  "region_manager": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "full_path": "W > Aisle 1 > Shelf A > Bin B",
  "effective_lead_time_days": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "barcode_qr": "LOC-W-A1-SA-BINB",
  "location_type": "REGION",
  "bin_type": "STANDARD_SHELF",
  "default_lead_time_days": 1,
  "max_capacity_units": "1000.00",
  "is_temperature_controlled": true,
  "min_temp_celsius": "1000.00",
  "max_temp_celsius": "1000.00",
  "allows_hazardous": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "parent": 1,
  "region_manager": 1
}
```

---

### `DELETE /api/inventory/locations/{id}/`

- **Endpoint**: `DELETE /api/inventory/locations/{id}/`
- **Summary**: Hierarchical Storage Model: Region -> Sub-Region -> Regional Store Room -> Branch -> Warehouse -> Zone -> Aisle -> Rack -> Shelf -> Bin (STK-09, STK-10, STK-11, STK-24).

#### Example Request

```http
DELETE /api/inventory/locations/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/locations/{id}/inherited-items/`

- **Endpoint**: `GET /api/inventory/locations/{id}/inherited-items/`
- **Summary**: Get items visible at this location (including items inherited from parent Region/Sub-Region - STK-09)

#### Example Request

```http
GET /api/inventory/locations/{id}/inherited-items/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "full_path": "W > Aisle 1 > Shelf A > Bin B",
  "effective_lead_time_days": 1,
  "name": "Devrious Retail Group (Pvt) Ltd",
  "code": "CMB-01",
  "barcode_qr": "LOC-W-A1-SA-BINB",
  "location_type": "REGION",
  "bin_type": "STANDARD_SHELF",
  "default_lead_time_days": 1,
  "max_capacity_units": "1000.00",
  "is_temperature_controlled": true,
  "min_temp_celsius": "1000.00",
  "max_temp_celsius": "1000.00",
  "allows_hazardous": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "parent": 1,
  "region_manager": 1
}
```

---

### `GET /api/inventory/mrp-runs/`

- **Endpoint**: `GET /api/inventory/mrp-runs/`
- **Summary**: Material Requirements Planning (MRP / MRP-II) generating dated purchase proposals from BOM, lead times, and stock (STK-34).

#### Example Request

```http
GET /api/inventory/mrp-runs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "run_number": "MRP-2026-0001",
      "planned_production_qty": "100.00",
      "required_by_date": "string",
      "proposals_json": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "target_bom": "string",
      "created_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/mrp-runs/`

- **Endpoint**: `POST /api/inventory/mrp-runs/`
- **Summary**: Material Requirements Planning (MRP / MRP-II) generating dated purchase proposals from BOM, lead times, and stock (STK-34).

#### Example Request

```http
POST /api/inventory/mrp-runs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "run_number": "MRP-2026-0001",
  "planned_production_qty": "100.00",
  "required_by_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "target_bom": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "run_number": "MRP-2026-0001",
  "planned_production_qty": "100.00",
  "required_by_date": "2026-11-23",
  "proposals_json": {
    "key": "value"
  },
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "target_bom": 1,
  "created_by": 1
}
```

---

### `GET /api/inventory/mrp-runs/{id}/`

- **Endpoint**: `GET /api/inventory/mrp-runs/{id}/`
- **Summary**: Material Requirements Planning (MRP / MRP-II) generating dated purchase proposals from BOM, lead times, and stock (STK-34).

#### Example Request

```http
GET /api/inventory/mrp-runs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "run_number": "MRP-2026-0001",
  "planned_production_qty": "100.00",
  "required_by_date": "2026-11-23",
  "proposals_json": {
    "key": "value"
  },
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "target_bom": 1,
  "created_by": 1
}
```

---

### `PUT /api/inventory/mrp-runs/{id}/`

- **Endpoint**: `PUT /api/inventory/mrp-runs/{id}/`
- **Summary**: Material Requirements Planning (MRP / MRP-II) generating dated purchase proposals from BOM, lead times, and stock (STK-34).

#### Example Request

```http
PUT /api/inventory/mrp-runs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "run_number": "MRP-2026-0001",
  "planned_production_qty": "100.00",
  "required_by_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "target_bom": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "run_number": "MRP-2026-0001",
  "planned_production_qty": "100.00",
  "required_by_date": "2026-11-23",
  "proposals_json": {
    "key": "value"
  },
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "target_bom": 1,
  "created_by": 1
}
```

---

### `PATCH /api/inventory/mrp-runs/{id}/`

- **Endpoint**: `PATCH /api/inventory/mrp-runs/{id}/`
- **Summary**: Material Requirements Planning (MRP / MRP-II) generating dated purchase proposals from BOM, lead times, and stock (STK-34).

#### Example Request

```http
PATCH /api/inventory/mrp-runs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "run_number": "MRP-2026-0001",
  "planned_production_qty": "100.00",
  "required_by_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "target_bom": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "run_number": "MRP-2026-0001",
  "planned_production_qty": "100.00",
  "required_by_date": "2026-11-23",
  "proposals_json": {
    "key": "value"
  },
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "target_bom": 1,
  "created_by": 1
}
```

---

### `DELETE /api/inventory/mrp-runs/{id}/`

- **Endpoint**: `DELETE /api/inventory/mrp-runs/{id}/`
- **Summary**: Material Requirements Planning (MRP / MRP-II) generating dated purchase proposals from BOM, lead times, and stock (STK-34).

#### Example Request

```http
DELETE /api/inventory/mrp-runs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/picking-tasks/`

- **Endpoint**: `GET /api/inventory/picking-tasks/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/picking-tasks/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "product_sku": "string",
      "quantity": "10.00",
      "order_reference": "string",
      "is_cross_dock_task": "string",
      "carrier_name": "string",
      "tracking_number": "string",
      "status": "string",
      "picked_at": "string",
      "created_at": "string",
      "tenant": 1,
      "wave": "string",
      "branch": 1,
      "source_bin": "string",
      "product": "string",
      "picked_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/picking-tasks/`

- **Endpoint**: `POST /api/inventory/picking-tasks/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/picking-tasks/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "quantity": "10.00",
  "order_reference": "sample_order_reference",
  "is_cross_dock_task": true,
  "carrier_name": "sample_carrier_name",
  "tracking_number": "sample_tracking_number",
  "status": "PENDING",
  "picked_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "wave": 1,
  "branch": 1,
  "source_bin": 1,
  "product": 1,
  "picked_by": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "quantity": "10.00",
  "order_reference": "sample_order_reference",
  "is_cross_dock_task": true,
  "carrier_name": "sample_carrier_name",
  "tracking_number": "sample_tracking_number",
  "status": "PENDING",
  "picked_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "wave": 1,
  "branch": 1,
  "source_bin": 1,
  "product": 1,
  "picked_by": 1
}
```

---

### `GET /api/inventory/picking-tasks/{id}/`

- **Endpoint**: `GET /api/inventory/picking-tasks/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/picking-tasks/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "quantity": "10.00",
  "order_reference": "sample_order_reference",
  "is_cross_dock_task": true,
  "carrier_name": "sample_carrier_name",
  "tracking_number": "sample_tracking_number",
  "status": "PENDING",
  "picked_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "wave": 1,
  "branch": 1,
  "source_bin": 1,
  "product": 1,
  "picked_by": 1
}
```

---

### `PUT /api/inventory/picking-tasks/{id}/`

- **Endpoint**: `PUT /api/inventory/picking-tasks/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/picking-tasks/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "quantity": "10.00",
  "order_reference": "sample_order_reference",
  "is_cross_dock_task": true,
  "carrier_name": "sample_carrier_name",
  "tracking_number": "sample_tracking_number",
  "status": "PENDING",
  "picked_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "wave": 1,
  "branch": 1,
  "source_bin": 1,
  "product": 1,
  "picked_by": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "quantity": "10.00",
  "order_reference": "sample_order_reference",
  "is_cross_dock_task": true,
  "carrier_name": "sample_carrier_name",
  "tracking_number": "sample_tracking_number",
  "status": "PENDING",
  "picked_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "wave": 1,
  "branch": 1,
  "source_bin": 1,
  "product": 1,
  "picked_by": 1
}
```

---

### `PATCH /api/inventory/picking-tasks/{id}/`

- **Endpoint**: `PATCH /api/inventory/picking-tasks/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/picking-tasks/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "quantity": "10.00",
  "order_reference": "sample_order_reference",
  "is_cross_dock_task": true,
  "carrier_name": "sample_carrier_name",
  "tracking_number": "sample_tracking_number",
  "status": "PENDING",
  "picked_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "wave": 1,
  "branch": 1,
  "source_bin": 1,
  "product": 1,
  "picked_by": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "quantity": "10.00",
  "order_reference": "sample_order_reference",
  "is_cross_dock_task": true,
  "carrier_name": "sample_carrier_name",
  "tracking_number": "sample_tracking_number",
  "status": "PENDING",
  "picked_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "wave": 1,
  "branch": 1,
  "source_bin": 1,
  "product": 1,
  "picked_by": 1
}
```

---

### `DELETE /api/inventory/picking-tasks/{id}/`

- **Endpoint**: `DELETE /api/inventory/picking-tasks/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/picking-tasks/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/picking-tasks/{id}/confirm-pick/`

- **Endpoint**: `POST /api/inventory/picking-tasks/{id}/confirm-pick/`
- **Summary**: Validate Pick by Scanning & Pack into Shipment (STK-26)

#### Example Request

```http
POST /api/inventory/picking-tasks/{id}/confirm-pick/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "quantity": "10.00",
  "order_reference": "sample_order_reference",
  "is_cross_dock_task": true,
  "carrier_name": "sample_carrier_name",
  "tracking_number": "sample_tracking_number",
  "status": "PENDING",
  "picked_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "wave": 1,
  "branch": 1,
  "source_bin": 1,
  "product": 1,
  "picked_by": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "quantity": "10.00",
  "order_reference": "sample_order_reference",
  "is_cross_dock_task": true,
  "carrier_name": "sample_carrier_name",
  "tracking_number": "sample_tracking_number",
  "status": "PENDING",
  "picked_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "wave": 1,
  "branch": 1,
  "source_bin": 1,
  "product": 1,
  "picked_by": 1
}
```

---

### `GET /api/inventory/picking-waves/`

- **Endpoint**: `GET /api/inventory/picking-waves/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/picking-waves/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "tasks": "string",
      "wave_number": "WAVE-2026-0001",
      "target_region_or_route": "string",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "branch": 1,
      "created_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/picking-waves/`

- **Endpoint**: `POST /api/inventory/picking-waves/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/picking-waves/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "wave_number": "WAVE-2026-0001",
  "target_region_or_route": "sample_target_region_or_route",
  "status": "OPEN",
  "tenant": 1,
  "branch": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "tasks": [
    {
      "id": 1,
      "product_sku": "string",
      "quantity": "10.00",
      "order_reference": "string",
      "is_cross_dock_task": "string",
      "carrier_name": "string",
      "tracking_number": "string",
      "status": "string",
      "picked_at": "string",
      "created_at": "string",
      "tenant": 1,
      "wave": "string",
      "branch": 1,
      "source_bin": "string",
      "product": "string",
      "picked_by": "string"
    }
  ],
  "wave_number": "WAVE-2026-0001",
  "target_region_or_route": "sample_target_region_or_route",
  "status": "OPEN",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "created_by": 1
}
```

---

### `GET /api/inventory/picking-waves/{id}/`

- **Endpoint**: `GET /api/inventory/picking-waves/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/picking-waves/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "tasks": [
    {
      "id": 1,
      "product_sku": "string",
      "quantity": "10.00",
      "order_reference": "string",
      "is_cross_dock_task": "string",
      "carrier_name": "string",
      "tracking_number": "string",
      "status": "string",
      "picked_at": "string",
      "created_at": "string",
      "tenant": 1,
      "wave": "string",
      "branch": 1,
      "source_bin": "string",
      "product": "string",
      "picked_by": "string"
    }
  ],
  "wave_number": "WAVE-2026-0001",
  "target_region_or_route": "sample_target_region_or_route",
  "status": "OPEN",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "created_by": 1
}
```

---

### `PUT /api/inventory/picking-waves/{id}/`

- **Endpoint**: `PUT /api/inventory/picking-waves/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/picking-waves/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "wave_number": "WAVE-2026-0001",
  "target_region_or_route": "sample_target_region_or_route",
  "status": "OPEN",
  "tenant": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "tasks": [
    {
      "id": 1,
      "product_sku": "string",
      "quantity": "10.00",
      "order_reference": "string",
      "is_cross_dock_task": "string",
      "carrier_name": "string",
      "tracking_number": "string",
      "status": "string",
      "picked_at": "string",
      "created_at": "string",
      "tenant": 1,
      "wave": "string",
      "branch": 1,
      "source_bin": "string",
      "product": "string",
      "picked_by": "string"
    }
  ],
  "wave_number": "WAVE-2026-0001",
  "target_region_or_route": "sample_target_region_or_route",
  "status": "OPEN",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "created_by": 1
}
```

---

### `PATCH /api/inventory/picking-waves/{id}/`

- **Endpoint**: `PATCH /api/inventory/picking-waves/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/picking-waves/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "wave_number": "WAVE-2026-0001",
  "target_region_or_route": "sample_target_region_or_route",
  "status": "OPEN",
  "tenant": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "tasks": [
    {
      "id": 1,
      "product_sku": "string",
      "quantity": "10.00",
      "order_reference": "string",
      "is_cross_dock_task": "string",
      "carrier_name": "string",
      "tracking_number": "string",
      "status": "string",
      "picked_at": "string",
      "created_at": "string",
      "tenant": 1,
      "wave": "string",
      "branch": 1,
      "source_bin": "string",
      "product": "string",
      "picked_by": "string"
    }
  ],
  "wave_number": "WAVE-2026-0001",
  "target_region_or_route": "sample_target_region_or_route",
  "status": "OPEN",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "created_by": 1
}
```

---

### `DELETE /api/inventory/picking-waves/{id}/`

- **Endpoint**: `DELETE /api/inventory/picking-waves/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/picking-waves/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/product-variants/`

- **Endpoint**: `GET /api/inventory/product-variants/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/product-variants/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "variant_sku": "LAPTOP-PRO-14-SLV-16GB",
      "barcode": "4791234567890",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "attributes": "string",
      "price_override": "string",
      "cost_override": "string",
      "on_hand": "100.00",
      "is_active": "string",
      "tenant": 1,
      "product": "string"
    }
  ]
}
```

---

### `POST /api/inventory/product-variants/`

- **Endpoint**: `POST /api/inventory/product-variants/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/product-variants/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "variant_sku": "LAPTOP-PRO-14-SLV-16GB",
  "barcode": "4791234567890",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "attributes": {
    "key": "value"
  },
  "price_override": "1000.00",
  "cost_override": "1000.00",
  "on_hand": "100.00",
  "is_active": true,
  "tenant": 1,
  "product": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "variant_sku": "LAPTOP-PRO-14-SLV-16GB",
  "barcode": "4791234567890",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "attributes": {
    "key": "value"
  },
  "price_override": "1000.00",
  "cost_override": "1000.00",
  "on_hand": "100.00",
  "is_active": true,
  "tenant": 1,
  "product": 1
}
```

---

### `GET /api/inventory/product-variants/{id}/`

- **Endpoint**: `GET /api/inventory/product-variants/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/product-variants/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "variant_sku": "LAPTOP-PRO-14-SLV-16GB",
  "barcode": "4791234567890",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "attributes": {
    "key": "value"
  },
  "price_override": "1000.00",
  "cost_override": "1000.00",
  "on_hand": "100.00",
  "is_active": true,
  "tenant": 1,
  "product": 1
}
```

---

### `PUT /api/inventory/product-variants/{id}/`

- **Endpoint**: `PUT /api/inventory/product-variants/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/product-variants/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "variant_sku": "LAPTOP-PRO-14-SLV-16GB",
  "barcode": "4791234567890",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "attributes": {
    "key": "value"
  },
  "price_override": "1000.00",
  "cost_override": "1000.00",
  "on_hand": "100.00",
  "is_active": true,
  "tenant": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "variant_sku": "LAPTOP-PRO-14-SLV-16GB",
  "barcode": "4791234567890",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "attributes": {
    "key": "value"
  },
  "price_override": "1000.00",
  "cost_override": "1000.00",
  "on_hand": "100.00",
  "is_active": true,
  "tenant": 1,
  "product": 1
}
```

---

### `PATCH /api/inventory/product-variants/{id}/`

- **Endpoint**: `PATCH /api/inventory/product-variants/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/product-variants/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "variant_sku": "LAPTOP-PRO-14-SLV-16GB",
  "barcode": "4791234567890",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "attributes": {
    "key": "value"
  },
  "price_override": "1000.00",
  "cost_override": "1000.00",
  "on_hand": "100.00",
  "is_active": true,
  "tenant": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "variant_sku": "LAPTOP-PRO-14-SLV-16GB",
  "barcode": "4791234567890",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "attributes": {
    "key": "value"
  },
  "price_override": "1000.00",
  "cost_override": "1000.00",
  "on_hand": "100.00",
  "is_active": true,
  "tenant": 1,
  "product": 1
}
```

---

### `DELETE /api/inventory/product-variants/{id}/`

- **Endpoint**: `DELETE /api/inventory/product-variants/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/product-variants/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/production-orders/`

- **Endpoint**: `GET /api/inventory/production-orders/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/production-orders/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "order_number": "ORD-2026-0001",
      "quantity_to_produce": "20.00",
      "status": "string",
      "planned_date": "string",
      "completed_at": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "bom": "string",
      "created_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/production-orders/`

- **Endpoint**: `POST /api/inventory/production-orders/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/production-orders/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "order_number": "ORD-2026-0001",
  "quantity_to_produce": "20.00",
  "planned_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bom": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "order_number": "ORD-2026-0001",
  "quantity_to_produce": "20.00",
  "status": "PLANNED",
  "planned_date": "2026-11-23",
  "completed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bom": 1,
  "created_by": 1
}
```

---

### `GET /api/inventory/production-orders/{id}/`

- **Endpoint**: `GET /api/inventory/production-orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/production-orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "order_number": "ORD-2026-0001",
  "quantity_to_produce": "20.00",
  "status": "PLANNED",
  "planned_date": "2026-11-23",
  "completed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bom": 1,
  "created_by": 1
}
```

---

### `PUT /api/inventory/production-orders/{id}/`

- **Endpoint**: `PUT /api/inventory/production-orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/production-orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "order_number": "ORD-2026-0001",
  "quantity_to_produce": "20.00",
  "planned_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bom": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "order_number": "ORD-2026-0001",
  "quantity_to_produce": "20.00",
  "status": "PLANNED",
  "planned_date": "2026-11-23",
  "completed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bom": 1,
  "created_by": 1
}
```

---

### `PATCH /api/inventory/production-orders/{id}/`

- **Endpoint**: `PATCH /api/inventory/production-orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/production-orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "order_number": "ORD-2026-0001",
  "quantity_to_produce": "20.00",
  "planned_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bom": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "order_number": "ORD-2026-0001",
  "quantity_to_produce": "20.00",
  "status": "PLANNED",
  "planned_date": "2026-11-23",
  "completed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bom": 1,
  "created_by": 1
}
```

---

### `DELETE /api/inventory/production-orders/{id}/`

- **Endpoint**: `DELETE /api/inventory/production-orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/production-orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/production-orders/{id}/execute/`

- **Endpoint**: `POST /api/inventory/production-orders/{id}/execute/`
- **Summary**: Execute Production Order (Consumes BOM Components & Produces Finished Product - STK-02)

#### Example Request

```http
POST /api/inventory/production-orders/{id}/execute/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "order_number": "ORD-2026-0001",
  "quantity_to_produce": "20.00",
  "planned_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bom": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "order_number": "ORD-2026-0001",
  "quantity_to_produce": "20.00",
  "status": "PLANNED",
  "planned_date": "2026-11-23",
  "completed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "bom": 1,
  "created_by": 1
}
```

---

### `GET /api/inventory/products/`

- **Endpoint**: `GET /api/inventory/products/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/products/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "category_name": "string",
      "uom_conversions": "string",
      "variants": "string",
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "sku": "LAPTOP-PRO-14",
      "barcode": "4791234567890",
      "rfid_epc": "EPC-3034257BF400",
      "qr_code_payload": "QR-LAPTOP-PRO-14",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "brand": "string",
      "description": "string",
      "unit_of_measure": "PCS",
      "selling_price": "250000.00",
      "cost_price": "180000.00",
      "standard_cost": "180000.00",
      "tax_rate": "18.00",
      "is_tax_inclusive": "string",
      "valuation_method": "string",
      "lead_time_days": "string",
      "weight_kg": "1000.00",
      "volume_cbm": "string",
      "track_batch_serial": "string",
      "is_consignment": "string",
      "is_cross_dock": "string",
      "requires_quality_inspection": "string",
      "requires_cold_chain": "string",
      "is_hazardous": "string",
      "is_tool_or_equipment": "string",
      "abc_class": "string",
      "xyz_class": "string",
      "annual_turnover_ratio": "string",
      "is_dead_stock": "string",
      "attributes_json": "string",
      "is_published_ecommerce": "string",
      "is_active": "string",
      "created_at": "string",
      "updated_at": "string",
      "tenant": 1,
      "category": "string",
      "preferred_supplier": "string",
      "assigned_region_location": "string"
    }
  ]
}
```

---

### `POST /api/inventory/products/`

- **Endpoint**: `POST /api/inventory/products/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/products/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "sku": "LAPTOP-PRO-14",
  "barcode": "4791234567890",
  "rfid_epc": "EPC-3034257BF400",
  "qr_code_payload": "QR-LAPTOP-PRO-14",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "brand": "sample_brand",
  "description": "sample_description",
  "unit_of_measure": "PCS",
  "selling_price": "250000.00",
  "cost_price": "180000.00",
  "standard_cost": "180000.00",
  "tax_rate": "18.00",
  "is_tax_inclusive": true,
  "valuation_method": "FIFO",
  "lead_time_days": 1,
  "weight_kg": "1000.00",
  "volume_cbm": "1000.00",
  "track_batch_serial": true,
  "is_consignment": true,
  "is_cross_dock": true,
  "requires_quality_inspection": true,
  "requires_cold_chain": true,
  "is_hazardous": true,
  "is_tool_or_equipment": true,
  "abc_class": "A",
  "xyz_class": "X",
  "annual_turnover_ratio": "1000.00",
  "is_dead_stock": true,
  "attributes_json": {
    "key": "value"
  },
  "is_published_ecommerce": true,
  "is_active": true,
  "tenant": 1,
  "category": 1,
  "preferred_supplier": 1,
  "assigned_region_location": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "category_name": "sample_category_name",
  "uom_conversions": [
    {
      "id": 1,
      "uom_code": "BOX",
      "conversion_factor": "10.0000",
      "barcode": "4791234567890",
      "is_default_purchase_uom": "string",
      "is_default_sales_uom": "string",
      "tenant": 1,
      "product": "string"
    }
  ],
  "variants": [
    {
      "id": 1,
      "variant_sku": "LAPTOP-PRO-14-SLV-16GB",
      "barcode": "4791234567890",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "attributes": "string",
      "price_override": "string",
      "cost_override": "string",
      "on_hand": "100.00",
      "is_active": "string",
      "tenant": 1,
      "product": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "sku": "LAPTOP-PRO-14",
  "barcode": "4791234567890",
  "rfid_epc": "EPC-3034257BF400",
  "qr_code_payload": "QR-LAPTOP-PRO-14",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "brand": "sample_brand",
  "description": "sample_description",
  "unit_of_measure": "PCS",
  "selling_price": "250000.00",
  "cost_price": "180000.00",
  "standard_cost": "180000.00",
  "tax_rate": "18.00",
  "is_tax_inclusive": true,
  "valuation_method": "FIFO",
  "lead_time_days": 1,
  "weight_kg": "1000.00",
  "volume_cbm": "1000.00",
  "track_batch_serial": true,
  "is_consignment": true,
  "is_cross_dock": true,
  "requires_quality_inspection": true,
  "requires_cold_chain": true,
  "is_hazardous": true,
  "is_tool_or_equipment": true,
  "abc_class": "A",
  "xyz_class": "X",
  "annual_turnover_ratio": "1000.00",
  "is_dead_stock": true,
  "attributes_json": {
    "key": "value"
  },
  "is_published_ecommerce": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "category": 1,
  "preferred_supplier": 1,
  "assigned_region_location": 1
}
```

---

### `GET /api/inventory/products/{id}/`

- **Endpoint**: `GET /api/inventory/products/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/products/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "category_name": "sample_category_name",
  "uom_conversions": [
    {
      "id": 1,
      "uom_code": "BOX",
      "conversion_factor": "10.0000",
      "barcode": "4791234567890",
      "is_default_purchase_uom": "string",
      "is_default_sales_uom": "string",
      "tenant": 1,
      "product": "string"
    }
  ],
  "variants": [
    {
      "id": 1,
      "variant_sku": "LAPTOP-PRO-14-SLV-16GB",
      "barcode": "4791234567890",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "attributes": "string",
      "price_override": "string",
      "cost_override": "string",
      "on_hand": "100.00",
      "is_active": "string",
      "tenant": 1,
      "product": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "sku": "LAPTOP-PRO-14",
  "barcode": "4791234567890",
  "rfid_epc": "EPC-3034257BF400",
  "qr_code_payload": "QR-LAPTOP-PRO-14",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "brand": "sample_brand",
  "description": "sample_description",
  "unit_of_measure": "PCS",
  "selling_price": "250000.00",
  "cost_price": "180000.00",
  "standard_cost": "180000.00",
  "tax_rate": "18.00",
  "is_tax_inclusive": true,
  "valuation_method": "FIFO",
  "lead_time_days": 1,
  "weight_kg": "1000.00",
  "volume_cbm": "1000.00",
  "track_batch_serial": true,
  "is_consignment": true,
  "is_cross_dock": true,
  "requires_quality_inspection": true,
  "requires_cold_chain": true,
  "is_hazardous": true,
  "is_tool_or_equipment": true,
  "abc_class": "A",
  "xyz_class": "X",
  "annual_turnover_ratio": "1000.00",
  "is_dead_stock": true,
  "attributes_json": {
    "key": "value"
  },
  "is_published_ecommerce": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "category": 1,
  "preferred_supplier": 1,
  "assigned_region_location": 1
}
```

---

### `PUT /api/inventory/products/{id}/`

- **Endpoint**: `PUT /api/inventory/products/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/products/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "sku": "LAPTOP-PRO-14",
  "barcode": "4791234567890",
  "rfid_epc": "EPC-3034257BF400",
  "qr_code_payload": "QR-LAPTOP-PRO-14",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "brand": "sample_brand",
  "description": "sample_description",
  "unit_of_measure": "PCS",
  "selling_price": "250000.00",
  "cost_price": "180000.00",
  "standard_cost": "180000.00",
  "tax_rate": "18.00",
  "is_tax_inclusive": true,
  "valuation_method": "FIFO",
  "lead_time_days": 1,
  "weight_kg": "1000.00",
  "volume_cbm": "1000.00",
  "track_batch_serial": true,
  "is_consignment": true,
  "is_cross_dock": true,
  "requires_quality_inspection": true,
  "requires_cold_chain": true,
  "is_hazardous": true,
  "is_tool_or_equipment": true,
  "abc_class": "A",
  "xyz_class": "X",
  "annual_turnover_ratio": "1000.00",
  "is_dead_stock": true,
  "attributes_json": {
    "key": "value"
  },
  "is_published_ecommerce": true,
  "is_active": true,
  "tenant": 1,
  "category": 1,
  "preferred_supplier": 1,
  "assigned_region_location": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "category_name": "sample_category_name",
  "uom_conversions": [
    {
      "id": 1,
      "uom_code": "BOX",
      "conversion_factor": "10.0000",
      "barcode": "4791234567890",
      "is_default_purchase_uom": "string",
      "is_default_sales_uom": "string",
      "tenant": 1,
      "product": "string"
    }
  ],
  "variants": [
    {
      "id": 1,
      "variant_sku": "LAPTOP-PRO-14-SLV-16GB",
      "barcode": "4791234567890",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "attributes": "string",
      "price_override": "string",
      "cost_override": "string",
      "on_hand": "100.00",
      "is_active": "string",
      "tenant": 1,
      "product": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "sku": "LAPTOP-PRO-14",
  "barcode": "4791234567890",
  "rfid_epc": "EPC-3034257BF400",
  "qr_code_payload": "QR-LAPTOP-PRO-14",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "brand": "sample_brand",
  "description": "sample_description",
  "unit_of_measure": "PCS",
  "selling_price": "250000.00",
  "cost_price": "180000.00",
  "standard_cost": "180000.00",
  "tax_rate": "18.00",
  "is_tax_inclusive": true,
  "valuation_method": "FIFO",
  "lead_time_days": 1,
  "weight_kg": "1000.00",
  "volume_cbm": "1000.00",
  "track_batch_serial": true,
  "is_consignment": true,
  "is_cross_dock": true,
  "requires_quality_inspection": true,
  "requires_cold_chain": true,
  "is_hazardous": true,
  "is_tool_or_equipment": true,
  "abc_class": "A",
  "xyz_class": "X",
  "annual_turnover_ratio": "1000.00",
  "is_dead_stock": true,
  "attributes_json": {
    "key": "value"
  },
  "is_published_ecommerce": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "category": 1,
  "preferred_supplier": 1,
  "assigned_region_location": 1
}
```

---

### `PATCH /api/inventory/products/{id}/`

- **Endpoint**: `PATCH /api/inventory/products/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/products/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "sku": "LAPTOP-PRO-14",
  "barcode": "4791234567890",
  "rfid_epc": "EPC-3034257BF400",
  "qr_code_payload": "QR-LAPTOP-PRO-14",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "brand": "sample_brand",
  "description": "sample_description",
  "unit_of_measure": "PCS",
  "selling_price": "250000.00",
  "cost_price": "180000.00",
  "standard_cost": "180000.00",
  "tax_rate": "18.00",
  "is_tax_inclusive": true,
  "valuation_method": "FIFO",
  "lead_time_days": 1,
  "weight_kg": "1000.00",
  "volume_cbm": "1000.00",
  "track_batch_serial": true,
  "is_consignment": true,
  "is_cross_dock": true,
  "requires_quality_inspection": true,
  "requires_cold_chain": true,
  "is_hazardous": true,
  "is_tool_or_equipment": true,
  "abc_class": "A",
  "xyz_class": "X",
  "annual_turnover_ratio": "1000.00",
  "is_dead_stock": true,
  "attributes_json": {
    "key": "value"
  },
  "is_published_ecommerce": true,
  "is_active": true,
  "tenant": 1,
  "category": 1,
  "preferred_supplier": 1,
  "assigned_region_location": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "category_name": "sample_category_name",
  "uom_conversions": [
    {
      "id": 1,
      "uom_code": "BOX",
      "conversion_factor": "10.0000",
      "barcode": "4791234567890",
      "is_default_purchase_uom": "string",
      "is_default_sales_uom": "string",
      "tenant": 1,
      "product": "string"
    }
  ],
  "variants": [
    {
      "id": 1,
      "variant_sku": "LAPTOP-PRO-14-SLV-16GB",
      "barcode": "4791234567890",
      "name": "Devrious Retail Group (Pvt) Ltd",
      "attributes": "string",
      "price_override": "string",
      "cost_override": "string",
      "on_hand": "100.00",
      "is_active": "string",
      "tenant": 1,
      "product": "string"
    }
  ],
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "sku": "LAPTOP-PRO-14",
  "barcode": "4791234567890",
  "rfid_epc": "EPC-3034257BF400",
  "qr_code_payload": "QR-LAPTOP-PRO-14",
  "name": "Devrious Retail Group (Pvt) Ltd",
  "brand": "sample_brand",
  "description": "sample_description",
  "unit_of_measure": "PCS",
  "selling_price": "250000.00",
  "cost_price": "180000.00",
  "standard_cost": "180000.00",
  "tax_rate": "18.00",
  "is_tax_inclusive": true,
  "valuation_method": "FIFO",
  "lead_time_days": 1,
  "weight_kg": "1000.00",
  "volume_cbm": "1000.00",
  "track_batch_serial": true,
  "is_consignment": true,
  "is_cross_dock": true,
  "requires_quality_inspection": true,
  "requires_cold_chain": true,
  "is_hazardous": true,
  "is_tool_or_equipment": true,
  "abc_class": "A",
  "xyz_class": "X",
  "annual_turnover_ratio": "1000.00",
  "is_dead_stock": true,
  "attributes_json": {
    "key": "value"
  },
  "is_published_ecommerce": true,
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "category": 1,
  "preferred_supplier": 1,
  "assigned_region_location": 1
}
```

---

### `DELETE /api/inventory/products/{id}/`

- **Endpoint**: `DELETE /api/inventory/products/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/products/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/proofs-of-delivery/`

- **Endpoint**: `GET /api/inventory/proofs-of-delivery/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/proofs-of-delivery/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "order_reference": "string",
      "recipient_name": "string",
      "signature_data": "string",
      "photo_url": "string",
      "gps_latitude": "string",
      "gps_longitude": "string",
      "is_offline_synced": "string",
      "delivered_at": "string",
      "tenant": 1,
      "delivery_trip": "string",
      "ecommerce_order": "string",
      "captured_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/proofs-of-delivery/`

- **Endpoint**: `POST /api/inventory/proofs-of-delivery/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/proofs-of-delivery/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "order_reference": "sample_order_reference",
  "recipient_name": "sample_recipient_name",
  "signature_data": "sample_signature_data",
  "photo_url": "https://erp.devrious.com/files/sample.pdf",
  "gps_latitude": "1000.00",
  "gps_longitude": "1000.00",
  "is_offline_synced": true,
  "tenant": 1,
  "delivery_trip": 1,
  "ecommerce_order": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "order_reference": "sample_order_reference",
  "recipient_name": "sample_recipient_name",
  "signature_data": "sample_signature_data",
  "photo_url": "https://erp.devrious.com/files/sample.pdf",
  "gps_latitude": "1000.00",
  "gps_longitude": "1000.00",
  "is_offline_synced": true,
  "delivered_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "delivery_trip": 1,
  "ecommerce_order": 1,
  "captured_by": 1
}
```

---

### `GET /api/inventory/proofs-of-delivery/{id}/`

- **Endpoint**: `GET /api/inventory/proofs-of-delivery/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/proofs-of-delivery/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "order_reference": "sample_order_reference",
  "recipient_name": "sample_recipient_name",
  "signature_data": "sample_signature_data",
  "photo_url": "https://erp.devrious.com/files/sample.pdf",
  "gps_latitude": "1000.00",
  "gps_longitude": "1000.00",
  "is_offline_synced": true,
  "delivered_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "delivery_trip": 1,
  "ecommerce_order": 1,
  "captured_by": 1
}
```

---

### `PUT /api/inventory/proofs-of-delivery/{id}/`

- **Endpoint**: `PUT /api/inventory/proofs-of-delivery/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/proofs-of-delivery/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "order_reference": "sample_order_reference",
  "recipient_name": "sample_recipient_name",
  "signature_data": "sample_signature_data",
  "photo_url": "https://erp.devrious.com/files/sample.pdf",
  "gps_latitude": "1000.00",
  "gps_longitude": "1000.00",
  "is_offline_synced": true,
  "tenant": 1,
  "delivery_trip": 1,
  "ecommerce_order": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "order_reference": "sample_order_reference",
  "recipient_name": "sample_recipient_name",
  "signature_data": "sample_signature_data",
  "photo_url": "https://erp.devrious.com/files/sample.pdf",
  "gps_latitude": "1000.00",
  "gps_longitude": "1000.00",
  "is_offline_synced": true,
  "delivered_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "delivery_trip": 1,
  "ecommerce_order": 1,
  "captured_by": 1
}
```

---

### `PATCH /api/inventory/proofs-of-delivery/{id}/`

- **Endpoint**: `PATCH /api/inventory/proofs-of-delivery/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/proofs-of-delivery/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "order_reference": "sample_order_reference",
  "recipient_name": "sample_recipient_name",
  "signature_data": "sample_signature_data",
  "photo_url": "https://erp.devrious.com/files/sample.pdf",
  "gps_latitude": "1000.00",
  "gps_longitude": "1000.00",
  "is_offline_synced": true,
  "tenant": 1,
  "delivery_trip": 1,
  "ecommerce_order": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "order_reference": "sample_order_reference",
  "recipient_name": "sample_recipient_name",
  "signature_data": "sample_signature_data",
  "photo_url": "https://erp.devrious.com/files/sample.pdf",
  "gps_latitude": "1000.00",
  "gps_longitude": "1000.00",
  "is_offline_synced": true,
  "delivered_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "delivery_trip": 1,
  "ecommerce_order": 1,
  "captured_by": 1
}
```

---

### `DELETE /api/inventory/proofs-of-delivery/{id}/`

- **Endpoint**: `DELETE /api/inventory/proofs-of-delivery/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/proofs-of-delivery/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/purchase-orders/`

- **Endpoint**: `GET /api/inventory/purchase-orders/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/purchase-orders/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "lines": "string",
      "supplier_name": "string",
      "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
      "po_number": "PO-2026-0001",
      "order_date": "string",
      "expected_delivery_date": "string",
      "status": "string",
      "currency": "LKR",
      "total_amount": "1750000.00",
      "notes": "Verified and recorded by administrator.",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "supplier": "string",
      "created_by": "string",
      "approved_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/purchase-orders/`

- **Endpoint**: `POST /api/inventory/purchase-orders/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/purchase-orders/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "uom_code": "BOX",
      "ordered_quantity": "10.00",
      "agreed_unit_cost": "175000.00",
      "discount_percent": "string"
    }
  ],
  "po_number": "PO-2026-0001",
  "order_date": "2026-11-23",
  "expected_delivery_date": "2026-11-23",
  "status": "DRAFT",
  "currency": "LKR",
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "product_name": "string",
      "uom_code": "BOX",
      "ordered_quantity": "10.00",
      "received_quantity": "10.00",
      "pending_quantity": "string",
      "agreed_unit_cost": "175000.00",
      "discount_percent": "string",
      "line_total": "string"
    }
  ],
  "supplier_name": "sample_supplier_name",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "po_number": "PO-2026-0001",
  "order_date": "2026-11-23",
  "expected_delivery_date": "2026-11-23",
  "status": "DRAFT",
  "currency": "LKR",
  "total_amount": "1750000.00",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "created_by": 1,
  "approved_by": 1
}
```

---

### `GET /api/inventory/purchase-orders/{id}/`

- **Endpoint**: `GET /api/inventory/purchase-orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/purchase-orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "product_name": "string",
      "uom_code": "BOX",
      "ordered_quantity": "10.00",
      "received_quantity": "10.00",
      "pending_quantity": "string",
      "agreed_unit_cost": "175000.00",
      "discount_percent": "string",
      "line_total": "string"
    }
  ],
  "supplier_name": "sample_supplier_name",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "po_number": "PO-2026-0001",
  "order_date": "2026-11-23",
  "expected_delivery_date": "2026-11-23",
  "status": "DRAFT",
  "currency": "LKR",
  "total_amount": "1750000.00",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "created_by": 1,
  "approved_by": 1
}
```

---

### `PUT /api/inventory/purchase-orders/{id}/`

- **Endpoint**: `PUT /api/inventory/purchase-orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/purchase-orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "uom_code": "BOX",
      "ordered_quantity": "10.00",
      "agreed_unit_cost": "175000.00",
      "discount_percent": "string"
    }
  ],
  "po_number": "PO-2026-0001",
  "order_date": "2026-11-23",
  "expected_delivery_date": "2026-11-23",
  "status": "DRAFT",
  "currency": "LKR",
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "product_name": "string",
      "uom_code": "BOX",
      "ordered_quantity": "10.00",
      "received_quantity": "10.00",
      "pending_quantity": "string",
      "agreed_unit_cost": "175000.00",
      "discount_percent": "string",
      "line_total": "string"
    }
  ],
  "supplier_name": "sample_supplier_name",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "po_number": "PO-2026-0001",
  "order_date": "2026-11-23",
  "expected_delivery_date": "2026-11-23",
  "status": "DRAFT",
  "currency": "LKR",
  "total_amount": "1750000.00",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "created_by": 1,
  "approved_by": 1
}
```

---

### `PATCH /api/inventory/purchase-orders/{id}/`

- **Endpoint**: `PATCH /api/inventory/purchase-orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/purchase-orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "uom_code": "BOX",
      "ordered_quantity": "10.00",
      "agreed_unit_cost": "175000.00",
      "discount_percent": "string"
    }
  ],
  "po_number": "PO-2026-0001",
  "order_date": "2026-11-23",
  "expected_delivery_date": "2026-11-23",
  "status": "DRAFT",
  "currency": "LKR",
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "product_name": "string",
      "uom_code": "BOX",
      "ordered_quantity": "10.00",
      "received_quantity": "10.00",
      "pending_quantity": "string",
      "agreed_unit_cost": "175000.00",
      "discount_percent": "string",
      "line_total": "string"
    }
  ],
  "supplier_name": "sample_supplier_name",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "po_number": "PO-2026-0001",
  "order_date": "2026-11-23",
  "expected_delivery_date": "2026-11-23",
  "status": "DRAFT",
  "currency": "LKR",
  "total_amount": "1750000.00",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "created_by": 1,
  "approved_by": 1
}
```

---

### `DELETE /api/inventory/purchase-orders/{id}/`

- **Endpoint**: `DELETE /api/inventory/purchase-orders/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/purchase-orders/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/purchase-orders/{id}/approve/`

- **Endpoint**: `POST /api/inventory/purchase-orders/{id}/approve/`
- **Summary**: Approve a Purchase Order

#### Example Request

```http
POST /api/inventory/purchase-orders/{id}/approve/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "uom_code": "BOX",
      "ordered_quantity": "10.00",
      "agreed_unit_cost": "175000.00",
      "discount_percent": "string"
    }
  ],
  "po_number": "PO-2026-0001",
  "order_date": "2026-11-23",
  "expected_delivery_date": "2026-11-23",
  "status": "DRAFT",
  "currency": "LKR",
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "product_name": "string",
      "uom_code": "BOX",
      "ordered_quantity": "10.00",
      "received_quantity": "10.00",
      "pending_quantity": "string",
      "agreed_unit_cost": "175000.00",
      "discount_percent": "string",
      "line_total": "string"
    }
  ],
  "supplier_name": "sample_supplier_name",
  "public_id": "a7c8f910-34e2-4c6b-9f1a-8e23b45c67d8",
  "po_number": "PO-2026-0001",
  "order_date": "2026-11-23",
  "expected_delivery_date": "2026-11-23",
  "status": "DRAFT",
  "currency": "LKR",
  "total_amount": "1750000.00",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "supplier": 1,
  "created_by": 1,
  "approved_by": 1
}
```

---

### `POST /api/inventory/purchase-orders/{id}/verify-three-way-match/`

- **Endpoint**: `POST /api/inventory/purchase-orders/{id}/verify-three-way-match/`
- **Summary**: Verify Three-Way Matching Among Purchase Order, Goods Receipt (GRN), and Supplier Invoice (`STK-07`)

#### Example Request

```http
POST /api/inventory/purchase-orders/{id}/verify-three-way-match/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "invoice_quantity": "10.00",
  "invoice_amount": "1750000.00"
}
```

#### Example Response (`200 OK`)

```json
{
  "is_matched": true,
  "discrepancy_flag": "MATCHED",
  "po_ordered_qty": "10.00",
  "grn_received_qty": "10.00",
  "invoice_billed_qty": "10.00",
  "grn_amount": "1750000.00",
  "invoice_amount": "1750000.00"
}
```

---

### `GET /api/inventory/put-away-tasks/`

- **Endpoint**: `GET /api/inventory/put-away-tasks/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/put-away-tasks/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "suggested_bin_path": "string",
      "quantity": "10.00",
      "status": "string",
      "completed_at": "string",
      "created_at": "string",
      "tenant": 1,
      "grn": "string",
      "branch": 1,
      "product": "string",
      "suggested_bin": "string",
      "confirmed_bin": "string",
      "completed_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/put-away-tasks/`

- **Endpoint**: `POST /api/inventory/put-away-tasks/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/put-away-tasks/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "quantity": "10.00",
  "status": "PENDING",
  "tenant": 1,
  "grn": 1,
  "branch": 1,
  "product": 1,
  "suggested_bin": 1,
  "confirmed_bin": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "suggested_bin_path": "sample_suggested_bin_path",
  "quantity": "10.00",
  "status": "PENDING",
  "completed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "grn": 1,
  "branch": 1,
  "product": 1,
  "suggested_bin": 1,
  "confirmed_bin": 1,
  "completed_by": 1
}
```

---

### `GET /api/inventory/put-away-tasks/{id}/`

- **Endpoint**: `GET /api/inventory/put-away-tasks/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/put-away-tasks/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "suggested_bin_path": "sample_suggested_bin_path",
  "quantity": "10.00",
  "status": "PENDING",
  "completed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "grn": 1,
  "branch": 1,
  "product": 1,
  "suggested_bin": 1,
  "confirmed_bin": 1,
  "completed_by": 1
}
```

---

### `PUT /api/inventory/put-away-tasks/{id}/`

- **Endpoint**: `PUT /api/inventory/put-away-tasks/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/put-away-tasks/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "quantity": "10.00",
  "status": "PENDING",
  "tenant": 1,
  "grn": 1,
  "branch": 1,
  "product": 1,
  "suggested_bin": 1,
  "confirmed_bin": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "suggested_bin_path": "sample_suggested_bin_path",
  "quantity": "10.00",
  "status": "PENDING",
  "completed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "grn": 1,
  "branch": 1,
  "product": 1,
  "suggested_bin": 1,
  "confirmed_bin": 1,
  "completed_by": 1
}
```

---

### `PATCH /api/inventory/put-away-tasks/{id}/`

- **Endpoint**: `PATCH /api/inventory/put-away-tasks/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/put-away-tasks/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "quantity": "10.00",
  "status": "PENDING",
  "tenant": 1,
  "grn": 1,
  "branch": 1,
  "product": 1,
  "suggested_bin": 1,
  "confirmed_bin": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "suggested_bin_path": "sample_suggested_bin_path",
  "quantity": "10.00",
  "status": "PENDING",
  "completed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "grn": 1,
  "branch": 1,
  "product": 1,
  "suggested_bin": 1,
  "confirmed_bin": 1,
  "completed_by": 1
}
```

---

### `DELETE /api/inventory/put-away-tasks/{id}/`

- **Endpoint**: `DELETE /api/inventory/put-away-tasks/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/put-away-tasks/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/put-away-tasks/{id}/confirm-scan/`

- **Endpoint**: `POST /api/inventory/put-away-tasks/{id}/confirm-scan/`
- **Summary**: Confirm Put-Away Task by Scanning Item & Bin Location (STK-14)

#### Example Request

```http
POST /api/inventory/put-away-tasks/{id}/confirm-scan/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "quantity": "10.00",
  "status": "PENDING",
  "tenant": 1,
  "grn": 1,
  "branch": 1,
  "product": 1,
  "suggested_bin": 1,
  "confirmed_bin": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "suggested_bin_path": "sample_suggested_bin_path",
  "quantity": "10.00",
  "status": "PENDING",
  "completed_at": "2026-11-23T10:30:00+05:30",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "grn": 1,
  "branch": 1,
  "product": 1,
  "suggested_bin": 1,
  "confirmed_bin": 1,
  "completed_by": 1
}
```

---

### `GET /api/inventory/quality-inspections/`

- **Endpoint**: `GET /api/inventory/quality-inspections/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/quality-inspections/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "total_quarantined_qty": "string",
      "approved_quantity": "string",
      "rejected_quantity": "string",
      "rejection_disposition": "string",
      "status": "string",
      "notes": "Verified and recorded by administrator.",
      "created_at": "string",
      "tenant": 1,
      "grn": "string",
      "grn_line": "string",
      "product": "string",
      "branch": 1,
      "inspected_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/quality-inspections/`

- **Endpoint**: `POST /api/inventory/quality-inspections/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/quality-inspections/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "total_quarantined_qty": "1000.00",
  "approved_quantity": "1000.00",
  "rejected_quantity": "1000.00",
  "rejection_disposition": "sample_rejection_disposition",
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "grn": 1,
  "grn_line": 1,
  "product": 1,
  "branch": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "total_quarantined_qty": "1000.00",
  "approved_quantity": "1000.00",
  "rejected_quantity": "1000.00",
  "rejection_disposition": "sample_rejection_disposition",
  "status": "PENDING",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "grn": 1,
  "grn_line": 1,
  "product": 1,
  "branch": 1,
  "inspected_by": 1
}
```

---

### `GET /api/inventory/quality-inspections/{id}/`

- **Endpoint**: `GET /api/inventory/quality-inspections/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/quality-inspections/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "total_quarantined_qty": "1000.00",
  "approved_quantity": "1000.00",
  "rejected_quantity": "1000.00",
  "rejection_disposition": "sample_rejection_disposition",
  "status": "PENDING",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "grn": 1,
  "grn_line": 1,
  "product": 1,
  "branch": 1,
  "inspected_by": 1
}
```

---

### `PUT /api/inventory/quality-inspections/{id}/`

- **Endpoint**: `PUT /api/inventory/quality-inspections/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/quality-inspections/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "total_quarantined_qty": "1000.00",
  "approved_quantity": "1000.00",
  "rejected_quantity": "1000.00",
  "rejection_disposition": "sample_rejection_disposition",
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "grn": 1,
  "grn_line": 1,
  "product": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "total_quarantined_qty": "1000.00",
  "approved_quantity": "1000.00",
  "rejected_quantity": "1000.00",
  "rejection_disposition": "sample_rejection_disposition",
  "status": "PENDING",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "grn": 1,
  "grn_line": 1,
  "product": 1,
  "branch": 1,
  "inspected_by": 1
}
```

---

### `PATCH /api/inventory/quality-inspections/{id}/`

- **Endpoint**: `PATCH /api/inventory/quality-inspections/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/quality-inspections/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "total_quarantined_qty": "1000.00",
  "approved_quantity": "1000.00",
  "rejected_quantity": "1000.00",
  "rejection_disposition": "sample_rejection_disposition",
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "grn": 1,
  "grn_line": 1,
  "product": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "total_quarantined_qty": "1000.00",
  "approved_quantity": "1000.00",
  "rejected_quantity": "1000.00",
  "rejection_disposition": "sample_rejection_disposition",
  "status": "PENDING",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "grn": 1,
  "grn_line": 1,
  "product": 1,
  "branch": 1,
  "inspected_by": 1
}
```

---

### `DELETE /api/inventory/quality-inspections/{id}/`

- **Endpoint**: `DELETE /api/inventory/quality-inspections/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/quality-inspections/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/quality-inspections/{id}/complete-inspection/`

- **Endpoint**: `POST /api/inventory/quality-inspections/{id}/complete-inspection/`
- **Summary**: Complete Quality Inspection (Releases approved stock from Quarantine & flags rejected stock - STK-13)

#### Example Request

```http
POST /api/inventory/quality-inspections/{id}/complete-inspection/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "total_quarantined_qty": "1000.00",
  "approved_quantity": "1000.00",
  "rejected_quantity": "1000.00",
  "rejection_disposition": "sample_rejection_disposition",
  "notes": "Verified and recorded by administrator.",
  "tenant": 1,
  "grn": 1,
  "grn_line": 1,
  "product": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "total_quarantined_qty": "1000.00",
  "approved_quantity": "1000.00",
  "rejected_quantity": "1000.00",
  "rejection_disposition": "sample_rejection_disposition",
  "status": "PENDING",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "grn": 1,
  "grn_line": 1,
  "product": 1,
  "branch": 1,
  "inspected_by": 1
}
```

---

### `GET /api/inventory/recalls/`

- **Endpoint**: `GET /api/inventory/recalls/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/recalls/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "recall_number": "RCL-2026-0001",
      "batch_number": "BATCH-2026-11A",
      "reason": "Policy compliance / administrative action",
      "affected_customers_json": "string",
      "quarantined_units_count": "string",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "product": "string",
      "initiated_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/recalls/`

- **Endpoint**: `POST /api/inventory/recalls/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/recalls/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "recall_number": "RCL-2026-0001",
  "batch_number": "BATCH-2026-11A",
  "reason": "Policy compliance / administrative action",
  "tenant": 1,
  "company": 1,
  "product": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "recall_number": "RCL-2026-0001",
  "batch_number": "BATCH-2026-11A",
  "reason": "Policy compliance / administrative action",
  "affected_customers_json": {
    "key": "value"
  },
  "quarantined_units_count": "1000.00",
  "status": "INITIATED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "product": 1,
  "initiated_by": 1
}
```

---

### `GET /api/inventory/recalls/{id}/`

- **Endpoint**: `GET /api/inventory/recalls/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/recalls/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "recall_number": "RCL-2026-0001",
  "batch_number": "BATCH-2026-11A",
  "reason": "Policy compliance / administrative action",
  "affected_customers_json": {
    "key": "value"
  },
  "quarantined_units_count": "1000.00",
  "status": "INITIATED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "product": 1,
  "initiated_by": 1
}
```

---

### `PUT /api/inventory/recalls/{id}/`

- **Endpoint**: `PUT /api/inventory/recalls/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/recalls/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "recall_number": "RCL-2026-0001",
  "batch_number": "BATCH-2026-11A",
  "reason": "Policy compliance / administrative action",
  "tenant": 1,
  "company": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "recall_number": "RCL-2026-0001",
  "batch_number": "BATCH-2026-11A",
  "reason": "Policy compliance / administrative action",
  "affected_customers_json": {
    "key": "value"
  },
  "quarantined_units_count": "1000.00",
  "status": "INITIATED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "product": 1,
  "initiated_by": 1
}
```

---

### `PATCH /api/inventory/recalls/{id}/`

- **Endpoint**: `PATCH /api/inventory/recalls/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/recalls/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "recall_number": "RCL-2026-0001",
  "batch_number": "BATCH-2026-11A",
  "reason": "Policy compliance / administrative action",
  "tenant": 1,
  "company": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "recall_number": "RCL-2026-0001",
  "batch_number": "BATCH-2026-11A",
  "reason": "Policy compliance / administrative action",
  "affected_customers_json": {
    "key": "value"
  },
  "quarantined_units_count": "1000.00",
  "status": "INITIATED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "product": 1,
  "initiated_by": 1
}
```

---

### `DELETE /api/inventory/recalls/{id}/`

- **Endpoint**: `DELETE /api/inventory/recalls/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/recalls/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/requisitions/`

- **Endpoint**: `GET /api/inventory/requisitions/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/requisitions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "lines": "string",
      "requisition_number": "REQ-2026-0001",
      "status": "string",
      "reason": "Policy compliance / administrative action",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "generated_po": "string",
      "requested_by": "string",
      "approved_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/requisitions/`

- **Endpoint**: `POST /api/inventory/requisitions/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/requisitions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "requested_quantity": "50.00"
    }
  ],
  "requisition_number": "REQ-2026-0001",
  "reason": "Policy compliance / administrative action",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "requested_quantity": "50.00"
    }
  ],
  "requisition_number": "REQ-2026-0001",
  "status": "DRAFT",
  "reason": "Policy compliance / administrative action",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "generated_po": 1,
  "requested_by": 1,
  "approved_by": 1
}
```

---

### `GET /api/inventory/requisitions/{id}/`

- **Endpoint**: `GET /api/inventory/requisitions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/requisitions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "requested_quantity": "50.00"
    }
  ],
  "requisition_number": "REQ-2026-0001",
  "status": "DRAFT",
  "reason": "Policy compliance / administrative action",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "generated_po": 1,
  "requested_by": 1,
  "approved_by": 1
}
```

---

### `PUT /api/inventory/requisitions/{id}/`

- **Endpoint**: `PUT /api/inventory/requisitions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/requisitions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "requested_quantity": "50.00"
    }
  ],
  "requisition_number": "REQ-2026-0001",
  "reason": "Policy compliance / administrative action",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "requested_quantity": "50.00"
    }
  ],
  "requisition_number": "REQ-2026-0001",
  "status": "DRAFT",
  "reason": "Policy compliance / administrative action",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "generated_po": 1,
  "requested_by": 1,
  "approved_by": 1
}
```

---

### `PATCH /api/inventory/requisitions/{id}/`

- **Endpoint**: `PATCH /api/inventory/requisitions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/requisitions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "requested_quantity": "50.00"
    }
  ],
  "requisition_number": "REQ-2026-0001",
  "reason": "Policy compliance / administrative action",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "requested_quantity": "50.00"
    }
  ],
  "requisition_number": "REQ-2026-0001",
  "status": "DRAFT",
  "reason": "Policy compliance / administrative action",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "generated_po": 1,
  "requested_by": 1,
  "approved_by": 1
}
```

---

### `DELETE /api/inventory/requisitions/{id}/`

- **Endpoint**: `DELETE /api/inventory/requisitions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/requisitions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/requisitions/{id}/convert-to-po/`

- **Endpoint**: `POST /api/inventory/requisitions/{id}/convert-to-po/`
- **Summary**: Approve Purchase Requisition & Convert into Purchase Order (STK-05)

#### Example Request

```http
POST /api/inventory/requisitions/{id}/convert-to-po/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "requested_quantity": "50.00"
    }
  ],
  "requisition_number": "REQ-2026-0001",
  "reason": "Policy compliance / administrative action",
  "tenant": 1,
  "company": 1,
  "branch": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "requested_quantity": "50.00"
    }
  ],
  "requisition_number": "REQ-2026-0001",
  "status": "DRAFT",
  "reason": "Policy compliance / administrative action",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "generated_po": 1,
  "requested_by": 1,
  "approved_by": 1
}
```

---

### `GET /api/inventory/reservations/`

- **Endpoint**: `GET /api/inventory/reservations/`
- **Summary**: Stock Reservations preventing double-allocation / overbooking (STK-17).

#### Example Request

```http
GET /api/inventory/reservations/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "reference_type": "string",
      "reference_id": "string",
      "quantity": "10.00",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "stock_level": "string",
      "reserved_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/reservations/`

- **Endpoint**: `POST /api/inventory/reservations/`
- **Summary**: Stock Reservations preventing double-allocation / overbooking (STK-17).

#### Example Request

```http
POST /api/inventory/reservations/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "reference_type": "sample_reference_type",
  "reference_id": "sample_reference_id",
  "quantity": "10.00",
  "tenant": 1,
  "stock_level": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "reference_type": "sample_reference_type",
  "reference_id": "sample_reference_id",
  "quantity": "10.00",
  "status": "ACTIVE",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "stock_level": 1,
  "reserved_by": 1
}
```

---

### `GET /api/inventory/reservations/{id}/`

- **Endpoint**: `GET /api/inventory/reservations/{id}/`
- **Summary**: Stock Reservations preventing double-allocation / overbooking (STK-17).

#### Example Request

```http
GET /api/inventory/reservations/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "reference_type": "sample_reference_type",
  "reference_id": "sample_reference_id",
  "quantity": "10.00",
  "status": "ACTIVE",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "stock_level": 1,
  "reserved_by": 1
}
```

---

### `PUT /api/inventory/reservations/{id}/`

- **Endpoint**: `PUT /api/inventory/reservations/{id}/`
- **Summary**: Stock Reservations preventing double-allocation / overbooking (STK-17).

#### Example Request

```http
PUT /api/inventory/reservations/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "reference_type": "sample_reference_type",
  "reference_id": "sample_reference_id",
  "quantity": "10.00",
  "tenant": 1,
  "stock_level": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "reference_type": "sample_reference_type",
  "reference_id": "sample_reference_id",
  "quantity": "10.00",
  "status": "ACTIVE",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "stock_level": 1,
  "reserved_by": 1
}
```

---

### `PATCH /api/inventory/reservations/{id}/`

- **Endpoint**: `PATCH /api/inventory/reservations/{id}/`
- **Summary**: Stock Reservations preventing double-allocation / overbooking (STK-17).

#### Example Request

```http
PATCH /api/inventory/reservations/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "reference_type": "sample_reference_type",
  "reference_id": "sample_reference_id",
  "quantity": "10.00",
  "tenant": 1,
  "stock_level": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "reference_type": "sample_reference_type",
  "reference_id": "sample_reference_id",
  "quantity": "10.00",
  "status": "ACTIVE",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "stock_level": 1,
  "reserved_by": 1
}
```

---

### `DELETE /api/inventory/reservations/{id}/`

- **Endpoint**: `DELETE /api/inventory/reservations/{id}/`
- **Summary**: Stock Reservations preventing double-allocation / overbooking (STK-17).

#### Example Request

```http
DELETE /api/inventory/reservations/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/rfqs/`

- **Endpoint**: `GET /api/inventory/rfqs/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/rfqs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "bids": "string",
      "rfq_number": "RFQ-2026-0001",
      "required_quantity": "100.00",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "product": "string",
      "winning_bid": "string",
      "awarded_contract": "string",
      "created_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/rfqs/`

- **Endpoint**: `POST /api/inventory/rfqs/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/rfqs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "rfq_number": "RFQ-2026-0001",
  "required_quantity": "100.00",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "bids": [
    {
      "id": 1,
      "supplier_name": "string",
      "quoted_unit_price": "172000.00",
      "promised_lead_time_days": "string",
      "is_compliant": "string",
      "notes": "Verified and recorded by administrator.",
      "submitted_at": "string",
      "rfq": "string",
      "supplier": "string"
    }
  ],
  "rfq_number": "RFQ-2026-0001",
  "required_quantity": "100.00",
  "status": "OPEN",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1,
  "winning_bid": 1,
  "awarded_contract": 1,
  "created_by": 1
}
```

---

### `GET /api/inventory/rfqs/{id}/`

- **Endpoint**: `GET /api/inventory/rfqs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/rfqs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "bids": [
    {
      "id": 1,
      "supplier_name": "string",
      "quoted_unit_price": "172000.00",
      "promised_lead_time_days": "string",
      "is_compliant": "string",
      "notes": "Verified and recorded by administrator.",
      "submitted_at": "string",
      "rfq": "string",
      "supplier": "string"
    }
  ],
  "rfq_number": "RFQ-2026-0001",
  "required_quantity": "100.00",
  "status": "OPEN",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1,
  "winning_bid": 1,
  "awarded_contract": 1,
  "created_by": 1
}
```

---

### `PUT /api/inventory/rfqs/{id}/`

- **Endpoint**: `PUT /api/inventory/rfqs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/rfqs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "rfq_number": "RFQ-2026-0001",
  "required_quantity": "100.00",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "bids": [
    {
      "id": 1,
      "supplier_name": "string",
      "quoted_unit_price": "172000.00",
      "promised_lead_time_days": "string",
      "is_compliant": "string",
      "notes": "Verified and recorded by administrator.",
      "submitted_at": "string",
      "rfq": "string",
      "supplier": "string"
    }
  ],
  "rfq_number": "RFQ-2026-0001",
  "required_quantity": "100.00",
  "status": "OPEN",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1,
  "winning_bid": 1,
  "awarded_contract": 1,
  "created_by": 1
}
```

---

### `PATCH /api/inventory/rfqs/{id}/`

- **Endpoint**: `PATCH /api/inventory/rfqs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/rfqs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "rfq_number": "RFQ-2026-0001",
  "required_quantity": "100.00",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "bids": [
    {
      "id": 1,
      "supplier_name": "string",
      "quoted_unit_price": "172000.00",
      "promised_lead_time_days": "string",
      "is_compliant": "string",
      "notes": "Verified and recorded by administrator.",
      "submitted_at": "string",
      "rfq": "string",
      "supplier": "string"
    }
  ],
  "rfq_number": "RFQ-2026-0001",
  "required_quantity": "100.00",
  "status": "OPEN",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1,
  "winning_bid": 1,
  "awarded_contract": 1,
  "created_by": 1
}
```

---

### `DELETE /api/inventory/rfqs/{id}/`

- **Endpoint**: `DELETE /api/inventory/rfqs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/rfqs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/rfqs/{id}/award-bid/`

- **Endpoint**: `POST /api/inventory/rfqs/{id}/award-bid/`
- **Summary**: Award RFQ to Winning Bid & Auto-Update Supplier Contract Price (STK-06)

#### Example Request

```http
POST /api/inventory/rfqs/{id}/award-bid/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "rfq_number": "RFQ-2026-0001",
  "required_quantity": "100.00",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "bids": [
    {
      "id": 1,
      "supplier_name": "string",
      "quoted_unit_price": "172000.00",
      "promised_lead_time_days": "string",
      "is_compliant": "string",
      "notes": "Verified and recorded by administrator.",
      "submitted_at": "string",
      "rfq": "string",
      "supplier": "string"
    }
  ],
  "rfq_number": "RFQ-2026-0001",
  "required_quantity": "100.00",
  "status": "OPEN",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1,
  "winning_bid": 1,
  "awarded_contract": 1,
  "created_by": 1
}
```

---

### `POST /api/inventory/rfqs/{id}/submit-bid/`

- **Endpoint**: `POST /api/inventory/rfqs/{id}/submit-bid/`
- **Summary**: Submit a Supplier Quote / Bid for an RFQ (STK-06)

#### Example Request

```http
POST /api/inventory/rfqs/{id}/submit-bid/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "rfq_number": "RFQ-2026-0001",
  "required_quantity": "100.00",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "bids": [
    {
      "id": 1,
      "supplier_name": "string",
      "quoted_unit_price": "172000.00",
      "promised_lead_time_days": "string",
      "is_compliant": "string",
      "notes": "Verified and recorded by administrator.",
      "submitted_at": "string",
      "rfq": "string",
      "supplier": "string"
    }
  ],
  "rfq_number": "RFQ-2026-0001",
  "required_quantity": "100.00",
  "status": "OPEN",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1,
  "winning_bid": 1,
  "awarded_contract": 1,
  "created_by": 1
}
```

---

### `GET /api/inventory/rmas/`

- **Endpoint**: `GET /api/inventory/rmas/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/rmas/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "rma_number": "RMA-2026-0001",
      "quantity": "10.00",
      "reason": "Policy compliance / administrative action",
      "disposition": "string",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "customer": "string",
      "product": "string",
      "related_invoice": "string",
      "credit_note": "string",
      "created_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/rmas/`

- **Endpoint**: `POST /api/inventory/rmas/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/rmas/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "rma_number": "RMA-2026-0001",
  "quantity": "10.00",
  "reason": "Policy compliance / administrative action",
  "disposition": "RESTOCK",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "product": 1,
  "related_invoice": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "rma_number": "RMA-2026-0001",
  "quantity": "10.00",
  "reason": "Policy compliance / administrative action",
  "disposition": "RESTOCK",
  "status": "AUTHORIZED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "product": 1,
  "related_invoice": 1,
  "credit_note": 1,
  "created_by": 1
}
```

---

### `GET /api/inventory/rmas/{id}/`

- **Endpoint**: `GET /api/inventory/rmas/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/rmas/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "rma_number": "RMA-2026-0001",
  "quantity": "10.00",
  "reason": "Policy compliance / administrative action",
  "disposition": "RESTOCK",
  "status": "AUTHORIZED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "product": 1,
  "related_invoice": 1,
  "credit_note": 1,
  "created_by": 1
}
```

---

### `PUT /api/inventory/rmas/{id}/`

- **Endpoint**: `PUT /api/inventory/rmas/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/rmas/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "rma_number": "RMA-2026-0001",
  "quantity": "10.00",
  "reason": "Policy compliance / administrative action",
  "disposition": "RESTOCK",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "product": 1,
  "related_invoice": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "rma_number": "RMA-2026-0001",
  "quantity": "10.00",
  "reason": "Policy compliance / administrative action",
  "disposition": "RESTOCK",
  "status": "AUTHORIZED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "product": 1,
  "related_invoice": 1,
  "credit_note": 1,
  "created_by": 1
}
```

---

### `PATCH /api/inventory/rmas/{id}/`

- **Endpoint**: `PATCH /api/inventory/rmas/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/rmas/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "rma_number": "RMA-2026-0001",
  "quantity": "10.00",
  "reason": "Policy compliance / administrative action",
  "disposition": "RESTOCK",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "product": 1,
  "related_invoice": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "rma_number": "RMA-2026-0001",
  "quantity": "10.00",
  "reason": "Policy compliance / administrative action",
  "disposition": "RESTOCK",
  "status": "AUTHORIZED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "product": 1,
  "related_invoice": 1,
  "credit_note": 1,
  "created_by": 1
}
```

---

### `DELETE /api/inventory/rmas/{id}/`

- **Endpoint**: `DELETE /api/inventory/rmas/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/rmas/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/rmas/{id}/receive-rma/`

- **Endpoint**: `POST /api/inventory/rmas/{id}/receive-rma/`
- **Summary**: Receive RMA Returned Goods (Updates Stock/Quarantine & Issues Credit Note - STK-29)

#### Example Request

```http
POST /api/inventory/rmas/{id}/receive-rma/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "rma_number": "RMA-2026-0001",
  "quantity": "10.00",
  "reason": "Policy compliance / administrative action",
  "disposition": "RESTOCK",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "product": 1,
  "related_invoice": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "rma_number": "RMA-2026-0001",
  "quantity": "10.00",
  "reason": "Policy compliance / administrative action",
  "disposition": "RESTOCK",
  "status": "AUTHORIZED",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "customer": 1,
  "product": 1,
  "related_invoice": 1,
  "credit_note": 1,
  "created_by": 1
}
```

---

### `GET /api/inventory/scan/`

- **Endpoint**: `GET /api/inventory/scan/`
- **Summary**: Universal Barcode / QR Code / RFID Scanner Lookup for Products, Variants, Pallet Batches, or Warehouse Bins (`STK-03`)

#### Example Request

```http
GET /api/inventory/scan/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "query_params": {
    "code": "PALLET-QR-2026-100"
  }
}
```

#### Example Response (`200 OK`)

```json
{
  "matched_type": "PALLET_OR_BATCH_SERIAL",
  "batch_serial": {
    "id": 1,
    "batch_number": "BATCH-2026-11A",
    "serial_number": "",
    "pallet_qr_code": "PALLET-QR-2026-100",
    "quantity": "100.00",
    "unit_cost": "10.00",
    "status": "IN_STOCK"
  },
  "product": {
    "id": 1,
    "sku": "VACCINE-01",
    "name": "Cold Chain Vial",
    "unit_of_measure": "PCS"
  },
  "quantity": "100.00",
  "bin_location_path": "W > Aisle 1 > Shelf A > Bin B"
}
```

---

### `GET /api/inventory/stock-adjustments/`

- **Endpoint**: `GET /api/inventory/stock-adjustments/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/stock-adjustments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "adjustment_number": "ADJ-2026-0001",
      "quantity_delta": "string",
      "reason_code": "string",
      "notes": "Verified and recorded by administrator.",
      "is_approved": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "branch": 1,
      "product": "string",
      "journal_entry": "string",
      "adjusted_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/stock-adjustments/`

- **Endpoint**: `POST /api/inventory/stock-adjustments/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/stock-adjustments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "adjustment_number": "ADJ-2026-0001",
  "quantity_delta": "1000.00",
  "reason_code": "STOCK_COUNT",
  "notes": "Verified and recorded by administrator.",
  "is_approved": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "adjustment_number": "ADJ-2026-0001",
  "quantity_delta": "1000.00",
  "reason_code": "STOCK_COUNT",
  "notes": "Verified and recorded by administrator.",
  "is_approved": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1,
  "journal_entry": 1,
  "adjusted_by": 1
}
```

---

### `GET /api/inventory/stock-adjustments/{id}/`

- **Endpoint**: `GET /api/inventory/stock-adjustments/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/stock-adjustments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "adjustment_number": "ADJ-2026-0001",
  "quantity_delta": "1000.00",
  "reason_code": "STOCK_COUNT",
  "notes": "Verified and recorded by administrator.",
  "is_approved": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1,
  "journal_entry": 1,
  "adjusted_by": 1
}
```

---

### `PUT /api/inventory/stock-adjustments/{id}/`

- **Endpoint**: `PUT /api/inventory/stock-adjustments/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/stock-adjustments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "adjustment_number": "ADJ-2026-0001",
  "quantity_delta": "1000.00",
  "reason_code": "STOCK_COUNT",
  "notes": "Verified and recorded by administrator.",
  "is_approved": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "adjustment_number": "ADJ-2026-0001",
  "quantity_delta": "1000.00",
  "reason_code": "STOCK_COUNT",
  "notes": "Verified and recorded by administrator.",
  "is_approved": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1,
  "journal_entry": 1,
  "adjusted_by": 1
}
```

---

### `PATCH /api/inventory/stock-adjustments/{id}/`

- **Endpoint**: `PATCH /api/inventory/stock-adjustments/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/stock-adjustments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "adjustment_number": "ADJ-2026-0001",
  "quantity_delta": "1000.00",
  "reason_code": "STOCK_COUNT",
  "notes": "Verified and recorded by administrator.",
  "is_approved": true,
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "adjustment_number": "ADJ-2026-0001",
  "quantity_delta": "1000.00",
  "reason_code": "STOCK_COUNT",
  "notes": "Verified and recorded by administrator.",
  "is_approved": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "branch": 1,
  "product": 1,
  "journal_entry": 1,
  "adjusted_by": 1
}
```

---

### `DELETE /api/inventory/stock-adjustments/{id}/`

- **Endpoint**: `DELETE /api/inventory/stock-adjustments/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/stock-adjustments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/stock-levels/`

- **Endpoint**: `GET /api/inventory/stock-levels/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/stock-levels/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "product_sku": "string",
      "product_name": "string",
      "branch_code": "CMB-HQ",
      "available": "90.00",
      "needs_replenishment": "string",
      "on_hand": "100.00",
      "reserved": "10.00",
      "in_transit": "0.00",
      "quarantine_quantity": "0.00",
      "consignment_quantity": "0.00",
      "safety_stock": "15.00",
      "reorder_point": "25.00",
      "max_stock_level": "250.00",
      "restock_quantity": "50.00",
      "updated_at": "string",
      "tenant": 1,
      "branch": 1,
      "bin_location": "string",
      "product": "string"
    }
  ]
}
```

---

### `POST /api/inventory/stock-levels/`

- **Endpoint**: `POST /api/inventory/stock-levels/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/stock-levels/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "on_hand": "100.00",
  "reserved": "10.00",
  "in_transit": "0.00",
  "quarantine_quantity": "0.00",
  "consignment_quantity": "0.00",
  "safety_stock": "15.00",
  "reorder_point": "25.00",
  "max_stock_level": "250.00",
  "restock_quantity": "50.00",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "product_name": "sample_product_name",
  "branch_code": "CMB-HQ",
  "available": "90.00",
  "needs_replenishment": true,
  "on_hand": "100.00",
  "reserved": "10.00",
  "in_transit": "0.00",
  "quarantine_quantity": "0.00",
  "consignment_quantity": "0.00",
  "safety_stock": "15.00",
  "reorder_point": "25.00",
  "max_stock_level": "250.00",
  "restock_quantity": "50.00",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1
}
```

---

### `POST /api/inventory/stock-levels/auto-replenish/`

- **Endpoint**: `POST /api/inventory/stock-levels/auto-replenish/`
- **Summary**: Auto-Generate Purchase Requisitions for Items Below Min/Reorder Level (STK-33)

#### Example Request

```http
POST /api/inventory/stock-levels/auto-replenish/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "on_hand": "100.00",
  "reserved": "10.00",
  "in_transit": "0.00",
  "quarantine_quantity": "0.00",
  "consignment_quantity": "0.00",
  "safety_stock": "15.00",
  "reorder_point": "25.00",
  "max_stock_level": "250.00",
  "restock_quantity": "50.00",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "product_name": "sample_product_name",
  "branch_code": "CMB-HQ",
  "available": "90.00",
  "needs_replenishment": true,
  "on_hand": "100.00",
  "reserved": "10.00",
  "in_transit": "0.00",
  "quarantine_quantity": "0.00",
  "consignment_quantity": "0.00",
  "safety_stock": "15.00",
  "reorder_point": "25.00",
  "max_stock_level": "250.00",
  "restock_quantity": "50.00",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1
}
```

---

### `GET /api/inventory/stock-levels/reorder-alerts/`

- **Endpoint**: `GET /api/inventory/stock-levels/reorder-alerts/`
- **Summary**: Get Low-Stock / Reorder Replenishment Alerts (ERP-INV-006, STK-33)

#### Example Request

```http
GET /api/inventory/stock-levels/reorder-alerts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "product_name": "sample_product_name",
  "branch_code": "CMB-HQ",
  "available": "90.00",
  "needs_replenishment": true,
  "on_hand": "100.00",
  "reserved": "10.00",
  "in_transit": "0.00",
  "quarantine_quantity": "0.00",
  "consignment_quantity": "0.00",
  "safety_stock": "15.00",
  "reorder_point": "25.00",
  "max_stock_level": "250.00",
  "restock_quantity": "50.00",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1
}
```

---

### `GET /api/inventory/stock-levels/{id}/`

- **Endpoint**: `GET /api/inventory/stock-levels/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/stock-levels/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "product_name": "sample_product_name",
  "branch_code": "CMB-HQ",
  "available": "90.00",
  "needs_replenishment": true,
  "on_hand": "100.00",
  "reserved": "10.00",
  "in_transit": "0.00",
  "quarantine_quantity": "0.00",
  "consignment_quantity": "0.00",
  "safety_stock": "15.00",
  "reorder_point": "25.00",
  "max_stock_level": "250.00",
  "restock_quantity": "50.00",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1
}
```

---

### `PUT /api/inventory/stock-levels/{id}/`

- **Endpoint**: `PUT /api/inventory/stock-levels/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/stock-levels/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "on_hand": "100.00",
  "reserved": "10.00",
  "in_transit": "0.00",
  "quarantine_quantity": "0.00",
  "consignment_quantity": "0.00",
  "safety_stock": "15.00",
  "reorder_point": "25.00",
  "max_stock_level": "250.00",
  "restock_quantity": "50.00",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "product_name": "sample_product_name",
  "branch_code": "CMB-HQ",
  "available": "90.00",
  "needs_replenishment": true,
  "on_hand": "100.00",
  "reserved": "10.00",
  "in_transit": "0.00",
  "quarantine_quantity": "0.00",
  "consignment_quantity": "0.00",
  "safety_stock": "15.00",
  "reorder_point": "25.00",
  "max_stock_level": "250.00",
  "restock_quantity": "50.00",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1
}
```

---

### `PATCH /api/inventory/stock-levels/{id}/`

- **Endpoint**: `PATCH /api/inventory/stock-levels/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/stock-levels/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "on_hand": "100.00",
  "reserved": "10.00",
  "in_transit": "0.00",
  "quarantine_quantity": "0.00",
  "consignment_quantity": "0.00",
  "safety_stock": "15.00",
  "reorder_point": "25.00",
  "max_stock_level": "250.00",
  "restock_quantity": "50.00",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "product_name": "sample_product_name",
  "branch_code": "CMB-HQ",
  "available": "90.00",
  "needs_replenishment": true,
  "on_hand": "100.00",
  "reserved": "10.00",
  "in_transit": "0.00",
  "quarantine_quantity": "0.00",
  "consignment_quantity": "0.00",
  "safety_stock": "15.00",
  "reorder_point": "25.00",
  "max_stock_level": "250.00",
  "restock_quantity": "50.00",
  "updated_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1
}
```

---

### `DELETE /api/inventory/stock-levels/{id}/`

- **Endpoint**: `DELETE /api/inventory/stock-levels/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/stock-levels/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/stock-movements/`

- **Endpoint**: `GET /api/inventory/stock-movements/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/stock-movements/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "product_sku": "string",
      "branch_code": "CMB-HQ",
      "movement_type": "string",
      "quantity_change": "string",
      "unit_cost": "180000.00",
      "cogs_amount": "string",
      "before_on_hand": "string",
      "after_on_hand": "string",
      "reference_document": "GRN-2026-0001",
      "notes": "Verified and recorded by administrator.",
      "created_at": "string",
      "tenant": 1,
      "branch": 1,
      "bin_location": "string",
      "product": "string",
      "batch_serial": "string",
      "actor": "string"
    }
  ]
}
```

---

### `GET /api/inventory/stock-movements/{id}/`

- **Endpoint**: `GET /api/inventory/stock-movements/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/stock-movements/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "product_sku": "sample_product_sku",
  "branch_code": "CMB-HQ",
  "movement_type": "GRN_RECEIPT",
  "quantity_change": "1000.00",
  "unit_cost": "180000.00",
  "cogs_amount": "1000.00",
  "before_on_hand": "1000.00",
  "after_on_hand": "1000.00",
  "reference_document": "GRN-2026-0001",
  "notes": "Verified and recorded by administrator.",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "bin_location": 1,
  "product": 1,
  "batch_serial": 1,
  "actor": 1
}
```

---

### `GET /api/inventory/stock-transfers/`

- **Endpoint**: `GET /api/inventory/stock-transfers/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/stock-transfers/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "lines": "string",
      "transfer_number": "TRF-2026-0001",
      "transfer_date": "string",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "source_branch": "string",
      "destination_branch": "string",
      "source_location": "string",
      "destination_location": "string",
      "approved_by": "string",
      "created_by": "string"
    }
  ]
}
```

---

### `POST /api/inventory/stock-transfers/`

- **Endpoint**: `POST /api/inventory/stock-transfers/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/stock-transfers/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "status": "DRAFT",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1,
  "approved_by": 1,
  "created_by": 1
}
```

---

### `GET /api/inventory/stock-transfers/{id}/`

- **Endpoint**: `GET /api/inventory/stock-transfers/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/stock-transfers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "status": "DRAFT",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1,
  "approved_by": 1,
  "created_by": 1
}
```

---

### `PUT /api/inventory/stock-transfers/{id}/`

- **Endpoint**: `PUT /api/inventory/stock-transfers/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/stock-transfers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "status": "DRAFT",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1,
  "approved_by": 1,
  "created_by": 1
}
```

---

### `PATCH /api/inventory/stock-transfers/{id}/`

- **Endpoint**: `PATCH /api/inventory/stock-transfers/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/stock-transfers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "status": "DRAFT",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1,
  "approved_by": 1,
  "created_by": 1
}
```

---

### `DELETE /api/inventory/stock-transfers/{id}/`

- **Endpoint**: `DELETE /api/inventory/stock-transfers/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/stock-transfers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `POST /api/inventory/stock-transfers/{id}/approve-regional/`

- **Endpoint**: `POST /api/inventory/stock-transfers/{id}/approve-regional/`
- **Summary**: Approve Regional / Inter-Branch Stock Transfer (STK-11)

#### Example Request

```http
POST /api/inventory/stock-transfers/{id}/approve-regional/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "status": "DRAFT",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1,
  "approved_by": 1,
  "created_by": 1
}
```

---

### `POST /api/inventory/stock-transfers/{id}/dispatch_transfer/`

- **Endpoint**: `POST /api/inventory/stock-transfers/{id}/dispatch_transfer/`
- **Summary**: Dispatch Inter-Branch Stock Transfer (moves stock to In-Transit)

#### Example Request

```http
POST /api/inventory/stock-transfers/{id}/dispatch_transfer/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "status": "DRAFT",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1,
  "approved_by": 1,
  "created_by": 1
}
```

---

### `POST /api/inventory/stock-transfers/{id}/receive_transfer/`

- **Endpoint**: `POST /api/inventory/stock-transfers/{id}/receive_transfer/`
- **Summary**: Receive Inter-Branch Stock Transfer at Destination Branch

#### Example Request

```http
POST /api/inventory/stock-transfers/{id}/receive_transfer/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "lines": [
    {
      "product": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "lines": [
    {
      "id": 1,
      "product": "string",
      "product_sku": "string",
      "quantity": "10.00"
    }
  ],
  "transfer_number": "TRF-2026-0001",
  "transfer_date": "2026-11-23",
  "status": "DRAFT",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "source_branch": 1,
  "destination_branch": 1,
  "source_location": 1,
  "destination_location": 1,
  "approved_by": 1,
  "created_by": 1
}
```

---

### `GET /api/inventory/supplier-contracts/`

- **Endpoint**: `GET /api/inventory/supplier-contracts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/supplier-contracts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "contract_number": "CNT-2026-0001",
      "agreed_unit_cost": "175000.00",
      "discount_percent": "string",
      "lead_time_days": "string",
      "start_date": "string",
      "end_date": "string",
      "is_active": "string",
      "created_at": "string",
      "tenant": 1,
      "company": 1,
      "supplier": "string",
      "product": "string"
    }
  ]
}
```

---

### `POST /api/inventory/supplier-contracts/`

- **Endpoint**: `POST /api/inventory/supplier-contracts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/supplier-contracts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "contract_number": "CNT-2026-0001",
  "agreed_unit_cost": "175000.00",
  "discount_percent": "1000.00",
  "lead_time_days": 1,
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "supplier": 1,
  "product": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "contract_number": "CNT-2026-0001",
  "agreed_unit_cost": "175000.00",
  "discount_percent": "1000.00",
  "lead_time_days": 1,
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "supplier": 1,
  "product": 1
}
```

---

### `GET /api/inventory/supplier-contracts/{id}/`

- **Endpoint**: `GET /api/inventory/supplier-contracts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/supplier-contracts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "contract_number": "CNT-2026-0001",
  "agreed_unit_cost": "175000.00",
  "discount_percent": "1000.00",
  "lead_time_days": 1,
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "supplier": 1,
  "product": 1
}
```

---

### `PUT /api/inventory/supplier-contracts/{id}/`

- **Endpoint**: `PUT /api/inventory/supplier-contracts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/supplier-contracts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "contract_number": "CNT-2026-0001",
  "agreed_unit_cost": "175000.00",
  "discount_percent": "1000.00",
  "lead_time_days": 1,
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "supplier": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "contract_number": "CNT-2026-0001",
  "agreed_unit_cost": "175000.00",
  "discount_percent": "1000.00",
  "lead_time_days": 1,
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "supplier": 1,
  "product": 1
}
```

---

### `PATCH /api/inventory/supplier-contracts/{id}/`

- **Endpoint**: `PATCH /api/inventory/supplier-contracts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/supplier-contracts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "contract_number": "CNT-2026-0001",
  "agreed_unit_cost": "175000.00",
  "discount_percent": "1000.00",
  "lead_time_days": 1,
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_active": true,
  "tenant": 1,
  "company": 1,
  "supplier": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "contract_number": "CNT-2026-0001",
  "agreed_unit_cost": "175000.00",
  "discount_percent": "1000.00",
  "lead_time_days": 1,
  "start_date": "2026-11-23",
  "end_date": "2026-11-23",
  "is_active": true,
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "company": 1,
  "supplier": 1,
  "product": 1
}
```

---

### `DELETE /api/inventory/supplier-contracts/{id}/`

- **Endpoint**: `DELETE /api/inventory/supplier-contracts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/supplier-contracts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/temperature-logs/`

- **Endpoint**: `GET /api/inventory/temperature-logs/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/temperature-logs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "recorded_celsius": "4.50",
      "is_out_of_range": "string",
      "sensor_id": "string",
      "flagged_batches_count": "string",
      "recorded_at": "string",
      "tenant": 1,
      "bin_location": "string"
    }
  ]
}
```

---

### `POST /api/inventory/temperature-logs/`

- **Endpoint**: `POST /api/inventory/temperature-logs/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/temperature-logs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "recorded_celsius": "4.50",
  "sensor_id": "sample_sensor_id",
  "tenant": 1,
  "bin_location": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "recorded_celsius": "4.50",
  "is_out_of_range": false,
  "sensor_id": "sample_sensor_id",
  "flagged_batches_count": 1,
  "recorded_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "bin_location": 1
}
```

---

### `GET /api/inventory/temperature-logs/{id}/`

- **Endpoint**: `GET /api/inventory/temperature-logs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/temperature-logs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "recorded_celsius": "4.50",
  "is_out_of_range": false,
  "sensor_id": "sample_sensor_id",
  "flagged_batches_count": 1,
  "recorded_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "bin_location": 1
}
```

---

### `PUT /api/inventory/temperature-logs/{id}/`

- **Endpoint**: `PUT /api/inventory/temperature-logs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/temperature-logs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "recorded_celsius": "4.50",
  "sensor_id": "sample_sensor_id",
  "tenant": 1,
  "bin_location": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "recorded_celsius": "4.50",
  "is_out_of_range": false,
  "sensor_id": "sample_sensor_id",
  "flagged_batches_count": 1,
  "recorded_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "bin_location": 1
}
```

---

### `PATCH /api/inventory/temperature-logs/{id}/`

- **Endpoint**: `PATCH /api/inventory/temperature-logs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/temperature-logs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "recorded_celsius": "4.50",
  "sensor_id": "sample_sensor_id",
  "tenant": 1,
  "bin_location": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "recorded_celsius": "4.50",
  "is_out_of_range": false,
  "sensor_id": "sample_sensor_id",
  "flagged_batches_count": 1,
  "recorded_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "bin_location": 1
}
```

---

### `DELETE /api/inventory/temperature-logs/{id}/`

- **Endpoint**: `DELETE /api/inventory/temperature-logs/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/temperature-logs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/tool-checkouts/`

- **Endpoint**: `GET /api/inventory/tool-checkouts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/tool-checkouts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "serial_number": "SN-LP14-000991",
      "project_or_job_code": "string",
      "checked_out_date": "string",
      "due_return_date": "string",
      "calibration_due_date": "string",
      "returned_date": "string",
      "status": "string",
      "created_at": "string",
      "tenant": 1,
      "branch": 1,
      "tool_product": "string",
      "assigned_employee": "string"
    }
  ]
}
```

---

### `POST /api/inventory/tool-checkouts/`

- **Endpoint**: `POST /api/inventory/tool-checkouts/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/tool-checkouts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "serial_number": "SN-LP14-000991",
  "project_or_job_code": "sample_project_or_job_code",
  "checked_out_date": "2026-11-23",
  "due_return_date": "2026-11-23",
  "calibration_due_date": "2026-11-23",
  "returned_date": "2026-11-23",
  "status": "CHECKED_OUT",
  "tenant": 1,
  "branch": 1,
  "tool_product": 1,
  "assigned_employee": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "serial_number": "SN-LP14-000991",
  "project_or_job_code": "sample_project_or_job_code",
  "checked_out_date": "2026-11-23",
  "due_return_date": "2026-11-23",
  "calibration_due_date": "2026-11-23",
  "returned_date": "2026-11-23",
  "status": "CHECKED_OUT",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "tool_product": 1,
  "assigned_employee": 1
}
```

---

### `POST /api/inventory/tool-checkouts/check-overdue-tools/`

- **Endpoint**: `POST /api/inventory/tool-checkouts/check-overdue-tools/`
- **Summary**: Check for Overdue Tool Checkouts (>30 Days) & Send Alerts (STK-25)

#### Example Request

```http
POST /api/inventory/tool-checkouts/check-overdue-tools/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "serial_number": "SN-LP14-000991",
  "project_or_job_code": "sample_project_or_job_code",
  "checked_out_date": "2026-11-23",
  "due_return_date": "2026-11-23",
  "calibration_due_date": "2026-11-23",
  "returned_date": "2026-11-23",
  "status": "CHECKED_OUT",
  "tenant": 1,
  "branch": 1,
  "tool_product": 1,
  "assigned_employee": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "serial_number": "SN-LP14-000991",
  "project_or_job_code": "sample_project_or_job_code",
  "checked_out_date": "2026-11-23",
  "due_return_date": "2026-11-23",
  "calibration_due_date": "2026-11-23",
  "returned_date": "2026-11-23",
  "status": "CHECKED_OUT",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "tool_product": 1,
  "assigned_employee": 1
}
```

---

### `GET /api/inventory/tool-checkouts/{id}/`

- **Endpoint**: `GET /api/inventory/tool-checkouts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/tool-checkouts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "serial_number": "SN-LP14-000991",
  "project_or_job_code": "sample_project_or_job_code",
  "checked_out_date": "2026-11-23",
  "due_return_date": "2026-11-23",
  "calibration_due_date": "2026-11-23",
  "returned_date": "2026-11-23",
  "status": "CHECKED_OUT",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "tool_product": 1,
  "assigned_employee": 1
}
```

---

### `PUT /api/inventory/tool-checkouts/{id}/`

- **Endpoint**: `PUT /api/inventory/tool-checkouts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/tool-checkouts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "serial_number": "SN-LP14-000991",
  "project_or_job_code": "sample_project_or_job_code",
  "checked_out_date": "2026-11-23",
  "due_return_date": "2026-11-23",
  "calibration_due_date": "2026-11-23",
  "returned_date": "2026-11-23",
  "status": "CHECKED_OUT",
  "tenant": 1,
  "branch": 1,
  "tool_product": 1,
  "assigned_employee": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "serial_number": "SN-LP14-000991",
  "project_or_job_code": "sample_project_or_job_code",
  "checked_out_date": "2026-11-23",
  "due_return_date": "2026-11-23",
  "calibration_due_date": "2026-11-23",
  "returned_date": "2026-11-23",
  "status": "CHECKED_OUT",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "tool_product": 1,
  "assigned_employee": 1
}
```

---

### `PATCH /api/inventory/tool-checkouts/{id}/`

- **Endpoint**: `PATCH /api/inventory/tool-checkouts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/tool-checkouts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "serial_number": "SN-LP14-000991",
  "project_or_job_code": "sample_project_or_job_code",
  "checked_out_date": "2026-11-23",
  "due_return_date": "2026-11-23",
  "calibration_due_date": "2026-11-23",
  "returned_date": "2026-11-23",
  "status": "CHECKED_OUT",
  "tenant": 1,
  "branch": 1,
  "tool_product": 1,
  "assigned_employee": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "serial_number": "SN-LP14-000991",
  "project_or_job_code": "sample_project_or_job_code",
  "checked_out_date": "2026-11-23",
  "due_return_date": "2026-11-23",
  "calibration_due_date": "2026-11-23",
  "returned_date": "2026-11-23",
  "status": "CHECKED_OUT",
  "created_at": "2026-11-23T10:30:00+05:30",
  "tenant": 1,
  "branch": 1,
  "tool_product": 1,
  "assigned_employee": 1
}
```

---

### `DELETE /api/inventory/tool-checkouts/{id}/`

- **Endpoint**: `DELETE /api/inventory/tool-checkouts/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/tool-checkouts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---

### `GET /api/inventory/uom-conversions/`

- **Endpoint**: `GET /api/inventory/uom-conversions/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/uom-conversions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "count": 1,
  "next": "https://erp.devrious.com/files/sample.pdf",
  "previous": "https://erp.devrious.com/files/sample.pdf",
  "results": [
    {
      "id": 1,
      "uom_code": "BOX",
      "conversion_factor": "10.0000",
      "barcode": "4791234567890",
      "is_default_purchase_uom": "string",
      "is_default_sales_uom": "string",
      "tenant": 1,
      "product": "string"
    }
  ]
}
```

---

### `POST /api/inventory/uom-conversions/`

- **Endpoint**: `POST /api/inventory/uom-conversions/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
POST /api/inventory/uom-conversions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "uom_code": "BOX",
  "conversion_factor": "10.0000",
  "barcode": "4791234567890",
  "is_default_purchase_uom": true,
  "is_default_sales_uom": true,
  "tenant": 1,
  "product": 1
}
```

#### Example Response (`201 Created`)

```json
{
  "id": 1,
  "uom_code": "BOX",
  "conversion_factor": "10.0000",
  "barcode": "4791234567890",
  "is_default_purchase_uom": true,
  "is_default_sales_uom": true,
  "tenant": 1,
  "product": 1
}
```

---

### `GET /api/inventory/uom-conversions/{id}/`

- **Endpoint**: `GET /api/inventory/uom-conversions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
GET /api/inventory/uom-conversions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "uom_code": "BOX",
  "conversion_factor": "10.0000",
  "barcode": "4791234567890",
  "is_default_purchase_uom": true,
  "is_default_sales_uom": true,
  "tenant": 1,
  "product": 1
}
```

---

### `PUT /api/inventory/uom-conversions/{id}/`

- **Endpoint**: `PUT /api/inventory/uom-conversions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PUT /api/inventory/uom-conversions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "uom_code": "BOX",
  "conversion_factor": "10.0000",
  "barcode": "4791234567890",
  "is_default_purchase_uom": true,
  "is_default_sales_uom": true,
  "tenant": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "uom_code": "BOX",
  "conversion_factor": "10.0000",
  "barcode": "4791234567890",
  "is_default_purchase_uom": true,
  "is_default_sales_uom": true,
  "tenant": 1,
  "product": 1
}
```

---

### `PATCH /api/inventory/uom-conversions/{id}/`

- **Endpoint**: `PATCH /api/inventory/uom-conversions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
PATCH /api/inventory/uom-conversions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "uom_code": "BOX",
  "conversion_factor": "10.0000",
  "barcode": "4791234567890",
  "is_default_purchase_uom": true,
  "is_default_sales_uom": true,
  "tenant": 1,
  "product": 1
}
```

#### Example Response (`200 OK`)

```json
{
  "id": 1,
  "uom_code": "BOX",
  "conversion_factor": "10.0000",
  "barcode": "4791234567890",
  "is_default_purchase_uom": true,
  "is_default_sales_uom": true,
  "tenant": 1,
  "product": 1
}
```

---

### `DELETE /api/inventory/uom-conversions/{id}/`

- **Endpoint**: `DELETE /api/inventory/uom-conversions/{id}/`
- **Summary**: Multi-tenant data isolation mixin (ERP-PLAT-001, ERP-PLAT-004). Ensures each tenant only sees its own data, while Platform Admins can view all tenants. Also provides automatic tenant assignment on creation.

#### Example Request

```http
DELETE /api/inventory/uom-conversions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer <jwt_access_token>
```

#### Example Response (`204 No Content`)

```http
HTTP/1.1 204 No Content
```

---
