/* ============================================================
   PetroVision — js/history.js
   ------------------------------------------------------------
   Lists every Trip/Refuel entry for the logged-in user (Trip
   entries come from the Trip Cost Estimator's "Save to History"
   button; Refuel entries are logged directly on this page) and
   totals up what's been spent so far.
   ============================================================ */

const username = requireAuth();
paintNavUser();

const vehicles = getVehicles(username);
const vehicleSelect = document.getElementById("r-vehicle");
const litersInput = document.getElementById("r-liters");
const priceInput = document.getElementById("r-price");
const costPreview = document.getElementById("r-cost-preview");
const form = document.getElementById("refuel-form");

if (vehicles.length === 0) {
  document.getElementById("no-vehicle-notice").style.display = "block";
  form.querySelector("button[type=submit]").disabled = true;
} else {
  vehicles.forEach(v => {
    vehicleSelect.innerHTML += `<option value="${v.id}">${v.name}</option>`;
    // suggest today's average price for this vehicle's fuel type as soon as it's picked
  });
}

function suggestPrice() {
  const v = vehicles.find(v => v.id === vehicleSelect.value);
  if (!v) return;
  const avg = averagePrice(v.fuelType);
  if (avg) priceInput.value = avg.toFixed(2);
  updatePreview();
}
vehicleSelect.addEventListener("change", suggestPrice);

function updatePreview() {
  const liters = Number(litersInput.value);
  const price = Number(priceInput.value);
  if (liters > 0 && price > 0) {
    costPreview.textContent = `Total: ₱${(liters * price).toFixed(0)}`;
  } else {
    costPreview.textContent = "";
  }
}
litersInput.addEventListener("input", updatePreview);
priceInput.addEventListener("input", updatePreview);
if (vehicles.length > 0) suggestPrice();

function vehicleName(id) {
  const v = getVehicles(username).find(v => v.id === id);
  return v ? v.name : "—";
}

function renderHistory() {
  const entries = getHistory(username);
  const body = document.getElementById("history-body");

  if (entries.length === 0) {
    body.innerHTML = `<tr><td colspan="6" class="hint">No trips or refuels logged yet.</td></tr>`;
  } else {
    body.innerHTML = entries.map(h => {
      const details = h.type === "Trip"
        ? `${h.from} → ${h.to}`
        : (h.notes || "Refuel");
      return `
        <tr>
          <td>${h.date}</td>
          <td><span class="badge ${h.type === "Trip" ? "badge-neutral" : "badge-success"}">${h.type}</span></td>
          <td>${details}</td>
          <td>${vehicleName(h.vehicleId)}</td>
          <td>${h.liters} L</td>
          <td>₱${h.cost}</td>
        </tr>
      `;
    }).join("");
  }

  const total = entries.reduce((sum, h) => sum + Number(h.cost || 0), 0);
  document.getElementById("total-spent").textContent = `₱${total.toFixed(0)}`;
}
renderHistory();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const liters = Number(litersInput.value);
  const price = Number(priceInput.value);

  addHistoryEntry(username, {
    type: "Refuel",
    vehicleId: vehicleSelect.value,
    liters,
    pricePerLiter: price,
    cost: Math.round(liters * price),
    notes: document.getElementById("r-station").value.trim(),
  });

  document.getElementById("banner").innerHTML =
    `<div class="banner banner-success">✅ Refuel logged. +${POINTS.refuelLog} points earned.</div>`;
  form.reset();
  costPreview.textContent = "";
  renderHistory();
});
