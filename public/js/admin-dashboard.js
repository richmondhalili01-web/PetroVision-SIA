const admin = requireAdmin();

function statusBadge(status) {
  const cls = status === "Approved" ? "badge-success" : status === "Rejected" ? "badge-danger" : "badge-warning";
  return `<span class="badge ${cls}">${status}</span>`;
}
function render() {
  const stations = getStations();
  const pending = stations.filter(s => !s.verified && (s.approvalStatus || "Pending") === "Pending");
  const approved = stations.filter(s => s.verified || s.approvalStatus === "Approved");
  const rejected = stations.filter(s => s.approvalStatus === "Rejected");
  const audit = getAdminAudit();

  document.getElementById("stat-pending").textContent = pending.length;
  document.getElementById("stat-approved").textContent = approved.length;
  document.getElementById("stat-rejected").textContent = rejected.length;
  document.getElementById("stat-audit").textContent = audit.length;

  const filter = document.getElementById("report-filter").value;
  const rows = stations.filter(s => filter === "All" || (s.approvalStatus || (s.verified ? "Approved" : "Pending")) === filter);
  document.getElementById("report-table").innerHTML = rows.map(s => {
    const status = s.approvalStatus || (s.verified ? "Approved" : "Pending");
    const actions = status === "Pending"
      ? `<button class="btn btn-sm" onclick="approveReport('${s.id}')">Approve</button>
         <button class="btn btn-sm btn-danger" onclick="rejectReport('${s.id}')">Reject</button>`
      : `<span class="hint">${s.reviewedBy || s.approvedBy || "—"}</span>`;
    return `<tr><td><strong>${s.name}</strong><br><span class="hint">${s.city}</span></td>
      <td>${s.submittedBy}</td><td>${s.fuelType}<br>₱${Number(s.price).toFixed(2)}</td>
      <td>${s.date}</td><td>${statusBadge(status)}</td><td>${actions}</td></tr>`;
  }).join("") || `<tr><td colspan="6" class="hint">No reports in this category.</td></tr>`;

  document.getElementById("audit-table").innerHTML = audit.slice(0,30).map(x =>
    `<tr><td>${new Date(x.date).toLocaleString()}</td><td>${x.admin}</td><td>${x.action}</td><td>${x.target}</td><td>${x.details}</td></tr>`
  ).join("") || `<tr><td colspan="5" class="hint">No audit activity yet.</td></tr>`;
}
window.approveReport = function(id) {
  const station = approveStation(admin, id);
  if (station) {
    showBanner(`Approved ${station.name}. ${station.submittedBy} received the configured station-report points.`, "success");
    render();
  }
};
window.rejectReport = function(id) {
  const reason = prompt("Reason for rejecting this report:", "Price or station information could not be verified.");
  if (reason === null) return;
  const station = rejectStation(admin, id, reason);
  if (station) { showBanner(`Rejected ${station.name}.`, "danger"); render(); }
};
function showBanner(message, type) {
  document.getElementById("banner").innerHTML = `<div class="banner banner-${type}">${message}</div>`;
}
document.getElementById("report-filter").addEventListener("change", render);
document.getElementById("logout-link").addEventListener("click", e => { e.preventDefault(); clearSession(); location.href="index.html"; });
render();
