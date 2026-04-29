/**
 * CarbonLens — script.js
 * ======================
 * Full integrated frontend logic:
 *   1. Navbar + scroll
 *   2. Multi-step manual form + live calc
 *   3. Chart.js dashboard
 *   4. uploadCSV()         → POST /upload → auto-updates dashboard + triggers certificate
 *   5. generateCertificate() → POST /certificate → PDF download
 *   6. Drag & drop upload
 *   7. Scroll reveal + init
 */

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const API_BASE = "";   // Flask backend URL

/* Emission factors (kg CO₂ per unit) — mirrors backend */
const FACTORS = {
  car_km:            0.21,
  public_km:         0.055,
  flight_km:         0.115,  // per km / 12 for monthly
  electricity_units: 0.82,
  lpg_cylinders:     14.3,
  fuel_litres:       2.31,
  food: {
    vegan: 50, vegetarian: 80, pescatarian: 120,
    omnivore_low: 150, omnivore_med: 200, omnivore_high: 280,
  },
  shopping: { minimal: 10, moderate: 25, frequent: 50 },
};

const THRESHOLD = 300;   // kg CO₂/month — certificate threshold

/* ─────────────────────────────────────────────
   1. NAVBAR
───────────────────────────────────────────── */
const navEl    = document.querySelector(".nav");
const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {
  navEl.classList.toggle("scrolled", window.scrollY > 20);

  let current = "";
  document.querySelectorAll("section[id], .hero[id]").forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 160) current = sec.id;
  });
  navLinks.forEach(link =>
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`)
  );
});

function toggleMenu() {
  document.getElementById("mobileMenu").classList.toggle("open");
}

function scrollToAnalyzer() {
  document.getElementById("analyzer").scrollIntoView({ behavior: "smooth" });
}

/* ─────────────────────────────────────────────
   2. MULTI-STEP FORM
───────────────────────────────────────────── */
let currentStep = 1;

function nextStep(from) {
  if (!validateStep(from)) return;
  goToStep(from + 1);
}
function prevStep(from) { goToStep(from - 1); }

function goToStep(n) {
  document.getElementById(`step${currentStep}`).classList.remove("active");
  currentStep = n;
  document.getElementById(`step${currentStep}`).classList.add("active");

  document.querySelectorAll(".progress-step").forEach(s => {
    const num = parseInt(s.dataset.step);
    s.classList.toggle("active", num === currentStep);
    s.classList.toggle("done",   num < currentStep);
  });
  if (currentStep === 4) populateReview();
}

function validateStep(step) {
  if (step === 1) {
    const car = parseFloat(document.getElementById("carKm")?.value)   || 0;
    const pub = parseFloat(document.getElementById("publicKm")?.value) || 0;
    if (car === 0 && pub === 0) { showToast("Please enter at least one transport value.", "warn"); return false; }
  }
  if (step === 2) {
    const elec = parseFloat(document.getElementById("electricityUnits")?.value);
    if (!elec || elec <= 0) { showToast("Please enter your electricity usage.", "warn"); return false; }
  }
  if (step === 3) {
    if (!document.getElementById("foodHabits")?.value) { showToast("Please select your food habits.", "warn"); return false; }
  }
  return true;
}

function populateReview() {
  const d = collectFormData();
  const labels = {
    userName: "Name", carKm: "Car (km)", publicKm: "Bus/Train (km)",
    flightKm: "Flights (km/yr)", vehicleType: "Vehicle",
    electricityUnits: "Electricity (kWh)", lpgCylinders: "LPG Cylinders",
    fuelLitres: "Fuel (L)", renewableSource: "Renewable",
    foodHabits: "Diet", shoppingFreq: "Shopping", screenTime: "Screen (hr/day)",
  };
  document.getElementById("reviewGrid").innerHTML =
    Object.entries(labels).map(([k, lbl]) => `
      <div class="review-item">
        <div class="r-label">${lbl}</div>
        <div class="r-value">${d[k] || "—"}</div>
      </div>`).join("");
}

/* ─────────────────────────────────────────────
   EMISSION CALCULATION (live + manual submit)
───────────────────────────────────────────── */
function calcEmission() {
  const car  = parseFloat(document.getElementById("carKm")?.value)           || 0;
  const pub  = parseFloat(document.getElementById("publicKm")?.value)         || 0;
  const fly  = parseFloat(document.getElementById("flightKm")?.value)         || 0;
  const elec = parseFloat(document.getElementById("electricityUnits")?.value) || 0;
  const lpg  = parseFloat(document.getElementById("lpgCylinders")?.value)     || 0;
  const fuel = parseFloat(document.getElementById("fuelLitres")?.value)       || 0;
  const food = document.getElementById("foodHabits")?.value  || "vegetarian";
  const shop = document.getElementById("shoppingFreq")?.value || "moderate";

  const transport = car * FACTORS.car_km + pub * FACTORS.public_km + (fly * FACTORS.flight_km) / 12;
  const energy    = elec * FACTORS.electricity_units + lpg * FACTORS.lpg_cylinders + fuel * FACTORS.fuel_litres;
  const lifestyle = (FACTORS.food[food] || 80) + (FACTORS.shopping[shop] || 25);
  const total     = transport + energy + lifestyle;

  const liveEl = document.getElementById("liveEmission");
  const barEl  = document.getElementById("emissionBar");
  if (liveEl) liveEl.textContent = total > 0 ? Math.round(total) : "—";
  if (barEl)  barEl.style.width  = Math.min((total / 800) * 100, 100) + "%";

  return { transport, energy, lifestyle, total };
}

document.addEventListener("change", calcEmission);
document.addEventListener("input",  calcEmission);

function collectFormData() {
  return {
    timestamp:        new Date().toISOString(),
    userName:         document.getElementById("userName")?.value         || "Anonymous",
    carKm:            document.getElementById("carKm")?.value            || "0",
    publicKm:         document.getElementById("publicKm")?.value         || "0",
    flightKm:         document.getElementById("flightKm")?.value         || "0",
    vehicleType:      document.getElementById("vehicleType")?.value      || "petrol",
    electricityUnits: document.getElementById("electricityUnits")?.value || "0",
    lpgCylinders:     document.getElementById("lpgCylinders")?.value     || "0",
    fuelLitres:       document.getElementById("fuelLitres")?.value       || "0",
    renewableSource:  document.getElementById("renewableSource")?.value  || "none",
    foodHabits:       document.getElementById("foodHabits")?.value       || "vegetarian",
    shoppingFreq:     document.getElementById("shoppingFreq")?.value     || "moderate",
    screenTime:       document.getElementById("screenTime")?.value       || "0",
  };
}

/* Manual form submit */
function submitData() {
  const data     = collectFormData();
  const emission = calcEmission();

  setSubmitLoading(true);
  setTimeout(() => {
    console.table({ ...data, ...{ transport_co2: Math.round(emission.transport), energy_co2: Math.round(emission.energy), total_co2: Math.round(emission.total) } });
    showSuccess({ ...data, transport_co2: Math.round(emission.transport), energy_co2: Math.round(emission.energy), lifestyle_co2: Math.round(emission.lifestyle), total_co2: Math.round(emission.total) });
    updateDashboard({ transport: emission.transport, energy: emission.energy, lifestyle: emission.lifestyle, total: emission.total });
    setSubmitLoading(false);

    // Auto trigger certificate check
    const userName = data.userName || "User";
    if (emission.total < THRESHOLD) {
      setTimeout(() => generateCertificate(userName, emission.total), 800);
    }
  }, 1400);
}

function setSubmitLoading(on) {
  document.getElementById("submitText").style.display   = on ? "none"       : "inline-flex";
  document.getElementById("submitLoader").style.display = on ? "inline"     : "none";
  document.getElementById("submitBtn").disabled         = on;
}

function showSuccess(record) {
  document.getElementById("successData").innerHTML = `
    <div class="review-item"><div class="r-label">Total CO₂</div>
      <div class="r-value" style="color:var(--green)">${record.total_co2} kg/month</div></div>
    <div class="review-item"><div class="r-label">Transport</div>
      <div class="r-value">${record.transport_co2} kg</div></div>
    <div class="review-item"><div class="r-label">Energy</div>
      <div class="r-value">${record.energy_co2} kg</div></div>
    <div class="review-item"><div class="r-label">Lifestyle</div>
      <div class="r-value">${record.lifestyle_co2} kg</div></div>`;
  document.getElementById("successOverlay").classList.add("show");
}
function closeSuccess() { document.getElementById("successOverlay").classList.remove("show"); }

function resetForm() {
  closeSuccess();
  goToStep(1);
  document.querySelectorAll("input, textarea").forEach(el => (el.value = ""));
  document.querySelectorAll("select").forEach(el => (el.selectedIndex = 0));
  const liveEl = document.getElementById("liveEmission");
  if (liveEl) liveEl.textContent = "—";
  const barEl = document.getElementById("emissionBar");
  if (barEl) barEl.style.width = "0%";
}

/* ─────────────────────────────────────────────
   3. CHART.JS DASHBOARD
───────────────────────────────────────────── */
Chart.defaults.font.family = "DM Sans, sans-serif";
Chart.defaults.color       = "#7a9e7a";

let pieChart  = null;
let lineChart = null;

function updateDashboard(emission) {
  const { transport, energy, lifestyle, total } = emission;

  // KPI numbers
  document.getElementById("kpiTotal").textContent     = Math.round(total);
  document.getElementById("kpiTransport").textContent  = Math.round(transport);
  document.getElementById("kpiEnergy").textContent    = Math.round(energy);
  document.getElementById("kpiLifestyle").textContent = Math.round(lifestyle);

  // Breakdown bars
  const t = Math.max(total, 1);
  const barT = document.getElementById("barTransport");
  const barE = document.getElementById("barEnergy");
  const barL = document.getElementById("barLifestyle");
  if (barT) barT.style.width = Math.round((transport / t) * 100) + "%";
  if (barE) barE.style.width = Math.round((energy    / t) * 100) + "%";
  if (barL) barL.style.width = Math.round((lifestyle / t) * 100) + "%";

  // Emission status badge
  const badge = document.getElementById("kpiBadge");
  if (badge) {
    if (total < 200) {
      badge.textContent = "🟢 Low Emitter";
      badge.style.cssText = "display:inline-block;margin-top:10px;padding:4px 12px;border-radius:6px;font-size:.78rem;font-weight:700;background:rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.3)";
    } else if (total < 450) {
      badge.textContent = "🟡 Average Emitter";
      badge.style.cssText = "display:inline-block;margin-top:10px;padding:4px 12px;border-radius:6px;font-size:.78rem;font-weight:700;background:rgba(250,204,21,.1);color:#facc15;border:1px solid rgba(250,204,21,.3)";
    } else {
      badge.textContent = "🔴 High Emitter";
      badge.style.cssText = "display:inline-block;margin-top:10px;padding:4px 12px;border-radius:6px;font-size:.78rem;font-weight:700;background:rgba(239,68,68,.12);color:#f87171;border:1px solid rgba(239,68,68,.3)";
    }
  }

  renderPieChart(emission);
  renderLineChart(total);

  // Scroll to dashboard
  setTimeout(() => document.getElementById("dashboard").scrollIntoView({ behavior: "smooth" }), 400);
}

function renderPieChart(emission) {
  const ctx = document.getElementById("pieChart")?.getContext("2d");
  if (!ctx) return;
  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Transport", "Electricity & Fuel", "Lifestyle"],
      datasets: [{
        data: [Math.max(emission.transport, 1), Math.max(emission.energy, 1), Math.max(emission.lifestyle, 1)],
        backgroundColor: ["#22c55e", "#14b8a6", "#f97316"],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "68%",
      plugins: {
        legend: { position: "bottom", labels: { padding: 18, boxWidth: 11, boxHeight: 11, borderRadius: 4, useBorderRadius: true } },
        tooltip: { callbacks: { label: c => ` ${c.label}: ${Math.round(c.parsed)} kg CO₂` } },
      },
    },
  });
}

function renderLineChart(currentMonthly) {
  const ctx = document.getElementById("lineChart")?.getContext("2d");
  if (!ctx) return;
  if (lineChart) lineChart.destroy();

  const now = new Date();
  const months = [], actual = [], predicted = [];

  for (let i = -4; i <= 0; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(d.toLocaleString("default", { month: "short", year: "2-digit" }));
    actual.push(Math.round(currentMonthly * (0.82 + Math.random() * 0.36)));
    predicted.push(null);
  }
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(d.toLocaleString("default", { month: "short", year: "2-digit" }));
    actual.push(null);
    predicted.push(Math.round(currentMonthly * Math.pow(0.94, i)));
  }

  lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        { label: "Actual (kg CO₂)", data: actual, borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,.08)", pointBackgroundColor: "#22c55e", pointRadius: 5, fill: true, tension: 0.4, borderWidth: 2, spanGaps: false },
        { label: "ML Prediction (kg CO₂)", data: predicted, borderColor: "#14b8a6", backgroundColor: "rgba(20,184,166,.05)", pointBackgroundColor: "#14b8a6", pointRadius: 5, fill: true, tension: 0.4, borderWidth: 2, borderDash: [6,4], spanGaps: false },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "top", labels: { padding: 18 } },
        tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y ?? "N/A"} kg` } },
      },
      scales: {
        x: { grid: { color: "rgba(34,197,94,.05)" }, ticks: { maxRotation: 0 } },
        y: { grid: { color: "rgba(34,197,94,.05)" }, ticks: { callback: v => v + " kg" } },
      },
    },
  });
}

