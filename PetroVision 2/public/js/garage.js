/* ============================================================
   PetroVision — js/garage.js
   ------------------------------------------------------------
   Add/list/delete vehicles for the logged-in user, using
   addVehicle(), getVehicles(), and deleteVehicle() from store.js.
   ============================================================ */

const username = requireAuth();
paintNavUser();

const typeSelect = document.getElementById("v-type");
const fuelSelect = document.getElementById("v-fuel");
const effInput = document.getElementById("v-eff");

VEHICLE_TYPES.forEach(t => typeSelect.innerHTML += `<option value="${t}">${t}</option>`);
FUEL_TYPES.forEach(f => fuelSelect.innerHTML += `<option value="${f}">${f}</option>`);

// Pre-fill the efficiency field with a sensible starting number
// whenever the vehicle type changes.
function suggestEfficiency() {
  effInput.value = DEFAULT_EFFICIENCY[typeSelect.value] || "";
}
typeSelect.addEventListener("change", suggestEfficiency);
suggestEfficiency();

function renderVehicles() {
  const vehicles = getVehicles(username);
  const list = document.getElementById("vehicle-list");

  if (vehicles.length === 0) {
    list.innerHTML = `<p class="hint">No vehicles yet — add your first one to unlock the Trip Cost Estimator.</p>`;
    return;
  }

  list.innerHTML = vehicles.map(v => `
    <div class="card" style="padding:16px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-weight:700;">${v.name}</div>
        <div class="hint">${v.type} · ${v.fuelType} · ${v.efficiency} km/L</div>
      </div>
      <button class="btn btn-outline btn-sm" data-id="${v.id}">Remove</button>
    </div>
  `).join("");

  list.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteVehicle(btn.dataset.id);
      renderVehicles();
    });
  });
}
renderVehicles();

document.getElementById("vehicle-form").addEventListener("submit", (event) => {
  event.preventDefault();
  addVehicle(username, {
    name: document.getElementById("v-name").value.trim(),
    type: typeSelect.value,
    fuelType: fuelSelect.value,
    efficiency: effInput.value,
  });
  document.getElementById("banner").innerHTML =
    `<div class="banner banner-success">Vehicle added! +${POINTS.newVehicle} points earned.</div>`;
  document.getElementById("vehicle-form").reset();
  suggestEfficiency();
  renderVehicles();
});
