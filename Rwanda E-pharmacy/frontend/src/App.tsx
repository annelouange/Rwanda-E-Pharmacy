import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import {
  Activity,
  Building2,
  Camera,
  CheckCircle2,
  FileText,
  LockKeyhole,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Truck,
  UploadCloud,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import heroImage from './assets/hero-pharmacy.png'
import logoImage from './assets/rwanda-epharmacy-logo-transparent.png'
import mohLogo from './assets/partner-moh.png'
import rbcLogo from './assets/partner-rbc.png'
import './index.css'

type Role = 'patient' | 'pharmacy' | 'government' | 'insurance' | 'admin'

type Listing = {
  medicine: string
  pharmacy: string
  district: string
  latitude: number
  longitude: number
  price: number
  stock: number
  insurance: string[]
  delivery: boolean
  updated: string
}

type UserLocation = {
  latitude: number
  longitude: number
  accuracy: number
}

type SearchResult = Listing & {
  distanceKm: number | null
}

type ReservationDraft = {
  listing: SearchResult
  patientName: string
  phone: string
  quantity: number
  delivery: boolean
}

type LocationSource = 'gps' | 'district' | null

type DistrictCenter = {
  latitude: number
  longitude: number
}

type PrescriptionStage = {
  label: string
  detail: string
}

type PrescriptionMedicine = {
  id: string
  name: string
  genericName: string
  category: string
  confidence: number
}

type PrescriptionAnalysis = {
  fileName: string
  matchedMedicines: PrescriptionMedicine[]
  message: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const pharmacyIcon = L.divIcon({
  className: 'map-pin pharmacy-pin',
  html: '<span></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

const selectedPharmacyIcon = L.divIcon({
  className: 'map-pin selected-pharmacy-pin',
  html: '<span></span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const userIcon = L.divIcon({
  className: 'map-pin user-pin',
  html: '<span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const districtOptions = [
  'All',
  'Bugesera',
  'Burera',
  'Gakenke',
  'Gasabo',
  'Gatsibo',
  'Gicumbi',
  'Gisagara',
  'Huye',
  'Kamonyi',
  'Karongi',
  'Kayonza',
  'Kicukiro',
  'Kirehe',
  'Muhanga',
  'Musanze',
  'Ngoma',
  'Ngororero',
  'Nyabihu',
  'Nyagatare',
  'Nyamagabe',
  'Nyamasheke',
  'Nyanza',
  'Nyarugenge',
  'Nyaruguru',
  'Rubavu',
  'Ruhango',
  'Rulindo',
  'Rusizi',
  'Rutsiro',
  'Rwamagana',
]

const insuranceOptions = [
  'All',
  'Mutuelle',
  'RSSB',
  'MMI',
  'Radiant',
  'Sanlam',
  'Prime',
  'Private',
]

const districtCenters: Record<string, DistrictCenter> = {
  Bugesera: { latitude: -2.1509, longitude: 30.1185 },
  Burera: { latitude: -1.4836, longitude: 29.8336 },
  Gakenke: { latitude: -1.7042, longitude: 29.7856 },
  Gasabo: { latitude: -1.9092, longitude: 30.1127 },
  Gatsibo: { latitude: -1.5967, longitude: 30.4566 },
  Gicumbi: { latitude: -1.5617, longitude: 30.0475 },
  Gisagara: { latitude: -2.5889, longitude: 29.8336 },
  Huye: { latitude: -2.5967, longitude: 29.7394 },
  Kamonyi: { latitude: -2.0025, longitude: 29.9219 },
  Karongi: { latitude: -2.1636, longitude: 29.3539 },
  Kayonza: { latitude: -1.8856, longitude: 30.6279 },
  Kicukiro: { latitude: -1.9906, longitude: 30.1044 },
  Kirehe: { latitude: -2.2553, longitude: 30.7317 },
  Muhanga: { latitude: -2.0845, longitude: 29.7527 },
  Musanze: { latitude: -1.4998, longitude: 29.6348 },
  Ngoma: { latitude: -2.1553, longitude: 30.5427 },
  Ngororero: { latitude: -1.8673, longitude: 29.6332 },
  Nyabihu: { latitude: -1.6564, longitude: 29.5539 },
  Nyagatare: { latitude: -1.2978, longitude: 30.3285 },
  Nyamagabe: { latitude: -2.4694, longitude: 29.5753 },
  Nyamasheke: { latitude: -2.3447, longitude: 29.1478 },
  Nyanza: { latitude: -2.3519, longitude: 29.7509 },
  Nyarugenge: { latitude: -1.9441, longitude: 30.0619 },
  Nyaruguru: { latitude: -2.6939, longitude: 29.5414 },
  Rubavu: { latitude: -1.6792, longitude: 29.2569 },
  Ruhango: { latitude: -2.2227, longitude: 29.7824 },
  Rulindo: { latitude: -1.7244, longitude: 29.9927 },
  Rusizi: { latitude: -2.4851, longitude: 28.9075 },
  Rutsiro: { latitude: -1.9472, longitude: 29.3125 },
  Rwamagana: { latitude: -1.9487, longitude: 30.4347 },
}

const prescriptionStages: PrescriptionStage[] = [
  {
    label: 'Uploading prescription',
    detail: 'Saving the file securely.',
  },
  {
    label: 'Reading medicine names',
    detail: 'Checking the prescription image for medicine names.',
  },
  {
    label: 'Matching medicines',
    detail: 'Looking for pharmacies with available stock.',
  },
  {
    label: 'Checking insurance',
    detail: 'Comparing pharmacy insurance support.',
  },
  {
    label: 'Ready',
    detail: 'Nearby pharmacies with stock are ready below.',
  },
]

const listings: Listing[] = [
  {
    medicine: 'Amlodipine',
    pharmacy: 'Precious Pharmacy Ltd',
    district: 'Gasabo',
    latitude: -1.9509,
    longitude: 30.0589,
    price: 3200,
    stock: 38,
    insurance: ['Mutuelle', 'RSSB', 'Private'],
    delivery: true,
    updated: '12 min ago',
  },
  {
    medicine: 'Metformin',
    pharmacy: 'Ntibarwiga Pharmacy Ltd',
    district: 'Musanze',
    latitude: -1.4998,
    longitude: 29.6348,
    price: 2500,
    stock: 52,
    insurance: ['RSSB', 'MMI', 'Private'],
    delivery: true,
    updated: '8 min ago',
  },
  {
    medicine: 'Paracetamol',
    pharmacy: 'Kivu Beach Pharmacy Ltd',
    district: 'Rubavu',
    latitude: -1.6792,
    longitude: 29.2569,
    price: 900,
    stock: 120,
    insurance: ['Mutuelle', 'Private'],
    delivery: true,
    updated: '21 min ago',
  },
  {
    medicine: 'Salbutamol',
    pharmacy: 'Pharmacie de Butare Ltd',
    district: 'Huye',
    latitude: -2.5967,
    longitude: 29.7394,
    price: 4100,
    stock: 18,
    insurance: ['Mutuelle', 'MMI'],
    delivery: false,
    updated: '1 hr ago',
  },
  {
    medicine: 'Insulin',
    pharmacy: 'Kigali Hospital Pharmacy',
    district: 'Nyarugenge',
    latitude: -1.9441,
    longitude: 30.0619,
    price: 11800,
    stock: 9,
    insurance: ['RSSB', 'Private'],
    delivery: false,
    updated: '5 min ago',
  },
  {
    medicine: 'Amoxicillin',
    pharmacy: 'Stream Pharmacy Ltd',
    district: 'Gasabo',
    latitude: -1.9107,
    longitude: 30.1127,
    price: 2800,
    stock: 44,
    insurance: ['Mutuelle', 'RSSB', 'MMI'],
    delivery: true,
    updated: '18 min ago',
  },
  {
    medicine: 'Ceftriaxone',
    pharmacy: 'Aurore Pharmacy Ltd',
    district: 'Gasabo',
    latitude: -1.9107,
    longitude: 30.1127,
    price: 6800,
    stock: 16,
    insurance: ['RSSB', 'Private'],
    delivery: false,
    updated: '30 min ago',
  },
  {
    medicine: 'Ibuprofen',
    pharmacy: 'Van Pharmacy Ltd',
    district: 'Kayonza',
    latitude: -1.8856,
    longitude: 30.6279,
    price: 1400,
    stock: 63,
    insurance: ['Mutuelle', 'Private'],
    delivery: true,
    updated: '23 min ago',
  },
  {
    medicine: 'Losartan',
    pharmacy: 'Abatesi Pharmacy Ltd',
    district: 'Gatsibo',
    latitude: -1.5967,
    longitude: 30.4566,
    price: 3900,
    stock: 21,
    insurance: ['RSSB', 'MMI', 'Private'],
    delivery: true,
    updated: '40 min ago',
  },
  {
    medicine: 'Azithromycin',
    pharmacy: 'Treah Pharmacy Ltd',
    district: 'Rwamagana',
    latitude: -1.9487,
    longitude: 30.4347,
    price: 5200,
    stock: 28,
    insurance: ['Mutuelle', 'Private'],
    delivery: true,
    updated: '16 min ago',
  },
  {
    medicine: 'Omeprazole',
    pharmacy: 'Medigate Pharmacy Nyagasambu',
    district: 'Rwamagana',
    latitude: -1.9487,
    longitude: 30.4347,
    price: 2400,
    stock: 57,
    insurance: ['Mutuelle', 'RSSB', 'Private'],
    delivery: false,
    updated: '27 min ago',
  },
  {
    medicine: 'Cetirizine',
    pharmacy: 'Adonai Pharmacy Ltd',
    district: 'Rwamagana',
    latitude: -1.9487,
    longitude: 30.4347,
    price: 1200,
    stock: 72,
    insurance: ['Private'],
    delivery: true,
    updated: '9 min ago',
  },
  {
    medicine: 'Atorvastatin',
    pharmacy: 'Sainte Rita Pharmacy Ltd',
    district: 'Nyagatare',
    latitude: -1.2978,
    longitude: 30.3285,
    price: 4600,
    stock: 19,
    insurance: ['RSSB', 'Private'],
    delivery: false,
    updated: '52 min ago',
  },
  {
    medicine: 'ORS',
    pharmacy: 'Bona Curare Pharma Limited',
    district: 'Rusizi',
    latitude: -2.4851,
    longitude: 28.9075,
    price: 700,
    stock: 95,
    insurance: ['Mutuelle', 'Private'],
    delivery: true,
    updated: '15 min ago',
  },
  {
    medicine: 'Ferrous Sulfate',
    pharmacy: 'Rinda Pharmacy Ltd',
    district: 'Rubavu',
    latitude: -1.6792,
    longitude: 29.2569,
    price: 1600,
    stock: 34,
    insurance: ['Mutuelle', 'RSSB'],
    delivery: true,
    updated: '12 min ago',
  },
  {
    medicine: 'Vitamin C',
    pharmacy: 'Galena Pharmacy Ltd',
    district: 'Kicukiro',
    latitude: -1.9906,
    longitude: 30.1044,
    price: 1800,
    stock: 88,
    insurance: ['Private'],
    delivery: true,
    updated: '7 min ago',
  },
  {
    medicine: 'Aspirin',
    pharmacy: 'Civitas Pharmacy Ltd',
    district: 'Nyarugenge',
    latitude: -1.9441,
    longitude: 30.0619,
    price: 1100,
    stock: 67,
    insurance: ['Mutuelle', 'RSSB', 'Private'],
    delivery: true,
    updated: '19 min ago',
  },
  {
    medicine: 'Hydrochlorothiazide',
    pharmacy: 'Salama-One Pharmacy Ltd',
    district: 'Gasabo',
    latitude: -1.9564,
    longitude: 30.1044,
    price: 2100,
    stock: 31,
    insurance: ['Mutuelle', 'RSSB'],
    delivery: true,
    updated: '34 min ago',
  },
  {
    medicine: 'Ciprofloxacin',
    pharmacy: 'Taqwa Pharmacy Ltd',
    district: 'Bugesera',
    latitude: -2.1509,
    longitude: 30.1185,
    price: 3600,
    stock: 23,
    insurance: ['Mutuelle', 'Private'],
    delivery: false,
    updated: '45 min ago',
  },
  {
    medicine: 'Diclofenac',
    pharmacy: 'Arlomed Pharmacy Ltd',
    district: 'Rulindo',
    latitude: -1.7244,
    longitude: 29.9927,
    price: 1500,
    stock: 48,
    insurance: ['Mutuelle', 'Private'],
    delivery: true,
    updated: '28 min ago',
  },
]

const demandData = [
  { district: 'Kigali', searches: 430, stockouts: 12 },
  { district: 'Huye', searches: 210, stockouts: 19 },
  { district: 'Musanze', searches: 260, stockouts: 14 },
  { district: 'Rubavu', searches: 190, stockouts: 22 },
  { district: 'Nyagatare', searches: 150, stockouts: 17 },
]

const sponsorAds = [
  {
    title: 'Wellness consultation',
    business: 'Kigali Preventive Care Clinic',
    district: 'Gasabo',
    text: 'Book approved chronic-care follow-up and medicine counselling.',
  },
  {
    title: 'Diabetes supplies',
    business: 'Rwanda Care Supplies',
    district: 'Nyarugenge',
    text: 'Verified glucometer strips and patient education support.',
  },
  {
    title: 'Skin and beauty health',
    business: 'PureCare Cosmetics Rwanda',
    district: 'Kicukiro',
    text: 'Approved pharmacy-safe skin care products and advice.',
  },
]

const verificationQueue = [
  { pharmacy: 'Precious Pharmacy Ltd', district: 'Gasabo', license: 'FDA-RW-2026-1042', status: 'Ready for approval' },
  { pharmacy: 'Kivu Beach Pharmacy Ltd', district: 'Rubavu', license: 'FDA-RW-2026-0871', status: 'Document review' },
  { pharmacy: 'Stream Pharmacy Ltd', district: 'Gasabo', license: 'FDA-RW-2026-1198', status: 'Location check' },
]

const reservationQueue = [
  { patient: 'A. Patient', medicine: 'Amlodipine', time: '10 min ago', status: 'Needs confirmation' },
  { patient: 'Chronic refill', medicine: 'Metformin', time: '18 min ago', status: 'Delivery requested' },
  { patient: 'Prescription upload', medicine: 'Amoxicillin', time: '25 min ago', status: 'Stock held' },
]

const coverageRows = [
  { medicine: 'Amlodipine', insurance: 'Mutuelle, RSSB', rule: 'Covered at verified pharmacies' },
  { medicine: 'Insulin', insurance: 'RSSB, Private', rule: 'Prioritize chronic-care requests' },
  { medicine: 'Salbutamol', insurance: 'Mutuelle, MMI', rule: 'Pickup confirmation required' },
]

const roleCopy: Record<Role, { title: string; description: string; bullets: string[] }> = {
  patient: {
    title: 'Patient Access',
    description: 'Sign in to search medicines, use the live map, upload prescriptions, reserve stock, and request delivery.',
    bullets: ['Find nearest pharmacy with stock', 'Upload prescription for matching', 'Reserve medicine safely'],
  },
  pharmacy: {
    title: 'Pharmacy Portal',
    description: 'Manage stock, reservations, prices, alerts, expiry, insurance partners, and verified pharmacy profile.',
    bullets: ['Update medicine stock', 'Confirm patient reservations', 'Receive low-stock alerts'],
  },
  government: {
    title: 'Government Dashboard',
    description: 'View medicine availability, shortage trends, prices, and regional access reports.',
    bullets: ['District medicine demand', 'Shortage maps', 'Price reports'],
  },
  insurance: {
    title: 'Insurance Portal',
    description: 'Manage medicine coverage rules, partner pharmacies, and plan-level medication support.',
    bullets: ['Coverage configuration', 'Partner pharmacy mapping', 'Medicine demand insight'],
  },
  admin: {
    title: 'Admin Control Center',
    description: 'Approve pharmacies, manage medicine records, review advertisements, and monitor MVP quality.',
    bullets: ['Verify licensed pharmacies', 'Approve health advertisements', 'Monitor system readiness'],
  },
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(value)

const uniqueMedicines = Array.from(new Set(listings.map((listing) => listing.medicine))).sort()
const uniquePharmacies = Array.from(new Set(listings.map((listing) => listing.pharmacy))).sort()
const activeDistricts = Array.from(new Set(listings.map((listing) => listing.district))).sort()
const lowStockItems = listings.filter((listing) => listing.stock < 25)
const deliveryEnabledCount = listings.filter((listing) => listing.delivery).length

const toRadians = (value: number) => (value * Math.PI) / 180

function distanceInKm(from: UserLocation, to: Pick<Listing, 'latitude' | 'longitude'>) {
  const earthRadiusKm = 6371
  const dLat = toRadians(to.latitude - from.latitude)
  const dLon = toRadians(to.longitude - from.longitude)
  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(to.latitude)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search))
  const [activeRole, setActiveRoleState] = useState<Role | null>(() => {
    const savedRole = window.localStorage.getItem('rwanda-epharmacy-role')
    return savedRole && ['patient', 'pharmacy', 'government', 'insurance', 'admin'].includes(savedRole)
      ? (savedRole as Role)
      : null
  })

  function setActiveRole(role: Role) {
    window.localStorage.setItem('rwanda-epharmacy-role', role)
    setActiveRoleState(role)
  }

  function navigate(to: string) {
    window.history.pushState({}, '', to)
    setPath(window.location.pathname)
    setSearchParams(new URLSearchParams(window.location.search))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  window.onpopstate = () => {
    setPath(window.location.pathname)
    setSearchParams(new URLSearchParams(window.location.search))
  }

  if (path === '/login') {
    const role = (searchParams.get('role') || 'patient') as Role
    return <LoginPage key={role} navigate={navigate} role={role} setActiveRole={setActiveRole} />
  }

  if (path.startsWith('/dashboard')) {
    return <Dashboard navigate={navigate} role={activeRole || 'pharmacy'} />
  }

  return <LandingPage navigate={navigate} activeRole={activeRole} />
}

function LandingPage({ navigate, activeRole }: { navigate: (to: string) => void; activeRole: Role | null }) {
  const [query, setQuery] = useState('Amlodipine')
  const [district, setDistrict] = useState('All')
  const [insurance, setInsurance] = useState('All')
  const [deliveryOnly, setDeliveryOnly] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [prescriptionFile, setPrescriptionFile] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStageIndex, setUploadStageIndex] = useState<number | null>(null)
  const [prescriptionMedicines, setPrescriptionMedicines] = useState<PrescriptionMedicine[]>([])
  const [prescriptionMessage, setPrescriptionMessage] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationSource, setLocationSource] = useState<LocationSource>(null)
  const [selectedPharmacy, setSelectedPharmacy] = useState<string | null>(null)
  const [reservation, setReservation] = useState<ReservationDraft | null>(null)
  const [reservationStatus, setReservationStatus] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const [locationStatus, setLocationStatus] = useState(
    'Tap GPS to sort by pharmacies nearest to your current location.',
  )
  const patientSignedIn = activeRole === 'patient'

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  function requestLiveLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('GPS is not supported by this browser. Use district filtering instead.')
      return
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    setLocationStatus('Requesting live GPS permission and high-accuracy location...')
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setLocationSource('gps')
        setDistrict('All')
        setLocationStatus(
          `Live GPS active and updating. Accuracy about ${Math.round(position.coords.accuracy)} meters. Results are sorted by nearest in-stock pharmacy.`,
        )
      },
      (error) => {
        if (district !== 'All' && districtCenters[district]) {
          setLocationSource('district')
          setLocationStatus(
            `Location is blocked. Using ${district} district as your search area. Allow GPS for exact distance from where you are.`,
          )
          return
        }

        setLocationSource(null)
        setLocationStatus(
          error.code === error.PERMISSION_DENIED
            ? 'Location is blocked. Allow location in your browser, or choose a district below.'
            : 'Could not read GPS location. Check device location settings, then try again.',
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    )
  }

  function focusSearch() {
    document.getElementById('search')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function startNearestSearch() {
    focusSearch()
    requestLiveLocation()
  }

  function updateDistrict(value: string) {
    setDistrict(value)
    if (value !== 'All' && !userLocation && districtCenters[value]) {
      setLocationSource('district')
      setLocationStatus(
        `Using ${value} district as your search area. Tap GPS for exact distance from where you are.`,
      )
    }
  }

  async function analyzePrescription(file: File) {
    const formData = new FormData()
    formData.append('prescription', file)

    const response = await fetch(`${apiBaseUrl}/api/prescriptions/analyze`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Prescription analysis failed.')
    }

    return (await response.json()) as PrescriptionAnalysis
  }

  async function handlePrescriptionUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setPrescriptionFile(file.name)
    setShowUpload(true)
    setPrescriptionMedicines([])
    setPrescriptionMessage(null)
    setUploadProgress(20)
    setUploadStageIndex(0)

    try {
      await delay(450)
      setUploadStageIndex(1)
      setUploadProgress(40)

      const analysis = await analyzePrescription(file)

      setUploadStageIndex(2)
      setUploadProgress(60)
      await delay(350)
      setUploadStageIndex(3)
      setUploadProgress(80)
      await delay(350)

      setPrescriptionMedicines(analysis.matchedMedicines)
      setPrescriptionMessage(analysis.message)

      if (analysis.matchedMedicines.length) {
        setQuery(analysis.matchedMedicines[0].name)
      }

      setUploadStageIndex(4)
      setUploadProgress(100)
    } catch {
      setUploadStageIndex(null)
      setUploadProgress(0)
      setPrescriptionMessage(
        'We could not read the prescription yet. Try a clearer file, or type the medicine name above.',
      )
    }
  }

  const results = useMemo(() => {
    const origin =
      userLocation ??
      (district !== 'All' && districtCenters[district]
        ? { ...districtCenters[district], accuracy: 0 }
        : null)

    return listings
      .filter((listing) => {
        const prescriptionNames = prescriptionMedicines.map((medicine) => medicine.name.toLowerCase())
        const matchesPrescription =
          prescriptionNames.length === 0 ||
          prescriptionNames.some((medicine) => listing.medicine.toLowerCase().includes(medicine))
        const matchesQuery =
          !query ||
          listing.medicine.toLowerCase().includes(query.toLowerCase()) ||
          matchesPrescription
        const matchesDistrict = district === 'All' || listing.district === district
        const matchesInsurance =
          insurance === 'All' || listing.insurance.includes(insurance)
        const matchesDelivery = !deliveryOnly || listing.delivery
        const hasAvailableStock = listing.stock > 0
        return (
          matchesPrescription &&
          matchesQuery &&
          matchesDistrict &&
          matchesInsurance &&
          matchesDelivery &&
          hasAvailableStock
        )
      })
      .map((listing) => ({
        ...listing,
        distanceKm: origin ? distanceInKm(origin, listing) : null,
      }))
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm
        }
        return b.stock - a.stock
      })
  }, [deliveryOnly, district, insurance, prescriptionMedicines, query, userLocation])

  useEffect(() => {
    if (!results.length) {
      setSelectedPharmacy(null)
      return
    }

    if (!selectedPharmacy || !results.some((listing) => listing.pharmacy === selectedPharmacy)) {
      setSelectedPharmacy(results[0].pharmacy)
    }
  }, [results, selectedPharmacy])

  const selectedListing = results.find((listing) => listing.pharmacy === selectedPharmacy) ?? null

  function openReservation(listing: SearchResult) {
    setReservation({
      listing,
      patientName: '',
      phone: '',
      quantity: 1,
      delivery: listing.delivery,
    })
    setReservationStatus(null)
  }

  function confirmReservation(event: FormEvent) {
    event.preventDefault()
    if (!reservation) {
      return
    }

    setReservationStatus(
      `${reservation.listing.medicine} reserved at ${reservation.listing.pharmacy}. The pharmacy will confirm by phone.`,
    )
    setReservation(null)
  }

  return (
    <main>
      <Header navigate={navigate} />

      <section className="hero premium-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">National medicine access platform</p>
          <h1>Find medicine before you travel.</h1>
          <p>
            Rwanda E-Pharmacy connects patients to verified pharmacies, live stock,
            transparent prices, insurance support, prescription assistance, and medicine
            access intelligence for health institutions.
          </p>
          <div className="actions">
            <button className="button primary" type="button" onClick={() => navigate('/login?role=patient')}>
              Patient sign in
            </button>
            <button className="button secondary" type="button" onClick={focusSearch}>
              View map preview
            </button>
          </div>
          <div className="trust-list">
            <span>
              <ShieldCheck size={16} /> Verified pharmacies
            </span>
            <button type="button" onClick={startNearestSearch}>
              <MapPin size={16} /> Nearest pharmacy with stock
            </button>
            <span>
              <Stethoscope size={16} /> Prescription support
            </span>
          </div>
          <div className="hero-location">
            <button type="button" onClick={startNearestSearch}>
              Use live GPS
            </button>
            <small>{locationStatus}</small>
          </div>
          <div className="hero-proof">
            <span>{uniquePharmacies.length} verified pharmacies in MVP data</span>
            <span>{uniqueMedicines.length} medicines tracked</span>
            <span>{activeDistricts.length} active districts</span>
          </div>
        </div>
        <div className="hero-media">
          <img className="hero-image" src={heroImage} alt="Patient using medicine search with pharmacist nearby" />
          <div className="hero-command-card">
            <strong>Patient flow</strong>
            <span>Prescription → stock match → nearest pharmacy → reserve</span>
          </div>
        </div>
      </section>

      <section className="partner-strip" aria-label="Strategic health ecosystem partners">
        <div>
          <p className="eyebrow">Health ecosystem alignment</p>
          <h2>Built for national healthcare collaboration</h2>
        </div>
        <div className="partner-logos">
          <article>
            <img src={mohLogo} alt="Republic of Rwanda Ministry of Health logo" />
            <span>Policy, regulation, and public health alignment</span>
          </article>
          <article>
            <img src={rbcLogo} alt="Rwanda Biomedical Centre logo" />
            <span>Biomedical intelligence and disease-program insight</span>
          </article>
        </div>
      </section>

      <section className="metric-strip" aria-label="Platform highlights">
        <article>
          <strong>{uniqueMedicines.length}</strong>
          <span>medicines tracked in MVP data</span>
        </article>
        <article>
          <strong>{uniquePharmacies.length}</strong>
          <span>licensed pharmacy records</span>
        </article>
        <article>
          <strong>{deliveryEnabledCount}</strong>
          <span>delivery-enabled stock records</span>
        </article>
        <article>
          <strong>{lowStockItems.length}</strong>
          <span>low-stock alerts to monitor</span>
        </article>
      </section>

      <section className="section" id="search">
        <div className="section-heading">
          <p className="eyebrow">Medicine access map</p>
          <h2>{patientSignedIn ? 'Find the nearest pharmacy with available medicine' : 'Preview verified pharmacy coverage'}</h2>
          <p>
            {patientSignedIn
              ? 'Search by medicine name, choose your insurance, use GPS, and see pharmacies that currently show available stock.'
              : 'The public homepage shows pharmacy coverage. Sign in as a patient to search medicines, upload prescriptions, reserve stock, and use GPS matching.'}
          </p>
        </div>

        <div className="finder-layout">
          <aside className="search-card">
            {patientSignedIn ? (
              <>
                <label>
                  Medicine name
                  <div className="input-icon">
                    <Search size={18} />
                    <input
                      list="medicine-options"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search medicine..."
                    />
                    <datalist id="medicine-options">
                      {uniqueMedicines.map((medicine) => (
                        <option value={medicine} key={medicine} />
                      ))}
                    </datalist>
                  </div>
                </label>
                <label>
                  District
                  <select value={district} onChange={(event) => updateDistrict(event.target.value)}>
                    {districtOptions.map((districtOption) => (
                      <option key={districtOption}>{districtOption}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Insurance
                  <select value={insurance} onChange={(event) => setInsurance(event.target.value)}>
                    {insuranceOptions.map((insuranceOption) => (
                      <option key={insuranceOption}>{insuranceOption}</option>
                    ))}
                  </select>
                </label>
                <label className="checkbox">
                  <input checked={deliveryOnly} type="checkbox" onChange={(event) => setDeliveryOnly(event.target.checked)} />
                  Delivery available
                </label>
                <div className="location-box">
                  <button className="button primary" type="button" onClick={requestLiveLocation}>
                    <MapPin size={18} />
                    Use my live GPS location
                  </button>
                  <p>{locationStatus}</p>
                  {userLocation ? (
                    <small>
                      Current GPS: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
                    </small>
                  ) : null}
                </div>
                <button className="upload-trigger" type="button" onClick={() => setShowUpload((value) => !value)}>
                  <UploadCloud size={20} />
                  Upload prescription
                </button>
                {showUpload ? (
                  <div className="upload-box">
                    <Camera size={20} />
                    <strong>Upload prescription</strong>
                    <p>Upload your prescription and we will help match the medicines to pharmacies that have stock.</p>
                    <input type="file" accept="image/*,.pdf" onChange={handlePrescriptionUpload} />
                    {uploadStageIndex !== null ? (
                      <div className="upload-progress" aria-live="polite">
                        <div className="progress-topline">
                          <strong>{prescriptionStages[uploadStageIndex].label}</strong>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="progress-bar">
                          <span style={{ width: `${uploadProgress}%` }}></span>
                        </div>
                        <p>{prescriptionStages[uploadStageIndex].detail}</p>
                        {prescriptionFile ? <small>{prescriptionFile}</small> : null}
                      </div>
                    ) : null}
                    {prescriptionMessage ? <p className="upload-message">{prescriptionMessage}</p> : null}
                    {prescriptionMedicines.length ? (
                      <div className="medicine-chips" aria-label="Detected medicines">
                        {prescriptionMedicines.map((medicine) => (
                          <span key={medicine.id}>{medicine.name}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="patient-gate">
                <ShieldCheck size={28} />
                <h3>Patient sign-in required</h3>
                <p>Sign in to search medicines, upload prescriptions, use live GPS matching, reserve stock, and request delivery.</p>
                <button className="button primary" type="button" onClick={() => navigate('/login?role=patient')}>
                  Sign in as patient
                </button>
              </div>
            )}
          </aside>

          <div className="results">
            <div className="results-title">
              <strong>{results.length} verified in-stock result(s)</strong>
              <span>
                {locationSource === 'gps'
                  ? 'Sorted by live GPS distance'
                  : locationSource === 'district'
                    ? `Sorted from ${district} district`
                    : 'Tap GPS or choose a district for distance'}
              </span>
            </div>
            <PharmacyMap
              results={results}
              userLocation={userLocation}
              selectedPharmacy={selectedPharmacy}
              setSelectedPharmacy={setSelectedPharmacy}
              requestLiveLocation={patientSignedIn ? requestLiveLocation : () => navigate('/login?role=patient')}
            />
            {selectedListing ? (
              <PharmacyDetailPanel
                listing={selectedListing}
                patientSignedIn={patientSignedIn}
                onReserve={() => openReservation(selectedListing)}
                onSignIn={() => navigate('/login?role=patient')}
              />
            ) : null}
            {results.length ? (
              results.map((listing) => (
                <PhaseOneListingCard
                  key={`${listing.medicine}-${listing.pharmacy}`}
                  listing={listing}
                  locationSource={locationSource}
                  isSelected={selectedPharmacy === listing.pharmacy}
                  onSelect={() => setSelectedPharmacy(listing.pharmacy)}
                  patientSignedIn={patientSignedIn}
                  onReserve={() => openReservation(listing)}
                  onSignIn={() => navigate('/login?role=patient')}
                />
              ))
            ) : (
              <article className="empty-state">
                <h3>No stock found</h3>
                <p>Try another district, enable GPS, or upload a prescription for assisted medicine sourcing.</p>
              </article>
            )}
          </div>
        </div>
      </section>

      {reservationStatus ? (
        <section className="section compact-section" aria-live="polite">
          <div className="success-banner">
            <CheckCircle2 size={22} />
            <span>{reservationStatus}</span>
          </div>
        </section>
      ) : null}

      <section className="section muted" id="partners">
        <div className="section-heading">
          <p className="eyebrow">Approved health partners</p>
          <h2>Trusted services patients may need</h2>
          <p>Phase 1 includes carefully reviewed advertising spaces for health-adjacent businesses.</p>
        </div>
        <div className="ad-grid">
          {sponsorAds.map((ad) => (
            <article className="ad-card" key={ad.title}>
              <span>{ad.district}</span>
              <h3>{ad.title}</h3>
              <strong>{ad.business}</strong>
              <p>{ad.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section workflow-section">
        <div className="section-heading">
          <p className="eyebrow">How Rwanda E-Pharmacy works</p>
          <h2>One flow from prescription to confirmed stock</h2>
          <p>
            The product is designed around access, quality, rational medicine use,
            licensed pharmacy participation, and useful medication data for decision makers.
          </p>
        </div>
        <div className="workflow-grid">
          {[
            ['1', 'Sign in', 'Patient signs in before searching medicines or uploading a prescription.'],
            ['2', 'Match stock', 'The platform checks verified pharmacy stock, prices, insurance support, and delivery status.'],
            ['3', 'Choose pharmacy', 'Patient selects the nearest available pharmacy, calls, gets directions, or reserves.'],
            ['4', 'Confirm and learn', 'Pharmacies confirm requests while anonymized trends support institutions and policy.'],
          ].map(([step, title, body]) => (
            <article key={title}>
              <strong>{step}</strong>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section muted" id="portals">
        <div className="section-heading">
          <p className="eyebrow">Portal access</p>
          <h2>Operational portals for the healthcare ecosystem</h2>
          <p>
            Phase 1 separates patient access from operational work so every stakeholder
            sees the data and actions that matter to them.
          </p>
        </div>
        <div className="portal-grid">
          <PortalCard
            icon={<MapPin />}
            title="Patient Access"
            text="Search medicines, upload prescriptions, use the map, reserve stock, and request delivery."
            onClick={() => navigate('/login?role=patient')}
          />
          <PortalCard
            icon={<ShoppingBag />}
            title="Pharmacy Login"
            text="Manage medicines, prices, stock alerts, reservations, delivery requests, and insurance partners."
            onClick={() => navigate('/login?role=pharmacy')}
          />
          <PortalCard
            icon={<Building2 />}
            title="Government Login"
            text="See medicine availability, shortages, prices, and district reports."
            onClick={() => navigate('/login?role=government')}
          />
          <PortalCard
            icon={<ShieldCheck />}
            title="Insurance Login"
            text="Manage supported medicines, plans, and pharmacy partners."
            onClick={() => navigate('/login?role=insurance')}
          />
          <PortalCard
            icon={<LockKeyhole />}
            title="Admin Login"
            text="Approve licensed pharmacies, advertisements, medicines, and MVP platform quality."
            onClick={() => navigate('/login?role=admin')}
          />
        </div>
      </section>

      <section className="section two-column" id="analytics">
        <div>
          <p className="eyebrow">National project value</p>
          <h2>Medication data for better health decisions</h2>
          <p>
            Hospitals produce important health data, but medicine search,
            availability, stock-outs, insurance support, and consumption patterns
            are often missing. Rwanda E-Pharmacy adds that layer.
          </p>
          <ul className="checklist">
            <li>Medicine demand by district</li>
            <li>Low-stock and shortage alerts for pharmacies and institutions</li>
            <li>Insurance-aware medicine support</li>
            <li>Ethical advertising for approved health-adjacent businesses</li>
          </ul>
        </div>
        <ChartCard />
      </section>

      <section className="section roadmap" id="roadmap">
        <div className="section-heading">
          <p className="eyebrow">Rebuild roadmap</p>
          <h2>From pilot to national platform</h2>
        </div>
        <div className="timeline">
          {[
            ['Now', 'Patient access', 'Search medicines, upload prescriptions, use GPS, and find pharmacies.'],
            ['MVP', 'Core system', 'Pharmacy stock, reservations, insurance support, delivery flow.'],
            ['Pilot', 'Real partners', '20-50 verified pharmacies and first institution report.'],
            ['Scale', 'National readiness', 'Rwanda health system integrations, security, compliance, analytics.'],
          ].map(([period, title, body]) => (
            <article key={title}>
              <strong>{period}</strong>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <Footer />
      {reservation ? (
        <ReservationModal
          reservation={reservation}
          setReservation={setReservation}
          onClose={() => setReservation(null)}
          onConfirm={confirmReservation}
        />
      ) : null}
    </main>
  )
}

function Header({ navigate }: { navigate: (to: string) => void }) {
  return (
    <header className="topbar">
      <button className="brand button-reset" type="button" onClick={() => navigate('/')}>
        <img src={logoImage} alt="Rwanda E-Pharmacy logo" />
      </button>
      <nav aria-label="Main navigation">
        <a href="#search">Map Preview</a>
        <a href="#portals">Portals</a>
        <a href="#analytics">Analytics</a>
        <button type="button" onClick={() => navigate('/login?role=patient')}>Login</button>
      </nav>
    </header>
  )
}

function MapAutoFit({
  results,
  userLocation,
}: {
  results: SearchResult[]
  userLocation: UserLocation | null
}) {
  const map = useMap()

  useEffect(() => {
    const points = results.map((listing) => [listing.latitude, listing.longitude] as [number, number])

    if (userLocation) {
      points.push([userLocation.latitude, userLocation.longitude])
    }

    if (!points.length) {
      map.setView([-1.9403, 29.8739], 8)
      return
    }

    if (points.length === 1) {
      map.setView(points[0], 13)
      return
    }

    map.fitBounds(points, { padding: [32, 32], maxZoom: 13 })
  }, [map, results, userLocation])

  return null
}

function PharmacyMap({
  results,
  userLocation,
  selectedPharmacy,
  setSelectedPharmacy,
  requestLiveLocation,
}: {
  results: SearchResult[]
  userLocation: UserLocation | null
  selectedPharmacy: string | null
  setSelectedPharmacy: (pharmacy: string) => void
  requestLiveLocation: () => void
}) {
  const center: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : results[0]
      ? [results[0].latitude, results[0].longitude]
      : [-1.9403, 29.8739]

  return (
    <div className="map-card">
      <div className="map-header">
        <div>
          <strong>Pharmacies on map</strong>
          <span>Tap a pin to select a pharmacy</span>
        </div>
        <button type="button" onClick={requestLiveLocation}>
          Use GPS
        </button>
      </div>
      <MapContainer className="leaflet-map" center={center} zoom={9} scrollWheelZoom>
        <MapAutoFit results={results} userLocation={userLocation} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation ? (
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
            <Popup>
              <strong>Your location</strong>
              <br />
              Accuracy about {Math.round(userLocation.accuracy)} meters
            </Popup>
          </Marker>
        ) : null}
        {results.map((listing) => {
          const selected = selectedPharmacy === listing.pharmacy
          return (
            <Marker
              eventHandlers={{
                click: () => setSelectedPharmacy(listing.pharmacy),
              }}
              icon={selected ? selectedPharmacyIcon : pharmacyIcon}
              key={`${listing.pharmacy}-${listing.medicine}`}
              position={[listing.latitude, listing.longitude]}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{listing.pharmacy}</strong>
                  <span>{listing.district}</span>
                  <span>{listing.medicine}: {listing.stock} in stock</span>
                  <span>{formatCurrency(listing.price)}</span>
                  <button type="button" onClick={() => setSelectedPharmacy(listing.pharmacy)}>
                    Select pharmacy
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      <div className="map-legend">
        <span><i className="legend-dot pharmacy"></i> Pharmacy with stock</span>
        <span><i className="legend-dot selected"></i> Selected pharmacy</span>
        <span><i className="legend-dot user"></i> Your GPS location</span>
      </div>
    </div>
  )
}

function PhaseOneListingCard({
  listing,
  locationSource,
  isSelected,
  onSelect,
  patientSignedIn,
  onReserve,
  onSignIn,
}: {
  listing: SearchResult
  locationSource: LocationSource
  isSelected: boolean
  onSelect: () => void
  patientSignedIn: boolean
  onReserve: () => void
  onSignIn: () => void
}) {
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`

  return (
    <article className={`listing-card${isSelected ? ' selected-listing' : ''}`}>
      <div>
        <div className="listing-title">
          <h3>{listing.medicine}</h3>
          <span>Updated {listing.updated}</span>
        </div>
        <p>
          {listing.pharmacy} · {listing.district} ·{' '}
          {listing.distanceKm !== null
            ? `${listing.distanceKm.toFixed(1)} km ${
                locationSource === 'gps' ? 'from you' : 'from selected district'
              }`
            : 'tap GPS or choose a district for distance'}
        </p>
        <div className="badges">
          <span>{listing.stock} in stock</span>
          <span>{listing.insurance.join(', ')}</span>
          <span>{listing.delivery ? 'Delivery eligible' : 'Pickup only'}</span>
        </div>
      </div>
      <div className="price">
        <strong>{formatCurrency(listing.price)}</strong>
        <button type="button" onClick={onSelect}>
          {isSelected ? 'Selected' : 'Select pharmacy'}
        </button>
        <button className="secondary-action" type="button" onClick={patientSignedIn ? onReserve : onSignIn}>
          {patientSignedIn ? 'Reserve' : 'Sign in'}
        </button>
        <a className="secondary-action" href={directionsUrl} target="_blank" rel="noreferrer">
          Directions
        </a>
      </div>
    </article>
  )
}

function PharmacyDetailPanel({
  listing,
  patientSignedIn,
  onReserve,
  onSignIn,
}: {
  listing: SearchResult
  patientSignedIn: boolean
  onReserve: () => void
  onSignIn: () => void
}) {
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`

  return (
    <article className="pharmacy-detail">
      <div className="detail-heading">
        <div>
          <p className="eyebrow">Selected pharmacy</p>
          <h3>{listing.pharmacy}</h3>
          <span>{listing.district} · Verified licensed pharmacy</span>
        </div>
        <strong>{listing.stock} in stock</strong>
      </div>
      <div className="detail-grid">
        <div>
          <span>Medicine</span>
          <strong>{listing.medicine}</strong>
        </div>
        <div>
          <span>Price</span>
          <strong>{formatCurrency(listing.price)}</strong>
        </div>
        <div>
          <span>Insurance</span>
          <strong>{listing.insurance.join(', ')}</strong>
        </div>
        <div>
          <span>Delivery</span>
          <strong>{listing.delivery ? 'Available' : 'Pickup only'}</strong>
        </div>
      </div>
      <div className="detail-actions">
        <button className="button primary" type="button" onClick={patientSignedIn ? onReserve : onSignIn}>
          {patientSignedIn ? 'Reserve medicine' : 'Sign in to reserve'}
        </button>
        <a className="button secondary" href="tel:+250788000000">
          <Phone size={18} /> Call pharmacy
        </a>
        <a className="button secondary" href={directionsUrl} target="_blank" rel="noreferrer">
          <Navigation size={18} /> Directions
        </a>
      </div>
    </article>
  )
}

function ReservationModal({
  reservation,
  setReservation,
  onClose,
  onConfirm,
}: {
  reservation: ReservationDraft
  setReservation: (reservation: ReservationDraft) => void
  onClose: () => void
  onConfirm: (event: FormEvent) => void
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <form className="reservation-modal" onSubmit={onConfirm}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close reservation">
          x
        </button>
        <p className="eyebrow">Reserve medicine</p>
        <h2>{reservation.listing.medicine}</h2>
        <p>
          {reservation.listing.pharmacy} · {formatCurrency(reservation.listing.price)} · {reservation.listing.stock} in stock
        </p>
        <label>
          Patient name
          <input
            value={reservation.patientName}
            onChange={(event) => setReservation({ ...reservation, patientName: event.target.value })}
            placeholder="Your full name"
            required
          />
        </label>
        <label>
          Phone number
          <input
            value={reservation.phone}
            onChange={(event) => setReservation({ ...reservation, phone: event.target.value })}
            placeholder="+250..."
            required
          />
        </label>
        <label>
          Quantity
          <input
            min="1"
            max={reservation.listing.stock}
            type="number"
            value={reservation.quantity}
            onChange={(event) =>
              setReservation({ ...reservation, quantity: Math.max(1, Number(event.target.value)) })
            }
          />
        </label>
        <label className="checkbox">
          <input
            checked={reservation.delivery}
            disabled={!reservation.listing.delivery}
            type="checkbox"
            onChange={(event) => setReservation({ ...reservation, delivery: event.target.checked })}
          />
          Request delivery if pharmacy confirms
        </label>
        <button className="button primary" type="submit">
          Send reservation request
        </button>
      </form>
    </div>
  )
}

function PortalCard({
  icon,
  title,
  text,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  text: string
  onClick: () => void
}) {
  return (
    <article className="feature-card portal-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="button primary" type="button" onClick={onClick}>
        Open portal
      </button>
    </article>
  )
}

function LoginPage({
  navigate,
  role,
  setActiveRole,
}: {
  navigate: (to: string) => void
  role: Role
  setActiveRole: (role: Role) => void
}) {
  const [selectedRole, setSelectedRole] = useState<Role>(role)
  const copy = roleCopy[selectedRole]

  function submit(event: FormEvent) {
    event.preventDefault()
    enterDashboard()
  }

  function enterDashboard() {
    setActiveRole(selectedRole)
    navigate('/dashboard')
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-copy">
          <button className="back-link" type="button" onClick={() => navigate('/')}>
            Back to public site
          </button>
          <p className="eyebrow">Secure portal</p>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <ul className="checklist">
            {copy.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
        <form className="login-card" onSubmit={submit} noValidate>
          <LockKeyhole size={28} />
          <h2>Login</h2>
          <div className="role-switch">
            {(['patient', 'pharmacy', 'government', 'insurance', 'admin'] as Role[]).map((option) => (
              <button
                className={selectedRole === option ? 'active' : ''}
                type="button"
                key={option}
                onClick={() => setSelectedRole(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              placeholder={`${selectedRole}@demo.rw`}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              required
            />
          </label>
          <button className="button primary" type="button" onClick={enterDashboard}>
            Enter dashboard
          </button>
        </form>
      </section>
    </main>
  )
}

function Dashboard({ navigate, role }: { navigate: (to: string) => void; role: Role }) {
  const copy = roleCopy[role]
  const dashboardMetrics = {
    patient: [
      ['Medicines tracked', String(uniqueMedicines.length), <Search />],
      ['Verified pharmacies', String(uniquePharmacies.length), <ShieldCheck />],
      ['Delivery options', String(deliveryEnabledCount), <Truck />],
      ['Districts covered', String(activeDistricts.length), <MapPin />],
    ],
    pharmacy: [
      ['Stock records', String(listings.length), <ShoppingBag />],
      ['Low-stock alerts', String(lowStockItems.length), <Activity />],
      ['Reservation queue', String(reservationQueue.length), <FileText />],
      ['Delivery capable', String(deliveryEnabledCount), <Truck />],
    ],
    government: [
      ['Districts covered', String(activeDistricts.length), <MapPin />],
      ['Pharmacies tracked', String(uniquePharmacies.length), <ShieldCheck />],
      ['Low-stock alerts', String(lowStockItems.length), <Activity />],
      ['Demand points', String(demandData.reduce((sum, item) => sum + item.searches, 0)), <Activity />],
    ],
    insurance: [
      ['Coverage rules', String(coverageRows.length), <ShieldCheck />],
      ['Partner pharmacies', String(uniquePharmacies.length), <Building2 />],
      ['Covered stock records', String(listings.filter((item) => item.insurance.length).length), <CheckCircle2 />],
      ['Delivery options', String(deliveryEnabledCount), <Truck />],
    ],
    admin: [
      ['Verification queue', String(verificationQueue.length), <LockKeyhole />],
      ['Ads pending', String(sponsorAds.length), <FileText />],
      ['Medicines master', String(uniqueMedicines.length), <ShoppingBag />],
      ['District coverage', String(activeDistricts.length), <MapPin />],
    ],
  } satisfies Record<Role, [string, string, React.ReactNode][]>

  return (
    <main>
      <header className="topbar">
        <button className="brand button-reset" type="button" onClick={() => navigate('/')}>
          <img src={logoImage} alt="Rwanda E-Pharmacy logo" />
          <strong>{copy.title}</strong>
        </button>
        <nav>
          <button type="button" onClick={() => navigate('/')}>Public site</button>
          <button type="button" onClick={() => navigate('/login?role=pharmacy')}>Switch portal</button>
        </nav>
      </header>

      <section className="section dashboard-hero">
        <p className="eyebrow">Operational dashboard</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </section>

      <section className="section dashboard-grid">
        {dashboardMetrics[role].map(([label, value, icon]) => (
          <DashboardCard icon={icon} label={label} value={value} key={label} />
        ))}
      </section>

      <section className="section two-column">
        <div>
          <p className="eyebrow">Today focus</p>
          <h2>{role === 'pharmacy' ? 'Stock and reservations' : role === 'government' ? 'Medicine access intelligence' : role === 'insurance' ? 'Coverage and partner pharmacies' : 'Verification and quality control'}</h2>
          <ul className="checklist">
            {copy.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
        <ChartCard />
      </section>
      <RoleWorkspace role={role} />
    </main>
  )
}

function RoleWorkspace({ role }: { role: Role }) {
  if (role === 'pharmacy') {
    return (
      <section className="section operations-section">
        <div className="section-heading">
          <p className="eyebrow">Pharmacy operations</p>
          <h2>Inventory, reservations, and stock alerts</h2>
        </div>
        <div className="operations-grid">
          <OperationsTable
            title="Live inventory"
            rows={listings.slice(0, 6).map((listing) => [
              listing.medicine,
              listing.pharmacy,
              `${listing.stock} units`,
              formatCurrency(listing.price),
              listing.stock < 20 ? 'Low stock' : 'Available',
            ])}
          />
          <OperationsTable
            title="Reservation queue"
            rows={reservationQueue.map((item) => [item.patient, item.medicine, item.time, item.status])}
          />
        </div>
      </section>
    )
  }

  if (role === 'patient') {
    return (
      <section className="section operations-section">
        <div className="section-heading">
          <p className="eyebrow">Patient medicine access</p>
          <h2>Your signed-in access is ready</h2>
          <p>Return to the public map to search medicines, upload a prescription, use GPS, and reserve stock.</p>
        </div>
        <div className="operations-grid">
          <OperationsTable
            title="Recommended searches"
            rows={listings.slice(0, 5).map((listing) => [
              listing.medicine,
              listing.pharmacy,
              listing.district,
              formatCurrency(listing.price),
            ])}
          />
          <OperationsTable
            title="Patient actions"
            rows={[
              ['Search medicine', 'Use filters', 'Compare prices', 'Reserve stock'],
              ['Upload prescription', 'Read medicines', 'Match pharmacies', 'Confirm request'],
              ['Use GPS', 'Nearest stock', 'Directions', 'Delivery when eligible'],
            ]}
          />
        </div>
      </section>
    )
  }

  if (role === 'insurance') {
    return (
      <section className="section operations-section">
        <div className="section-heading">
          <p className="eyebrow">Insurance coverage</p>
          <h2>Medicine support rules and partner pharmacies</h2>
        </div>
        <div className="operations-grid">
          <OperationsTable
            title="Coverage rules"
            rows={coverageRows.map((item) => [item.medicine, item.insurance, item.rule, 'Active'])}
          />
          <OperationsTable
            title="Partner pharmacy status"
            rows={listings.slice(0, 5).map((listing) => [
              listing.pharmacy,
              listing.district,
              listing.insurance.join(', '),
              listing.delivery ? 'Delivery' : 'Pickup',
            ])}
          />
        </div>
      </section>
    )
  }

  if (role === 'admin') {
    return (
      <section className="section operations-section">
        <div className="section-heading">
          <p className="eyebrow">Admin controls</p>
          <h2>Verification, ads, and medicine quality</h2>
        </div>
        <div className="operations-grid">
          <OperationsTable
            title="Pharmacy verification"
            rows={verificationQueue.map((item) => [item.pharmacy, item.district, item.license, item.status])}
          />
          <OperationsTable
            title="Advertisement approval"
            rows={sponsorAds.map((item) => [item.business, item.district, item.title, 'Pending review'])}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="section operations-section">
      <div className="section-heading">
        <p className="eyebrow">Institution dashboard</p>
        <h2>Medicine access and shortage intelligence</h2>
      </div>
      <div className="operations-grid">
        <OperationsTable
          title="Shortage watch"
          rows={listings
            .filter((listing) => listing.stock < 25)
            .map((listing) => [listing.medicine, listing.district, `${listing.stock} in stock`, listing.updated])}
        />
          <OperationsTable
            title="District demand"
          rows={demandData.map((item) => [item.district, `${item.searches} searches`, `${item.stockouts} stockouts`, 'Monitor'])}
        />
      </div>
    </section>
  )
}

function OperationsTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <article className="operations-card">
      <h3>{title}</h3>
      <div className="operations-list">
        {rows.map((row) => (
          <div className="operations-row" key={row.join('-')}>
            {row.map((cell) => (
              <span key={cell}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
    </article>
  )
}

function DashboardCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <article className="feature-card dashboard-card">
      <div className="feature-icon">{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function ChartCard() {
  return (
    <div className="chart-card">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={demandData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="district" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="searches" fill="#0c7c59" radius={[6, 6, 0, 0]} />
          <Bar dataKey="stockouts" fill="#f59e0b" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Footer() {
  return (
    <footer>
      <div className="footer-brand">
        <img src={logoImage} alt="Rwanda E-Pharmacy logo" />
      </div>
      <span>Helping patients find available medicine before they travel.</span>
    </footer>
  )
}

export default App
