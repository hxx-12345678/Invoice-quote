# Security and Compliance Policy - Quotiq

## 1. GDPR Compliance
Quotiq is committed to protecting the privacy of our users and their customers in accordance with the General Data Protection Regulation (GDPR).

### Data Subject Rights (Implemented April 2026)
- **Right to Access**: Users can view all their data via the Dashboard.
- **Right to Rectification**: Users can update their business profile and customer data at any time.
- **Right to Erasure (Right to be Forgotten)**: Users can permanently delete their account and all associated data via `DELETE /api/auth/account`.
- **Right to Portability**: Users can export their entire data set in machine-readable JSON format via `GET /api/auth/export-data`.
- **Consent Management**: Cookie consent banner for tracking and analytics preferences.

### Technical Controls for GDPR
- **Encryption at Rest**: All database data is encrypted using industry-standard AES-256 encryption.
- **Encryption in Transit**: All data transmitted between the client and server is encrypted using TLS 1.3.
- **Data Minimization**: We only collect data necessary for invoice generation and business management.
- **Privacy by Design**: All new features undergo a privacy impact assessment during development.

## 2. SOC 2 Type 2 Compliance (Trust Services Criteria)
We implement technical and organizational controls aligned with the SOC 2 Security, Availability, and Confidentiality criteria.

### Security Controls
- **Authentication**: Multi-factor authentication support (Planned) and strict JWT-based authentication with HS256 signing, audience validation, and issuer verification.
- **Rate Limiting**: Brute-force protection on all auth endpoints (max 5 attempts per 15 mins) and general API rate limiting (100 requests per 15 mins).
- **Hardened Headers**: Full implementation of Helmet.js with strict Content Security Policy (CSP), HSTS, and XSS protection.
- **Enhanced Audit Logging**: 
  - Authentication events (Login, Register, Logout)
  - Data Export & Account Deletion
  - Create/Update/Delete operations on Invoices, Customers, and Products
  - System-level errors and unauthorized access attempts
- **Least Privilege**: API endpoints enforce strict ownership checks; users can only access data belonging to their own `userId`.

### Availability & Confidentiality
- **Backup Strategy**: Daily automated database backups with 30-day retention.
- **Incident Response**: Documented process for breach detection, triage, and notification (within 72 hours for GDPR).
- **Uptime Monitoring**: Continuous monitoring of API and Database health.

## 3. Vulnerability Management
- **Secrets Management**: No API keys or database credentials are stored in the source code. All secrets are managed via environment variables.
- **Dependency Scanning**: Automated audits of packages to ensure no known vulnerabilities are introduced.
- **Input Validation**: Every API endpoint uses strict schema validation (Zod) to prevent injection attacks and XSS.

---
*Last Updated: April 26, 2026*
