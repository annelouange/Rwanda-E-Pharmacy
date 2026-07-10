const pharmacies = [
  {
    medicine: "Amlodipine",
    pharmacy: "Kigali Care Pharmacy",
    district: "Kigali",
    price: 3200,
    stock: 38,
    distance: 1.8,
    insurance: ["Mutuelle", "RSSB", "Private"],
    delivery: true,
    updated: "12 min ago",
  },
  {
    medicine: "Amlodipine",
    pharmacy: "Huye Health Pharmacy",
    district: "Huye",
    price: 3000,
    stock: 14,
    distance: 3.4,
    insurance: ["Mutuelle", "MMI"],
    delivery: false,
    updated: "36 min ago",
  },
  {
    medicine: "Metformin",
    pharmacy: "Musanze Life Pharmacy",
    district: "Musanze",
    price: 2500,
    stock: 52,
    distance: 2.2,
    insurance: ["RSSB", "MMI", "Private"],
    delivery: true,
    updated: "8 min ago",
  },
  {
    medicine: "Metformin",
    pharmacy: "Kigali Care Pharmacy",
    district: "Kigali",
    price: 2800,
    stock: 26,
    distance: 1.8,
    insurance: ["Mutuelle", "RSSB", "Private"],
    delivery: true,
    updated: "12 min ago",
  },
  {
    medicine: "Paracetamol",
    pharmacy: "Rubavu Community Pharmacy",
    district: "Rubavu",
    price: 900,
    stock: 120,
    distance: 4.6,
    insurance: ["Mutuelle", "Private"],
    delivery: true,
    updated: "21 min ago",
  },
  {
    medicine: "Paracetamol",
    pharmacy: "Kigali Care Pharmacy",
    district: "Kigali",
    price: 1000,
    stock: 85,
    distance: 1.8,
    insurance: ["Mutuelle", "RSSB", "Private"],
    delivery: true,
    updated: "12 min ago",
  },
  {
    medicine: "Salbutamol",
    pharmacy: "Musanze Life Pharmacy",
    district: "Musanze",
    price: 4100,
    stock: 18,
    distance: 2.2,
    insurance: ["RSSB", "MMI"],
    delivery: false,
    updated: "1 hr ago",
  },
  {
    medicine: "Insulin",
    pharmacy: "Kigali Hospital Pharmacy",
    district: "Kigali",
    price: 11800,
    stock: 9,
    distance: 2.7,
    insurance: ["RSSB", "Private"],
    delivery: false,
    updated: "5 min ago",
  },
];

const stakeholderContent = {
  patients: {
    title: "Patients and caregivers",
    text: "Patients need answers before spending time and transport money. The product gives them verified availability, price, distance, insurance support, reservation, and delivery options.",
    bullets: [
      "Search by medicine name, generic, brand, or prescription upload",
      "Find nearby verified pharmacies with current stock",
      "Reserve before travelling and get refill reminders",
    ],
  },
  pharmacies: {
    title: "Pharmacies and pharmacy chains",
    text: "Pharmacies get demand, inventory tools, and better operating discipline while keeping pharmacist confirmation in the workflow.",
    bullets: [
      "Update stock, price, expiry, and operating hours",
      "Receive low-stock and reservation alerts",
      "Use demand analytics for better restocking decisions",
    ],
  },
  insurers: {
    title: "Insurers and coverage teams",
    text: "Insurers can communicate medicine support more clearly and use aggregated patterns for coverage planning.",
    bullets: [
      "Manage coverage rules and partner pharmacies",
      "Reduce patient confusion around supported medicines",
      "Track aggregate medication demand without exposing patient identities",
    ],
  },
  government: {
    title: "Government and health institutions",
    text: "Institutions gain privacy-safe insight into medication availability, stock-outs, and price variation across districts.",
    bullets: [
      "Monitor stock-out and shortage signals",
      "View district-level medicine demand and price trends",
      "Support evidence-based policy and procurement planning",
    ],
  },
};

const searchForm = document.querySelector("#medicine-search");
const medicineInput = document.querySelector("#medicine-input");
const districtFilter = document.querySelector("#district-filter");
const insuranceFilter = document.querySelector("#insurance-filter");
const deliveryFilter = document.querySelector("#delivery-filter");
const resultList = document.querySelector("#result-list");
const resultCount = document.querySelector("#result-count");
const uploadButton = document.querySelector("#upload-prescription");
const prescriptionCard = document.querySelector("#prescription-card");
const tabPanel = document.querySelector("#tab-panel");
const tabs = document.querySelectorAll(".tab");
const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");
const pilotForm = document.querySelector("#pilot-form");
const formNote = document.querySelector("#form-note");

function formatCurrency(value) {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(value);
}

function getResults() {
  const query = medicineInput.value.trim().toLowerCase();
  const district = districtFilter.value;
  const insurance = insuranceFilter.value;
  const deliveryOnly = deliveryFilter.checked;

  return pharmacies.filter((item) => {
    const matchesQuery = !query || item.medicine.toLowerCase().includes(query);
    const matchesDistrict = district === "all" || item.district === district;
    const matchesInsurance = insurance === "all" || item.insurance.includes(insurance);
    const matchesDelivery = !deliveryOnly || item.delivery;
    return matchesQuery && matchesDistrict && matchesInsurance && matchesDelivery;
  });
}

function renderResults() {
  const results = getResults();
  resultCount.textContent = `${results.length} verified result${results.length === 1 ? "" : "s"}`;

  if (!results.length) {
    resultList.innerHTML = `
      <article class="medicine-card">
        <div>
          <h3>No matching stock found</h3>
          <p>Try another district, remove filters, or upload a prescription for assisted pharmacy matching.</p>
          <div class="card-tags">
            <span>Support team escalation</span>
            <span>Alternative pharmacies</span>
          </div>
        </div>
      </article>
    `;
    return;
  }

  resultList.innerHTML = results
    .map(
      (item) => `
        <article class="medicine-card">
          <div>
            <h3>${item.medicine}</h3>
            <p>${item.pharmacy} · ${item.district} · ${item.distance} km away · updated ${item.updated}</p>
            <div class="card-tags">
              <span>${item.stock} in stock</span>
              <span>${item.insurance.join(", ")}</span>
              <span>${item.delivery ? "Delivery eligible" : "Pickup only"}</span>
            </div>
          </div>
          <div class="price-box">
            <strong>${formatCurrency(item.price)}</strong>
            <small>verified pharmacy price</small>
            <button type="button">Reserve</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderStakeholder(key) {
  const item = stakeholderContent[key];
  tabPanel.innerHTML = `
    <div>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    </div>
    <ul>
      ${item.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
    </ul>
  `;
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderResults();
});

[districtFilter, insuranceFilter, deliveryFilter].forEach((control) => {
  control.addEventListener("change", renderResults);
});

document.querySelectorAll("[data-medicine]").forEach((button) => {
  button.addEventListener("click", () => {
    medicineInput.value = button.dataset.medicine;
    renderResults();
  });
});

uploadButton.addEventListener("click", () => {
  prescriptionCard.hidden = !prescriptionCard.hidden;
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((candidate) => candidate.classList.remove("active"));
    tab.classList.add("active");
    renderStakeholder(tab.dataset.tab);
  });
});

navToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

pilotForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formNote.textContent = "Pilot request prepared. Next step: partner discovery call and pilot scope confirmation.";
  pilotForm.reset();
});

medicineInput.value = "Amlodipine";
renderResults();
renderStakeholder("patients");