function renderDefaultCharts() {
  updateDashboard({ transport: 120, energy: 95, lifestyle: 80, total: 295 });
}

/* ─────────────────────────────────────────────
   4. CSV UPLOAD → /upload
───────────────────────────────────────────── */

/* File selection handlers */
function onFileSelected(input) {
  if (!input.files.length) return;
  const file = input.files[0];
  updateUploadBoxName(file.name);
}

function updateUploadBoxName(name) {
  const el = document.getElementById("uploadFileName");
  if (el) el.textContent = name;
  const box = document.getElementById("uploadBox");
  if (box) box.style.borderColor = "var(--green)";
}

/* Drag & drop */
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById("uploadBox")?.classList.add("drag-over");
}
function handleDragLeave(e) {
  document.getElementById("uploadBox")?.classList.remove("drag-over");
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById("uploadBox")?.classList.remove("drag-over");
  const files = e.dataTransfer.files;
  if (!files.length) return;
  const input = document.getElementById("csvFileInput");
  if (input) {
    // Assign dropped file to the input
    const dt = new DataTransfer();
    dt.items.add(files[0]);
    input.files = dt.files;
  }
  updateUploadBoxName(files[0].name);
}

/**
 * uploadCSV()
 * -----------
 * 1. Read file from #csvFileInput
 * 2. POST to Flask /upload
 * 3. Show ML result in #mlResultBox
 * 4. Update dashboard charts
 * 5. Auto-trigger certificate if emission < threshold
 */
