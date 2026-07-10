# Database, API, and Integrations

## Core Database Tables

Identity:

- users
- roles
- user_sessions
- password_resets

Patients:

- patient_profiles
- caregiver_links
- patient_insurance
- chronic_medicine_profiles

Pharmacies:

- pharmacies
- pharmacy_staff
- pharmacy_verification_documents
- pharmacy_operating_hours
- pharmacy_insurance_partners

Medicines:

- medicines
- medicine_categories
- medicine_brands
- active_ingredients
- medicine_aliases

Inventory:

- pharmacy_inventory
- stock_movements
- stock_alerts
- expiry_alerts

Prescriptions:

- prescriptions
- prescription_items
- prescription_access_logs

Reservations and Delivery:

- reservations
- reservation_items
- delivery_requests
- delivery_tracking_events

Insurance:

- insurance_companies
- insurance_plans
- medicine_coverage_rules

Analytics and Compliance:

- analytics_events
- audit_logs
- data_exports
- advertisements

## API Groups

Auth:

- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/refresh`
- POST `/auth/logout`

Medicine:

- GET `/medicines/search`
- GET `/medicines/:id`
- POST `/admin/medicines`
- PATCH `/admin/medicines/:id`

Pharmacy:

- POST `/pharmacies/register`
- GET `/pharmacies/nearby`
- GET `/pharmacies/:id`
- PATCH `/pharmacies/:id/profile`
- POST `/admin/pharmacies/:id/verify`

Inventory:

- GET `/pharmacy/inventory`
- POST `/pharmacy/inventory`
- PATCH `/pharmacy/inventory/:id`
- GET `/pharmacy/stock-alerts`

Prescription:

- POST `/prescriptions/upload`
- GET `/prescriptions/:id`
- POST `/prescriptions/:id/items/verify`

Reservation:

- POST `/reservations`
- GET `/reservations`
- PATCH `/pharmacy/reservations/:id/status`

Insurance:

- GET `/insurance/companies`
- GET `/insurance/coverage`
- POST `/insurance/coverage-rules`

Delivery:

- POST `/delivery/request`
- PATCH `/delivery/:id/status`
- GET `/delivery/:id/tracking`

Analytics:

- GET `/analytics/demand`
- GET `/analytics/stockouts`
- GET `/analytics/prices`

## Integration Strategy

MVP integrations:

- SMS provider for notifications.
- Email provider.
- Object storage.
- Map/location service.
- CSV import for medicine and pharmacy seed data.

Phase 2 integrations:

- Pharmacy chains.
- Insurance coverage imports.
- Payment provider.
- Delivery partner.

Phase 3 integrations:

- Hospital e-prescription systems.
- National health information exchange where approved.
- Government reporting tools.
- Distributor stock feeds.

## Integration Principle

The system must work without deep integrations first. Manual and CSV workflows should support early adoption. APIs can be added as partners mature.

