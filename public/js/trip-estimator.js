/* ============================================================
   PetroVision — js/trip-estimator.js
   ------------------------------------------------------------
   Estimates fuel cost for a trip:
     distance (km) = haversine(from, to) × ROAD_FACTOR   [store.js]
     liters needed = distance / vehicle.efficiency (km per liter)
     price used    = averagePrice(vehicle.fuelType)       [store.js]
     total cost    = liters needed × price used
   ============================================================ */

const username = requireAuth();
paintNavUser();

const fromSelect = document.getElementById("from-city");
const toSelect = document.getElementById("to-city");
const vehicleSelect = document.getElementById("vehicle-select");
const vehicleInfo = document.getElementById("vehicle-info");
const form = document.getElementById("estimate-form");

// ---------- city dropdowns ----------
Object.keys(CITIES).forEach(city => {
  fromSelect.innerHTML += `<option value="${city}">${city}</option>`;
  toSelect.innerHTML += `<option value="${city}">${city}</option>`;
});
toSelect.selectedIndex = 1; // default to a different city than "from"

// ---------- vehicle dropdown ----------
const vehicles = getVehicles(username);
if (vehicles.length === 0) {
  document.getElementById("no-vehicle-notice").style.display = "block";
  form.querySelector("button[type=submit]").disabled = true;
} else {
  vehicles.forEach(v => {
    vehicleSelect.innerHTML += `<option value="${v.id}">${v.name} (${v.fuelType})</option>`;
  });
}

function updateVehicleInfo() {
  const v = vehicles.find(v => v.id === vehicleSelect.value);
  if (!v) { vehicleInfo.textContent = ""; return; }
  vehicleInfo.textContent = `${v.type} · ${v.fuelType} · about ${v.efficiency} km/L`;
}
vehicleSelect.addEventListener("change", updateVehicleInfo);
updateVehicleInfo();

// ---------- estimate ----------
let lastEstimate = null;

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const from = fromSelect.value;
  const to = toSelect.value;
  const vehicle = vehicles.find(v => v.id === vehicleSelect.value);
  if (!vehicle) return;

  if (from === to) {
    document.getElementById("banner").innerHTML =
      `<div class="banner banner-danger">⚠️ Starting point and destination can't be the same city.</div>`;
    return;
  }
  document.getElementById("banner").innerHTML = "";

  const distanceKm = roadDistanceKm(from, to);
  const litersNeeded = distanceKm / vehicle.efficiency;
  let pricePerLiter = averagePrice(vehicle.fuelType);
  if (pricePerLiter === null) pricePerLiter = 60; // fallback if nobody has reported that fuel type yet
  const totalCost = litersNeeded * pricePerLiter;

  document.getElementById("res-distance").textContent = `${distanceKm.toFixed(0)} km`;
  document.getElementById("res-liters").textContent = `${litersNeeded.toFixed(1)} L`;
  document.getElementById("res-price").textContent = `₱${pricePerLiter.toFixed(2)}/L`;
  document.getElementById("res-cost").textContent = `₱${totalCost.toFixed(0)}`;
  document.getElementById("result-card").style.display = "block";

  lastEstimate = { from, to, vehicle, distanceKm, litersNeeded, pricePerLiter, totalCost };
});

document.getElementById("save-history-btn").addEventListener("click", () => {
  if (!lastEstimate) return;
  addHistoryEntry(username, {
    type: "Trip",
    vehicleId: lastEstimate.vehicle.id,
    from: lastEstimate.from,
    to: lastEstimate.to,
    liters: Number(lastEstimate.litersNeeded.toFixed(1)),
    pricePerLiter: Number(lastEstimate.pricePerLiter.toFixed(2)),
    cost: Number(lastEstimate.totalCost.toFixed(0)),
    notes: `${lastEstimate.from} → ${lastEstimate.to}`,
  });
  document.getElementById("banner").innerHTML =
    `<div class="banner banner-success">✅ Trip saved to your History. +${POINTS.tripLog} points earned.</div>`;
});