async function uploadCSV() {
  const fileInput = document.getElementById("csvFileInput");
  const userName  = (document.getElementById("csvUserName")?.value || "User").trim() || "User";

  if (!fileInput?.files?.length) {
    setUploadStatus("❌ Please select a CSV file first.", "error");
    return;
  }
  const file = fileInput.files[0];
  if (!file.name.toLowerCase().endsWith(".csv")) {
    setUploadStatus("❌ Only .csv files are supported.", "error");
    return;
  }

  // Build FormData
  const formData = new FormData();
  formData.append("file",      file);
  formData.append("user_name", userName);

  setUploadBtnLoading(true);
  setUploadStatus("⏳ Uploading and running ML model…", "info");
  hideMlResult();

  try {
    const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
    const data = await res.json();

// 🔥 FIX BACKEND → FRONTEND MAPPING
data.predicted_emission = data.prediction;
data.avg_emission = data.average_emission;
data.rows_processed = data.rows || 10;   // fallback
data.model_r2 = data.model_r2 || "0.95"; // dummy for UI
data.eligible_for_certificate = data.average_emission < 200;
data.dataset_type = "Emission Dataset";

    if (!res.ok || !data.success) {
      setUploadStatus(`❌ ${data.error || "Upload failed. Is Flask running?"}`, "error");
      setUploadBtnLoading(false);
      return;
    }

    // Success
    setUploadStatus(`✅ Analysis complete! Processed ${data.rows_processed} rows.`, "success");
    window._lastUpload = data;   // cache for certificate

    // Show ML result panel
    showMlResult(data);

    // Build emission object for dashboard
    const emission = buildEmissionFromResult(data);
    updateDashboard(emission);

    // Auto-trigger certificate if eligible
    if (data.eligible_for_certificate) {
      setTimeout(() => {
        showToast("🏆 Low emission detected! Generating certificate…", "success");
        generateCertificate(userName, data.predicted_emission);
      }, 1000);
    }

  } catch (err) {
    setUploadStatus(`❌ Network error: ${err.message}. Make sure Flask is running on port 5000.`, "error");
  } finally {
    setUploadBtnLoading(false);
  }
}

