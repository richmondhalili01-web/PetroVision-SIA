/* ============================================================
   PetroVision — js/profile.js
   ------------------------------------------------------------
   Fills in the Driver Profile Card: basic info, badge, stats
   pulled from across the other features (vehicles, history,
   stations), and handles logging out.
   ============================================================ */

const username = requireAuth();
paintNavUser();

const user = findUser(username);
const badge = getBadge(user.points);

function initials(fullName) {
  return fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

document.getElementById("profile-avatar").textContent = initials(user.fullName);
document.getElementById("profile-name").textContent = user.fullName;
document.getElementById("profile-username").textContent = "@" + user.username;
document.getElementById("profile-badge").textContent = badge.name;
document.getElementById("profile-badge").style.background = badge.color;
document.getElementById("profile-joined").textContent = user.joinDate || "—";

document.getElementById("profile-points").textContent = user.points;
document.getElementById("profile-submissions").textContent = user.submissions || 0;
document.getElementById("profile-vehicles").textContent = getVehicles(username).length;
document.getElementById("profile-history").textContent = getHistory(username).length;

// A quick table of stations THIS user reported, pulled straight
// out of the shared crowdsourced station list.
const mine = getStations().filter(s => s.submittedBy === username);
const stationsBox = document.getElementById("profile-stations");
if (mine.length === 0) {
  stationsBox.innerHTML = `<p class="hint">You haven't reported a station yet — try it from the Map page.</p>`;
} else {
  stationsBox.innerHTML = `
    <table>
      <thead><tr><th>Station</th><th>Fuel</th><th>Price</th><th>Status</th></tr></thead>
      <tbody>
        ${mine.map(s => `
          <tr>
            <td>${s.name}</td>
            <td>${s.fuelType}</td>
            <td>₱${s.price.toFixed(2)}</td>
            <td>${s.verified
              ? '<span class="badge badge-success">Verified</span>'
              : '<span class="badge badge-warning">Pending</span>'}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

document.getElementById("logout-btn").addEventListener("click", () => {
  clearSession();
  window.location.href = "index.html";
});
