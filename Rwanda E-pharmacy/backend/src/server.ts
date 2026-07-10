import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import multer from 'multer'
import morgan from 'morgan'
import { z } from 'zod'
import { inventory, medicines, pharmacies } from './data'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 4000)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
})

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

app.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'rwanda-epharmacy-api',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/medicines/search', (request, response) => {
  const schema = z.object({
    q: z.string().optional().default(''),
    district: z.string().optional(),
    insurance: z.string().optional(),
    delivery: z.coerce.boolean().optional(),
  })
  const query = schema.parse(request.query)
  const normalized = query.q.toLowerCase()

  const results = inventory
    .map((item) => {
      const medicine = medicines.find((candidate) => candidate.id === item.medicineId)
      const pharmacy = pharmacies.find((candidate) => candidate.id === item.pharmacyId)

      if (!medicine || !pharmacy) {
        return null
      }

      return {
        inventoryId: item.id,
        medicine,
        pharmacy,
        quantity: item.quantity,
        price: item.price,
        updatedAt: item.updatedAt,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => {
      const matchesMedicine =
        !normalized ||
        item.medicine.name.toLowerCase().includes(normalized) ||
        item.medicine.genericName.toLowerCase().includes(normalized)
      const matchesDistrict =
        !query.district || item.pharmacy.district === query.district
      const matchesInsurance =
        !query.insurance || item.pharmacy.acceptedInsurance.includes(query.insurance)
      const matchesDelivery = !query.delivery || item.pharmacy.allowsDelivery

      return matchesMedicine && matchesDistrict && matchesInsurance && matchesDelivery
    })

  response.json({ results })
})

app.get('/api/pharmacies', (_request, response) => {
  response.json({ pharmacies })
})

app.post('/api/prescriptions/analyze', upload.single('prescription'), (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: 'Prescription file is required.' })
    return
  }

  const rawText = request.file.buffer.toString('utf8')
  const searchableText = `${request.file.originalname} ${rawText}`
    .replace(/[^a-zA-Z0-9\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const normalizedText = searchableText.toLowerCase()

  const matches = medicines
    .filter((medicine) => {
      const names = [medicine.name, medicine.genericName].map((name) => name.toLowerCase())
      return names.some((name) => normalizedText.includes(name))
    })
    .map((medicine) => ({
      id: medicine.id,
      name: medicine.name,
      genericName: medicine.genericName,
      category: medicine.category,
      prescriptionRequired: medicine.prescriptionRequired,
      confidence: normalizedText.includes(medicine.name.toLowerCase()) ? 0.92 : 0.78,
    }))

  const availableMatches = matches.map((medicine) => {
    const stock = inventory
      .filter((item) => item.medicineId === medicine.id && item.quantity > 0)
      .map((item) => {
        const pharmacy = pharmacies.find((candidate) => candidate.id === item.pharmacyId)
        return pharmacy
          ? {
              pharmacyId: pharmacy.id,
              pharmacyName: pharmacy.name,
              district: pharmacy.district,
              quantity: item.quantity,
              price: item.price,
              acceptedInsurance: pharmacy.acceptedInsurance,
              delivery: pharmacy.allowsDelivery,
            }
          : null
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))

    return {
      ...medicine,
      availablePharmacies: stock,
    }
  })

  response.json({
    fileName: request.file.originalname,
    matchedMedicines: availableMatches,
    extractedTextPreview: searchableText.slice(0, 240),
    message: matches.length
      ? 'Prescription analyzed and medicines matched to stock.'
      : 'Prescription uploaded, but no medicine names were confidently detected.',
  })
})

app.get('/api/analytics/overview', (_request, response) => {
  response.json({
    metrics: {
      verifiedPharmacies: pharmacies.length,
      medicinesTracked: medicines.length,
      stockAlerts: inventory.filter((item) => item.quantity < 20).length,
      prescriptionUploadsToday: 24,
    },
    demandByDistrict: [
      { district: 'Kigali', searches: 430, stockouts: 12 },
      { district: 'Huye', searches: 210, stockouts: 19 },
      { district: 'Musanze', searches: 260, stockouts: 14 },
      { district: 'Rubavu', searches: 190, stockouts: 22 },
    ],
  })
})

app.post('/api/reservations', (request, response) => {
  const schema = z.object({
    inventoryId: z.string(),
    patientName: z.string().min(2),
    phone: z.string().min(7),
    quantity: z.number().int().positive(),
    deliveryRequested: z.boolean().default(false),
  })
  const reservation = schema.parse(request.body)

  response.status(201).json({
    id: `res_${Date.now()}`,
    status: 'REQUESTED',
    ...reservation,
    message: 'Reservation request created for pharmacy confirmation.',
  })
})

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' })
})

app.listen(port, () => {
  console.log(`Rwanda E-Pharmacy API running on http://localhost:${port}`)
})
