import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('RwandaEPharmacy2026!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rwanda-epharmacy.rw' },
    update: {},
    create: {
      email: 'admin@rwanda-epharmacy.rw',
      fullName: 'Platform Admin',
      passwordHash,
      role: UserRole.ADMIN,
    },
  })

  await prisma.patient.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      district: 'Kigali',
      insuranceName: 'Mutuelle',
    },
  })

  const pharmacy = await prisma.pharmacy.upsert({
    where: { licenseNumber: 'RWA-FDA-PH-001' },
    update: {},
    create: {
      name: 'Kigali Care Pharmacy',
      licenseNumber: 'RWA-FDA-PH-001',
      contactEmail: 'care@example.rw',
      contactPhone: '+250780000001',
      district: 'Kigali',
      sector: 'Nyarugenge',
      latitude: -1.9509,
      longitude: 30.0589,
      status: 'VERIFIED',
      isVerified: true,
      allowsDelivery: true,
      acceptedInsurance: ['Mutuelle', 'RSSB', 'Private'],
    },
  })

  const medicine = await prisma.medicine.upsert({
    where: { id: 'seed_amlodipine' },
    update: {},
    create: {
      id: 'seed_amlodipine',
      name: 'Amlodipine',
      genericName: 'Amlodipine',
      category: 'Hypertension',
      dosageForm: 'Tablet',
      strength: '5mg',
      prescriptionRequired: true,
    },
  })

  await prisma.pharmacyInventory.upsert({
    where: {
      pharmacyId_medicineId: {
        pharmacyId: pharmacy.id,
        medicineId: medicine.id,
      },
    },
    update: { quantity: 38, price: 3200 },
    create: {
      pharmacyId: pharmacy.id,
      medicineId: medicine.id,
      quantity: 38,
      price: 3200,
    },
  })
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
