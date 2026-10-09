const admin = requireAdmin();
const rewardFields = ["newStation","availabilityUpdate","refuelLog","tripLog","newVehicle","newAlert"];

function showBanner(message, type="success") {
  document.getElementById("banner").innerHTML = `<div class="banner banner-${type}">${message}</div>`;
}
function loadRewards() {
  const rules = getRewardRules();
  rewardFields.forEach(k => document.getElementById("r-"+k).value = rules[k]);
}
function loadUsers() {
  document.getElementById("points-user").innerHTML = getUsers().filter(u => u.role !== "admin")
    .map(u => `<option value="${u.username}">${u.fullName} — ${u.points || 0} pts</option>`).join("");
}
function renderStations() {
  const q = document.getElementById("station-search").value.toLowerCase();
  const stations = getStations().filter(s => `${s.name} ${s.city} ${s.fuelType}`.toLowerCase().includes(q));
  document.getElementById("station-table").innerHTML = stations.map(s => {
    const status = s.approvalStatus || (s.verified ? "Approved" : "Pending");
    return `<tr>
      <td><strong>${s.name}</strong><br><span class="hint">${s.id}</span></td><td>${s.city}</td>
      <td>${s.fuelType}</td><td>₱${Number(s.price).toFixed(2)}</td>
      <td><span class="badge ${s.availability==="In Stock"?"badge-success":s.availability==="Low Stock"?"badge-warning":"badge-danger"}">${s.availability}</span></td>
      <td>${status}</td><td>
      <button class="btn btn-sm btn-outline" onclick="editStation('${s.id}')">Edit</button>
      <button class="btn btn-sm btn-danger" onclick="removeStation('${s.id}')">Delete</button></td></tr>`;
  }).join("") || `<tr><td colspan="7" class="hint">No matching stations.</td></tr>`;
}
window.editStation = function(id) {
  const s = getStations().find(x => x.id === id); if (!s) return;
  const name = prompt("Station name:", s.name); if (name === null) return;
  const city = prompt("City:", s.city); if (city === null) return;
  const fuel = prompt("Fuel type (Diesel / Gasoline (RON 95) / Gasoline (RON 97)):", s.fuelType); if (fuel === null) return;
  const price = prompt("Price per liter:", s.price); if (price === null) return;
  const availability = prompt("Availability (In Stock / Low Stock / Out of Stock):", s.availability); if (availability === null) return;
  updateStationAdmin(admin, id, {name, city, fuelType:fuel, price, availability});
  showBanner(`Updated ${name}.`);
  renderStations();
};
window.removeStation = function(id) {
  const s = getStations().find(x => x.id === id); if (!s) return;
  if (!confirm(`Delete ${s.name}? This will be recorded in the admin audit log.`)) return;
  deleteStationAdmin(admin, id);
  showBanner(`Deleted ${s.name}.`, "danger");
  renderStations();
};
document.getElementById("reward-form").addEventListener("submit", e => {
  e.preventDefault();
  const rules = {};
  rewardFields.forEach(k => rules[k] = Math.max(0, Number(document.getElementById("r-"+k).value || 0)));
  saveRewardRules(rules);
  logAdminAction(admin, "UPDATED REWARD RULES", "Reward Settings", JSON.stringify(rules));
  showBanner("Reward point rules saved.");
});
document.getElementById("points-form").addEventListener("submit", e => {
  e.preventDefault();
  const user = document.getElementById("points-user").value;
  const amount = Number(document.getElementById("points-amount").value);
  const reason = document.getElementById("points-reason").value.trim();
  if (!amount || !reason) return showBanner("Enter a non-zero point amount and a reason.", "danger");
  adjustUserPoints(admin, user, amount, reason);
  showBanner(`Adjusted ${user}'s points by ${amount > 0 ? "+" : ""}${amount}.`);
  loadUsers();
  e.target.reset();
});
document.getElementById("station-search").addEventListener("input", renderStations);
document.getElementById("logout-link").addEventListener("click", e => { e.preventDefault(); clearSession(); location.href="index.html"; });
loadRewards(); loadUsers(); renderStations();
