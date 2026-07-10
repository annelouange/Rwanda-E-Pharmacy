# Medical Engineering Blueprint

## Medical Safety Position

Rwanda E-Pharmacy must not behave like a normal online marketplace. Medicines are regulated health products. The platform must protect patients, support pharmacists, verify pharmacies, preserve prescription integrity, and maintain audit trails.

## Clinical Risk Categories

### Prescription Risk

Risks:

- Wrong medicine identified from image.
- Wrong dosage extracted.
- Expired prescription used.
- Prescription-only medicine requested without valid prescription.

Controls:

- OCR is assistant-only, not final authority.
- Pharmacist verification before dispensing.
- Prescription expiry and doctor/hospital fields.
- Clear patient consent for upload.
- Audit log of prescription access.

### Stock Risk

Risks:

- Patient travels because app says medicine exists but pharmacy is out of stock.
- Stock quantity is stale.

Controls:

- Show last updated time.
- Require pharmacy confirmation for reservation.
- Use stock freshness score.
- Auto-hide stale inventory after defined threshold.
- Penalize repeated inaccurate stock reports.

### Delivery Risk

Risks:

- Temperature-sensitive medicines mishandled.
- Restricted medicines delivered improperly.
- Medicine given to wrong person.

Controls:

- Delivery eligibility matrix.
- Responsible pharmacist approval.
- Trained delivery personnel.
- Identity confirmation at delivery.
- Chain-of-custody status tracking.
- Temperature/cold-chain flag where needed.

### Insurance Risk

Risks:

- Patient believes medicine is covered when it is not.
- Wrong insurance plan or coverage rule.

Controls:

- Display "coverage indication" separately from "final insurer approval."
- Keep plan effective dates.
- Let pharmacy/insurer confirm final coverage.
- Track coverage source and last update.

## Pharmacy Verification Model

Verification fields:

- Pharmacy legal name.
- License number.
- Rwanda FDA category.
- Responsible pharmacist or technician.
- Council registration number.
- Province, district, sector, cell.
- License expiry date.
- Phone and email.
- Operating hours.
- Delivery permission if applicable.

Verification sources:

- Rwanda FDA licensed premises lists.
- Submitted license documents.
- Manual admin review.
- Periodic re-verification.

## Medicine Master Data

Medicine fields:

- Generic name.
- Brand names.
- Active ingredient.
- Strength.
- Dosage form.
- Route.
- Category.
- Prescription status.
- Controlled/restricted flag.
- Storage requirements.
- Cold-chain flag.
- Common indications.
- Insurance coverage mapping.

## Public Health Analytics

Allowed analytics:

- Aggregated search demand.
- Medicine availability by district.
- Stock-out frequency.
- Price range trends.
- Chronic medicine demand patterns.

Disallowed without special legal basis:

- Individual prescription disclosure.
- Patient-level medicine history to government dashboards.
- Identifiable patient analytics.

## Safety-First Product Rules

- The platform does not diagnose.
- The platform does not replace doctors or pharmacists.
- Prescription OCR must be reviewed.
- Only verified pharmacies can dispense through the platform.
- Search ranking must prioritize safety, verification, availability, distance, price transparency, and insurance fit.

