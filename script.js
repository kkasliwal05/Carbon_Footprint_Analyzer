let pieChart, lineChart;

// 🔥 MAIN FUNCTION (REAL-TIME FETCH)
async function autoRunSystem() {
  try {
    document.getElementById("rtStatus").innerText = "Fetching...";

    const res = await fetch("/realtime");
    const data = await res.json();

    // 🔹 UI update (Realtime section)
    document.getElementById("rtTemp").innerText = data.temperature.toFixed(1);
    document.getElementById("rtKm").innerText = data.car_km.toFixed(0);
    document.getElementById("rtElectric").innerText = data.electricity_units.toFixed(0);
    document.getElementById("rtFuel").innerText = data.fuel_litres.toFixed(1);
    document.getElementById("rtEmission").innerText = data.emission.toFixed(2);

    document.getElementById("rtStatus").innerText = "Updated";

    // 🔹 Last Updated
    const now = new Date();
    document.getElementById("lastUpdated").innerText =
      now.toLocaleTimeString();

    // 🔹 Dashboard update
    updateDashboard(data);

  } catch (err) {
    document.getElementById("rtStatus").innerText = "Error ❌";
    console.error(err);
  }
}

// 🔥 DASHBOARD UPDATE
function updateDashboard(data) {
  const transport = data.car_km * 0.21;
  const energy = data.electricity_units * 0.82;
  const lifestyle = 50;
  const total = data.emission;

  // KPI update
  document.getElementById("kpiTotal").innerText = total.toFixed(0);
  document.getElementById("kpiTransport").innerText = transport.toFixed(0);
  document.getElementById("kpiEnergy").innerText = energy.toFixed(0);
  document.getElementById("kpiLifestyle").innerText = lifestyle;

  // bars
  document.getElementById("barTransport").style.width = "40%";
  document.getElementById("barEnergy").style.width = "30%";
  document.getElementById("barLifestyle").style.width = "30%";

  // badge
  const badge = document.getElementById("kpiBadge");
  badge.innerText = total < 200 ? "🟢 Low Emission" : "🔴 High Emission";

  // charts
  updateCharts(transport, energy, lifestyle);
}

// 🔥 CHART UPDATE
function updateCharts(t, e, l) {
  const pieCtx = document.getElementById("pieChart").getContext("2d");

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Transport", "Energy", "Lifestyle"],
      datasets: [{
        data: [t, e, l]
      }]
    }
  });

  const lineCtx = document.getElementById("lineChart").getContext("2d");

  if (lineChart) lineChart.destroy();

  lineChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: ["Week1", "Week2", "Week3", "Week4"],
      datasets: [{
        label: "CO2 Trend",
        data: [
          t * 0.8,
          t * 0.9,
          t,
          t * 1.1
        ]
      }]
    }
  });
}

// 🔁 AUTO UPDATE (10 sec for demo)
setInterval(autoRunSystem, 10000);

// 🚀 FIRST LOAD
window.onload = autoRunSystem;

async function generateCertificate() {
  const name = prompt("Enter your name:");
  if (!name) return;

  const emission = document.getElementById("kpiTotal").innerText;

  const res = await fetch("/certificate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_name: name,
      emission: emission
    })
  });

  if (res.ok) {
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "certificate.pdf";
    a.click();
  } else {
    alert("Not eligible for certificate ❌");
  }
}

async function storeWeekly(data) {
  await fetch("/store_weekly", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}