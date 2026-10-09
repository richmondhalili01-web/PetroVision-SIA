/* ============================================================
   PetroVision — js/rewards.js
   ------------------------------------------------------------
   Shows the logged-in user's badge and progress toward the next
   tier, a static "how to earn points" guide, the full
   leaderboard (getLeaderboard() from store.js), and this user's
   recent point-earning activity (getActivity()).
   ============================================================ */

const username = requireAuth();
paintNavUser();

const user = findUser(username);
const badge = getBadge(user.points);
const badgeIndex = BADGES.indexOf(badge);
const nextBadge = BADGES[badgeIndex + 1]; // undefined if already at the top tier

document.getElementById("my-badge").textContent = badge.name;
document.getElementById("my-badge").style.background = badge.color;
document.getElementById("my-points").textContent = `${user.points} pts`;

if (nextBadge) {
  const range = nextBadge.min - badge.min;
  const progress = ((user.points - badge.min) / range) * 100;
  document.getElementById("progress-fill").style.width = `${Math.min(100, progress).toFixed(0)}%`;
  document.getElementById("progress-hint").textContent =
    `${nextBadge.min - user.points} points to go until "${nextBadge.name}."`;
} else {
  document.getElementById("progress-fill").style.width = "100%";
  document.getElementById("progress-hint").textContent = "You've reached the highest tier. Legendary!";
}

// ---------- how to earn points ----------
const GUIDE = [
  [`Report a new fuel station or price`, POINTS.newStation],
  [`Update a station's fuel availability`, POINTS.availabilityUpdate],
  [`Log a refuel in your History`, POINTS.refuelLog],
  [`Save a trip estimate to your History`, POINTS.tripLog],
  [`Add a vehicle to your Garage`, POINTS.newVehicle],
  [`Set up a Fuel Price Alert`, POINTS.newAlert],
];
document.getElementById("points-guide").innerHTML =
  GUIDE.map(([label, pts]) => `<li>${label} — <strong>+${pts} pts</strong></li>`).join("");

// ---------- leaderboard ----------
function initials(fullName) {
  return fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

document.getElementById("leaderboard").innerHTML = getLeaderboard().map((u, i) => {
  const isMe = u.username === username;
  return `
    <div class="leaderboard-row ${isMe ? "me" : ""}">
      <span class="rank">#${i + 1}</span>
      <span class="avatar">${initials(u.fullName)}</span>
      <span class="name">${u.fullName}${isMe ? " (you)" : ""}</span>
      <span class="pts">${u.points} pts</span>
    </div>
  `;
}).join("");

// ---------- recent activity ----------
const activity = getActivity(username).slice(0, 10);
document.getElementById("activity-feed").innerHTML = activity.length
  ? activity.map(a => `
      <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding-bottom:8px;">
        <span>${a.reason}</span>
        <span style="font-weight:700; color:var(--accent);">+${a.amount}</span>
      </div>
    `).join("")
  : `<p class="hint">Nothing yet — go report a station or log a trip!</p>`;