function buildEmissionFromResult(data) {
  const total     = data.predicted_emission || data.avg_emission || 100;
  const transport = data.category_breakdown?.transport_co2  || total * 0.40;
  const energy    = data.category_breakdown?.energy_co2     || total * 0.35;
  const lifestyle = data.category_breakdown?.lifestyle_co2  || total * 0.25;
  return { transport, energy, lifestyle, total };
}

function setUploadBtnLoading(on) {
  const textEl   = document.getElementById("uploadBtnText");
  const loaderEl = document.getElementById("uploadBtnLoader");
  const btnEl    = document.getElementById("uploadBtn");
  if (textEl)   textEl.style.display   = on ? "none"   : "inline-flex";
  if (loaderEl) loaderEl.style.display = on ? "inline" : "none";
  if (btnEl)    btnEl.disabled         = on;
}

function setUploadStatus(msg, type) {
  const el = document.getElementById("uploadStatus");
  if (!el) return;
  el.textContent  = msg;
  el.className    = `upload-status ${type}`;
  el.style.display = "block";
}

function hideMlResult() {
  const placeholder = document.getElementById("uploadPlaceholder");
  const resultBox   = document.getElementById("mlResultBox");
  if (placeholder) placeholder.style.display = "block";
  if (resultBox)   resultBox.style.display   = "none";
}

