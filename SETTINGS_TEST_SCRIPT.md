# Quotiq Settings Component - E2E Test Script

## User Credentials
- **Email**: `cptjacksprw@gmail.com`
- **Password**: `Player@123`

## Prerequisites
- Server is running (Backend & Frontend)
- Browser console is open to monitor API calls and errors

---

## Test Scenario 1: Authentication & Navigation
1. [ ] Navigate to `/login`
2. [ ] Enter `cptjacksprw@gmail.com` and `Player@123`
3. [ ] Verify successful login and redirect to dashboard
4. [ ] Click on "Settings" in the sidebar
5. [ ] Verify "Settings" view loads with "Business" tab active by default

## Test Scenario 2: Business Profile Tab
1. [ ] **Read Verification**: Check if Business Name, Email, and Phone are pre-populated correctly.
2. [ ] **Update Test**: Change "Business Name" to "Quotiq Enterprise Solutions"
3. [ ] **Update Test**: Change "Address" to a new value
4. [ ] **Save Verification**: Click "Save Business Profile"
5. [ ] **Persistence Check**: Refresh the browser and verify the changes persist in the UI.
6. [ ] **API Check**: Verify `PUT /api/business` was called with correct payload.

## Test Scenario 3: Billing Settings Tab
1. [ ] Click on "Billing" tab
2. [ ] **Read Verification**: Check default currency and tax system.
3. [ ] **Update Test**: Change "Default Currency" to "USD"
4. [ ] **Update Test**: Toggle "Tax Inclusive Pricing"
5. [ ] **Save Verification**: Click "Save Settings" (Verify "Saved successfully" toast)
6. [ ] **Logic Check**: Verify "Default Tax Rate" dropdown options change when switching from "GST" to "VAT".

## Test Scenario 4: Bank Details Tab
1. [ ] Click on "Bank" tab
2. [ ] **Update Test**: Fill in Bank Name, Account Number, and IFSC Code.
3. [ ] **Save Verification**: Click "Save Business Profile" (Since bank details are part of profile)
4. [ ] **Persistence Check**: Navigate away to "Dashboard" and back to "Settings > Bank" to verify data remains.

## Test Scenario 5: Template Tab
1. [ ] Click on "Template" tab
2. [ ] **Update Test**: Change "Primary Color" using the color picker or preset.
3. [ ] **Update Test**: Change "Font Family" to "Inter" or "Roboto".
4. [ ] **Save Verification**: Click "Save Template"
5. [ ] **Visual Check**: Open any invoice preview and verify the new color/font is applied.

## Test Scenario 6: Compliance Tab (GDPR/SOC 2)
1. [ ] Click on "Compliance" tab
2. [ ] **Data Export Test**: Click "Export Your Data"
    - [ ] Verify browser triggers a JSON file download.
    - [ ] Verify toast notification for successful export.
3. [ ] **Security Awareness**: Verify links to Privacy and Security policies are visible and working.
4. [ ] **Account Deletion (DRY RUN)**: Click "Delete Account"
    - [ ] Verify confirmation dialog appears.
    - [ ] Click "Cancel" and verify account is NOT deleted.

## Test Scenario 7: State Management & Persistence
1. [ ] Navigate through all tabs (Business -> Billing -> Bank -> Template -> Compliance)
2. [ ] Verify active tab state is maintained correctly.
3. [ ] Refresh page on each tab and verify it reloads the same tab (if persistence is implemented) or defaults to Business.

---

## Issue Log
| ID | Component | Tab | Description | Severity | Status |
|----|-----------|-----|-------------|----------|--------|
| | | | | | |
