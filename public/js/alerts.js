/* ============================================================
   PetroVision — js/alerts.js
   ------------------------------------------------------------
   Creates and lists Fuel Price Alerts. Each alert is checked
   live against the current crowdsourced stations with
   checkAlert() from store.js, so "triggered" alerts update
   immediately if new prices come in from the Map page.
   ============================================================ */

const username = requireAuth();
paintNavUser();

const fuelSelect = document.getElementById("a-fuel");
FUEL_TYPES.forEach(f => fuelSelect.innerHTML += `<option value="${f}">${f}</option>`);

function renderAlerts() {
  const alerts = getAlerts(username);
  const list = document.getElementById("alert-list");

  if (alerts.length === 0) {
    list.innerHTML = `<p class="hint">No alerts yet — create one to get notified of a price match.</p>`;
    return;
  }

  list.innerHTML = alerts.map(a => {
    const match = checkAlert(a);
    const conditionText = a.condition === "below" ? "drops below" : "rises above";
    return `
      <div class="card" style="padding:14px 16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <strong>${a.fuelType}</strong> ${conditionText} ₱${Number(a.threshold).toFixed(2)}
          </div>
          <button class="btn btn-outline btn-sm" data-id="${a.id}">Delete</button>
        </div>
        ${match
          ? `<div class="banner banner-success" style="margin:10px 0 0;">
               Triggered: ${match.name} (${match.city}) is at ₱${match.price.toFixed(2)}
             </div>`
          : `<p class="hint" style="margin-top:8px;">No station matches this yet.</p>`}
      </div>
    `;
  }).join("");

  list.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", () => { deleteAlert(btn.dataset.id); renderAlerts(); });
  });
}
renderAlerts();

document.getElementById("alert-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const condition = document.querySelector('input[name="a-condition"]:checked').value;

  addAlert(username, {
    fuelType: fuelSelect.value,
    condition,
    threshold: document.getElementById("a-threshold").value,
  });

  document.getElementById("banner").innerHTML =
    `<div class="banner banner-success">Alert created. +${POINTS.newAlert} points earned.</div>`;
  document.getElementById("alert-form").reset();
  renderAlerts();
});