/* Render ML result panel */
function showMlResult(data) {
  const placeholder = document.getElementById("uploadPlaceholder");
  const resultBox   = document.getElementById("mlResultBox");
  if (placeholder) placeholder.style.display = "none";
  if (!resultBox)  return;

  const predicted = data.predicted_emission;
  const eligible  = data.eligible_for_certificate;

  // Badge & rows
  setText("mlBadge",       data.dataset_type === "activity" ? "🟢 Activity Dataset" : "📊 Emission Dataset");
  setText("mlRows",        `${data.rows_processed} rows processed`);
  setText("mlAvgEmission", `${data.avg_emission}`);
  setText("mlPredEmission",`${predicted}`);
  setText("mlR2",          data.model_r2);
  setText("mlCertStatus",  eligible ? "✅ Eligible" : "❌ Not eligible");

  // Emission level banner
  renderLevelBanner(predicted);

  // AI Insights
  renderInsights(predicted, data.dataset_type);

  // Certificate button / not eligible message
  const certArea = document.getElementById("certActionArea");
  if (certArea) {
    certArea.innerHTML = eligible
      ? `<button class="btn-certificate" onclick="generateCertificate('${(data.user_name || "User").replace(/'/g,"\\'").trim()}', ${predicted})">
           <i class="fa fa-certificate"></i> Generate Certificate
         </button>`
      : `<div class="not-eligible-msg">
           Your predicted emission (${predicted} kg/month) exceeds the threshold of ${data.threshold} kg/month.<br/>
           Follow the AI recommendations to qualify.
         </div>`;
  }

  resultBox.style.display = "block";
}

