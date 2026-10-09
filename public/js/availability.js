/* ============================================================
   PetroVision — js/availability.js
   ------------------------------------------------------------
   Shows every crowdsourced station as a filterable table and
   lets the user update a station's availability status inline
   (a dropdown per row) — reusing the same station records the
   Map page draws, via updateAvailability() from store.js.
   ============================================================ */

const username = requireAuth();
paintNavUser();

const fuelFilter = document.getElementById("filter-fuel");
const statusFilter = document.getElementById("filter-status");
FUEL_TYPES.forEach(f => fuelFilter.innerHTML += `<option value="${f}">${f}</option>`);

const STATUS_BADGE = {
  "In Stock": "badge-success",
  "Low Stock": "badge-warning",
  "Out of Stock": "badge-danger",
};

function renderTable() {
  const stations = getStations()
    .filter(s => !fuelFilter.value || s.fuelType === fuelFilter.value)
    .filter(s => !statusFilter.value || s.availability === statusFilter.value)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const body = document.getElementById("availability-body");

  if (stations.length === 0) {
    body.innerHTML = `<tr><td colspan="7" class="hint">No stations match these filters.</td></tr>`;
    return;
  }

  body.innerHTML = stations.map(s => `
    <tr>
      <td>${s.name}</td>
      <td>${s.city}</td>
      <td>${s.fuelType}</td>
      <td>₱${s.price.toFixed(2)}</td>
      <td><span class="badge ${STATUS_BADGE[s.availability]}">${s.availability}</span></td>
      <td class="hint">${s.date}</td>
      <td>
        <select class="status-update" data-id="${s.id}" style="padding:6px 8px; border-radius:6px; border:1px solid var(--line);">
          <option value="">Update…</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll(".status-update").forEach(select => {
    select.addEventListener("change", () => {
      if (!select.value) return;
      updateAvailability(username, select.dataset.id, select.value);
      document.getElementById("banner").innerHTML =
        `<div class="banner banner-success">✅ Availability updated. +${POINTS.availabilityUpdate} points earned.</div>`;
      renderTable();
    });
  });
}

fuelFilter.addEventListener("change", renderTable);
statusFilter.addEventListener("change", renderTable);
renderTable();
