/* ============================================================
   PetroVision — js/dashboard.js
   ------------------------------------------------------------
   Fills in the welcome message, the three quick-stat tiles, and
   the feature grid on dashboard.html.
   ============================================================ */

const username = requireAuth(); // redirects to index.html if not logged in
paintNavUser();

const user = findUser(username);
const badge = getBadge(user.points);

document.getElementById("welcome-heading").textContent = `Welcome back, ${user.fullName.split(" ")[0]}.`;
document.getElementById("stat-points").textContent = user.points;
document.getElementById("stat-badge").innerHTML =
  `<span class="tier-badge" style="background:${badge.color}">${badge.name}</span>`;
document.getElementById("stat-misc").textContent =
  `${getVehicles(username).length} vehicles · ${user.submissions || 0} reports`;

// Each feature card: icon, title, one-line description, and the
// page it links to. Kept as one array so it's easy to add a
// feature later without touching the HTML.
const FEATURES = [
  { icon: "🗺️", title: "Crowdsourced Map", desc: "Real-time station locations and prices.", href: "map.html" },
  { icon: "🧮", title: "Trip Cost Estimator", desc: "Estimate fuel cost for your next trip.", href: "trip-estimator.html" },
  { icon: "🧾", title: "Refuel & Trip History", desc: "Your past trips and refueling log.", href: "history.html" },
  { icon: "🏆", title: "Rewards", desc: "Earn points for accurate contributions.", href: "rewards.html" },
  { icon: "🚗", title: "Vehicle Garage", desc: "Manage your registered vehicles.", href: "garage.html" },
  { icon: "🔔", title: "Price Alerts", desc: "Get notified when prices hit your target.", href: "alerts.html" },
  { icon: "⛽", title: "Availability Tracker", desc: "Check which stations have stock.", href: "availability.html" },
];

document.getElementById("feature-grid").innerHTML = FEATURES.map(f => `
  <article class="feature-card">
    <div class="icon">${f.icon}</div>
    <h3>${f.title}</h3>
    <p>${f.desc}</p>
    <a href="${f.href}">Open →</a>
  </article>
`).join("");