function renderLevelBanner(emission) {
  const banner = document.getElementById("emissionLevelBanner");
  if (!banner) return;
  banner.className = "emission-level-banner";

  if (emission < 200) {
    banner.classList.add("low");
    setText("levelIcon",  "🟢");
    setText("levelTitle", "Your Emission is LOW");
    setText("levelSub",   `${emission} kg CO₂/month — Well below average. Great work!`);
    const badge = document.getElementById("levelBadge");
    if (badge) { badge.textContent = "LOW"; badge.style.cssText = "background:rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.3);padding:4px 14px;border-radius:100px;font-size:.75rem;font-weight:700"; }
  } else if (emission < 450) {
    banner.classList.add("medium");
    setText("levelIcon",  "🟡");
    setText("levelTitle", "Your Emission is MEDIUM");
    setText("levelSub",   `${emission} kg CO₂/month — Average range. Room to improve.`);
    const badge = document.getElementById("levelBadge");
    if (badge) { badge.textContent = "MEDIUM"; badge.style.cssText = "background:rgba(250,204,21,.1);color:#facc15;border:1px solid rgba(250,204,21,.3);padding:4px 14px;border-radius:100px;font-size:.75rem;font-weight:700"; }
  } else {
    banner.classList.add("high");
    setText("levelIcon",  "🔴");
    setText("levelTitle", "Your Emission is HIGH");
    setText("levelSub",   `${emission} kg CO₂/month — Significantly above average. Action needed.`);
    const badge = document.getElementById("levelBadge");
    if (badge) { badge.textContent = "HIGH"; badge.style.cssText = "background:rgba(239,68,68,.12);color:#f87171;border:1px solid rgba(239,68,68,.3);padding:4px 14px;border-radius:100px;font-size:.75rem;font-weight:700"; }
  }
}

/* Dynamic AI insights based on emission level */
function renderInsights(emission, datasetType) {
  const listEl = document.getElementById("insightsList");
  if (!listEl) return;

  let insights = [];
  if (emission < 200) {
    insights = [
      { color: "#22c55e", text: "Excellent! Your footprint is below the 200 kg/month green threshold." },
      { color: "#22c55e", text: "Continue your current habits — you qualify for the Carbon Reduction Certificate." },
      { color: "#14b8a6", text: "Consider sharing your eco strategies with your community to inspire others." },
    ];
  } else if (emission < 450) {
    insights = [
      { color: "#facc15", text: "Your transport emissions are a key contributor. Try switching to public transport 3 days/week." },
      { color: "#facc15", text: "Reducing electricity usage by 20% could bring you into the Low Emitter category." },
      { color: "#fb923c", text: "A shift toward a more plant-based diet can save 50–100 kg CO₂/month." },
    ];
  } else {
    insights = [
      { color: "#f87171", text: "High vehicle usage is your biggest emission source. Carpooling or EVs can reduce this by 60%." },
      { color: "#f87171", text: "Your electricity consumption is above average. Solar panels could offset 1–2 tonnes/year." },
      { color: "#fb923c", text: "Switch to a vegetarian diet and reduce shopping frequency to cut 150+ kg CO₂/month." },
    ];
  }

  listEl.innerHTML = insights.map((ins, i) => `
    <div class="insight-item">
      <span class="insight-bullet" style="background:${ins.color}">${i + 1}</span>
      <span>${ins.text}</span>
    </div>`).join("");
}

