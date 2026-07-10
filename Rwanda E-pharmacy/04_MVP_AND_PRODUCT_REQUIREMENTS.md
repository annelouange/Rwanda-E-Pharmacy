# MVP and Product Requirements

## MVP Goal

Build a credible, usable, market-ready MVP that proves Rwanda E-Pharmacy can connect patients to verified pharmacy stock safely and transparently.

## MVP Scope

### Patient App

- Register and login.
- Search medicine.
- Upload prescription.
- Select location.
- View pharmacy results.
- Compare price, distance, insurance, availability, and last update.
- Reserve medicine.
- Request delivery where eligible.
- Receive notifications.

### Pharmacy Portal

- Register pharmacy.
- Submit verification details.
- Manage profile.
- Add and update stock.
- Set price and expiry.
- Manage reservations.
- Confirm or reject medicine availability.
- View low-stock alerts.
- Configure accepted insurance.

### Admin Portal

- Verify pharmacies.
- Manage medicine database.
- Manage users and roles.
- Review audit logs.
- Monitor price and stock anomalies.
- Approve advertisements.
- View aggregate analytics.

### Insurance Portal

- Manage company profile.
- Configure accepted medicine coverage.
- Map coverage to plans.
- View pharmacy partnerships.

### Government Analytics Portal

- View aggregated medicine demand.
- View stock-out patterns.
- View district availability.
- Export privacy-safe reports.

## Main User Stories

Patient:

- As a patient, I want to search a medicine and see the nearest pharmacies that have it.
- As a patient, I want to know if my insurance is accepted before I travel.
- As a patient with diabetes or hypertension, I want refill reminders and delivery options.

Pharmacy:

- As a pharmacy manager, I want to update stock quickly so patients see accurate availability.
- As a pharmacist, I want to confirm reservations before the patient travels.
- As a pharmacy owner, I want demand reports to know what to restock.

Admin:

- As an admin, I want to verify pharmacies using license data before they appear publicly.
- As an admin, I want suspicious price or stock behavior flagged.

Insurance:

- As an insurance officer, I want to update which medicines are supported and which pharmacies work with us.

Government:

- As a government analyst, I want district-level medicine availability and shortage indicators without seeing patient identities.

## Acceptance Criteria

The MVP is acceptable when:

- A patient can search and find at least one available medicine from verified pharmacies.
- A pharmacy can update inventory and receive reservations.
- Admin can verify or reject pharmacies.
- Prescription images are private and access-controlled.
- Results show price, distance, insurance support, and last-stock-update timestamp.
- Government analytics are aggregated and privacy-safe.
- Audit logs exist for sensitive actions.

