const medicines = [
  { id: 'med_amlodipine', name: 'Amlodipine', genericName: 'Amlodipine', category: 'Hypertension', prescriptionRequired: true },
  { id: 'med_metformin', name: 'Metformin', genericName: 'Metformin', category: 'Diabetes', prescriptionRequired: true },
  { id: 'med_paracetamol', name: 'Paracetamol', genericName: 'Acetaminophen', category: 'Pain relief', prescriptionRequired: false },
  { id: 'med_salbutamol', name: 'Salbutamol', genericName: 'Albuterol', category: 'Respiratory', prescriptionRequired: true },
  { id: 'med_insulin', name: 'Insulin', genericName: 'Insulin', category: 'Diabetes', prescriptionRequired: true },
]

const stock = {
  med_amlodipine: [{ pharmacyName: 'Precious Pharmacy Ltd', district: 'Gasabo', quantity: 38, price: 3200, acceptedInsurance: ['Mutuelle', 'RSSB', 'Private'], delivery: true }],
  med_metformin: [{ pharmacyName: 'Ntibarwiga Pharmacy Ltd', district: 'Musanze', quantity: 52, price: 2500, acceptedInsurance: ['RSSB', 'MMI', 'Private'], delivery: true }],
  med_paracetamol: [{ pharmacyName: 'Kivu Beach Pharmacy Ltd', district: 'Rubavu', quantity: 120, price: 900, acceptedInsurance: ['Mutuelle', 'Private'], delivery: true }],
  med_salbutamol: [{ pharmacyName: 'Pharmacie de Butare Ltd', district: 'Huye', quantity: 18, price: 4100, acceptedInsurance: ['Mutuelle', 'MMI'], delivery: false }],
  med_insulin: [{ pharmacyName: 'Kigali Hospital Pharmacy', district: 'Nyarugenge', quantity: 9, price: 11800, acceptedInsurance: ['RSSB', 'Private'], delivery: false }],
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => resolve(Buffer.concat(chunks)))
    request.on('error', reject)
  })
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const body = await readRequestBody(request)
  const searchableText = body
    .toString('utf8')
    .replace(/[^a-zA-Z0-9\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const normalizedText = searchableText.toLowerCase()

  const matchedMedicines = medicines
    .filter((medicine) => [medicine.name, medicine.genericName].some((name) => normalizedText.includes(name.toLowerCase())))
    .map((medicine) => ({
      ...medicine,
      confidence: normalizedText.includes(medicine.name.toLowerCase()) ? 0.92 : 0.78,
      availablePharmacies: stock[medicine.id] ?? [],
    }))

  response.status(200).json({
    fileName: 'prescription-upload',
    matchedMedicines,
    extractedTextPreview: searchableText.slice(0, 240),
    message: matchedMedicines.length
      ? 'Prescription analyzed and medicines matched to stock.'
      : 'Prescription uploaded, but no medicine names were confidently detected.',
  })
}