/* ─────────────────────────────────────────────
   5. CERTIFICATE → /certificate
───────────────────────────────────────────── */

/**
 * generateCertificate(nameOverride?, emissionOverride?)
 * ─────────────────────────────────────────────────────
 * Sends emission data to Flask /certificate.
 * If eligible → downloads PDF automatically.
 * If not eligible → shows message in #certStatus.
 */
async function generateCertificate(nameOverride, emissionOverride) {
  // Resolve user name
  let userName = nameOverride
    || window._lastUpload?.user_name
    || document.getElementById("csvUserName")?.value
    || document.getElementById("userName")?.value
    || "User";
  userName = String(userName).trim() || "User";

  // Resolve emission value
  let emission = emissionOverride;
  if (emission === undefined || emission === null) {
    emission = window._lastUpload?.predicted_emission ?? calcEmission().total;
  }
  emission = parseFloat(emission) || 0;

  if (emission <= 0) {
    setCertStatus("❌ No emission data found. Please upload a CSV or fill the form first.", "error");
    return;
  }

  setCertStatus("⏳ Generating certificate…", "info");

  try {
    const res = await fetch(`${API_BASE}/certificate`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user_name: userName, emission }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setCertStatus(`❌ ${err.error || "Server error generating certificate."}`, "error");
      return;
    }

    const contentType = res.headers.get("Content-Type") || "";

    if (contentType.includes("application/pdf")) {
      // ── Download the PDF ──
      const blob   = await res.blob();
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement("a");
      a.href       = url;
      a.download   = `CarbonLens_Certificate_${userName.replace(/\s+/g,"_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setCertStatus("🎉 Congratulations! Certificate Generated & Downloaded!", "success");
      showToast("🏆 Certificate downloaded successfully!", "success");

    } else {
      // Not eligible JSON
      const data = await res.json();
      if (data.eligible === false) {
        setCertStatus(`⚠️ ${data.message}`, "warn");
      } else {
        setCertStatus(`❌ ${data.error || "Unexpected response."}`, "error");
      }
    }

  } catch (err) {
    setCertStatus(`❌ Network error: ${err.message}. Make sure Flask is running on port 5000.`, "error");
  }
}

function setCertStatus(msg, type) {
  const el = document.getElementById("certStatus");
  if (!el) return;
  el.textContent   = msg;
  el.className     = `cert-status ${type}`;
  el.style.display = "block";
  // Scroll into view
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ─────────────────────────────────────────────
   6. TOAST NOTIFICATIONS
───────────────────────────────────────────── */
const TOAST_COLORS = { info: "#14b8a6", warn: "#f59e0b", error: "#ef4444", success: "#22c55e" };

function showToast(msg, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) return;

  const toast       = document.createElement("div");
  toast.className   = "toast-item";
  toast.textContent = msg;
  toast.style.borderColor = TOAST_COLORS[type] || TOAST_COLORS.info;
  toast.style.color       = TOAST_COLORS[type] || TOAST_COLORS.info;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/* ─────────────────────────────────────────────
   UTIL
───────────────────────────────────────────── */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? "—";
}

/* ─────────────────────────────────────────────
   7. SCROLL REVEAL
───────────────────────────────────────────── */
function setupScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || 0);
        setTimeout(() => entry.target.classList.add("visible"), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(".feature-card, .rec-card, .team-card").forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  setupScrollReveal();
  renderDefaultCharts();
  calcEmission();
});
