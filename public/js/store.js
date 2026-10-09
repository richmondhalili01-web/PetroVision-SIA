/* ============================================================
   PetroVision — js/store.js
   ------------------------------------------------------------
   This is the "database" for the whole prototype. There is no
   server — every page loads this file first, then reads and
   writes through the functions below, and everything is saved
   in the browser's localStorage.

   This file is organized in five parts:
     1. Shared constants (cities, fuel types, badge tiers, points)
     2. Sample "crowd" data (mock users + mock fuel stations)
     3. Low-level storage helpers (get/set the localStorage keys)
     4. Session (who is currently logged in)
     5. Feature helpers (users, points, vehicles, history,
        stations, alerts) — one small group per feature.
   ============================================================ */

/* ---------- 1. Shared constants ---------- */

// Cities used by both the map markers and the Trip Cost Estimator,
// so a station's location and a trip's start/end point always line
// up with real coordinates. Coordinates are approximate city-center
// points — accurate enough for a prototype, not for real navigation.
const CITIES = {
  "Manila":          { lat: 14.5995, lng: 120.9842 },
  "Quezon City":      { lat: 14.6760, lng: 121.0437 },
  "Makati":           { lat: 14.5547, lng: 121.0244 },
  "Baguio City":      { lat: 16.4023, lng: 120.5960 },
  "Angeles City":     { lat: 15.1449, lng: 120.5887 },
  "Batangas City":    { lat: 13.7565, lng: 121.0583 },
  "Tagaytay":         { lat: 14.1153, lng: 120.9621 },
  "Naga City":        { lat: 13.6218, lng: 123.1948 },
  "Legazpi City":     { lat: 13.1391, lng: 123.7438 },
  "Iloilo City":      { lat: 10.7202, lng: 122.5621 },
  "Bacolod City":     { lat: 10.6713, lng: 122.9511 },
  "Cebu City":        { lat: 10.3157, lng: 123.8854 },
  "Tacloban City":    { lat: 11.2447, lng: 125.0037 },
  "Cagayan de Oro":   { lat: 8.4542,  lng: 124.6319 },
  "Zamboanga City":   { lat: 6.9214,  lng: 122.0790 },
  "Davao City":       { lat: 7.1907,  lng: 125.4553 },
  "General Santos":   { lat: 6.1164,  lng: 125.1716 },
};

const FUEL_TYPES = ["Diesel", "Gasoline (RON 95)", "Gasoline (RON 97)"];

const VEHICLE_TYPES = ["Motorcycle", "Sedan", "Hatchback", "SUV", "Van", "Pickup Truck"];

// Suggested starting fuel-efficiency (km per liter) per vehicle type,
// just to pre-fill the Garage form — the user can always change it.
const DEFAULT_EFFICIENCY = {
  "Motorcycle": 35, "Sedan": 12, "Hatchback": 14,
  "SUV": 9, "Van": 8, "Pickup Truck": 10,
};

// How many points each action is worth. Kept in one place so every
// page awards points consistently.
const POINTS = {
  signupBonus: 5,
  newStation: 10,
  availabilityUpdate: 5,
  refuelLog: 5,
  tripLog: 5,
  newVehicle: 5,
  newAlert: 2,
};

// Badge tiers, ordered lowest to highest. getBadge() below picks the
// last tier whose "min" the user's points have reached.
const BADGES = [
  { min: 0,    name: "Newbie",           color: "#94A3B8" },
  { min: 100,  name: "Contributor",      color: "#3B82F6" },
  { min: 300,  name: "Trusted Reporter", color: "#2F9E6B" },
  { min: 700,  name: "Fuel Hero",        name2: "Fuel Hero", color: "#F2732B" },
  { min: 1500, name: "Legend",           color: "#A855F7" },
];

function getBadge(points) {
  let current = BADGES[0];
  for (const tier of BADGES) {
    if (points >= tier.min) current = tier;
  }
  return current;
}

// Great-circle ("as the crow flies") distance between two coordinates,
// in kilometers, using the haversine formula. Multiplying by
// ROAD_FACTOR gives a rough estimate of actual road distance, since
// real roads are never perfectly straight.
const ROAD_FACTOR = 1.3;
function haversineKm(a, b) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function roadDistanceKm(cityA, cityB) {
  return haversineKm(CITIES[cityA], CITIES[cityB]) * ROAD_FACTOR;
}

/* ---------- 2. Sample "crowd" data ----------
   A prototype needs to look alive on day one, so these mock users
   and mock station submissions are loaded the very first time the
   site runs. Everything a real visitor does gets added on top of
   this — nothing here is ever required to keep working. */

const SEED_USERS = [
  { username: "miguel.santos",   fullName: "Miguel Santos",     password: "demo1234", points: 1820, submissions: 21, joinDate: "2026-01-14" },
  { username: "angela.reyes",    fullName: "Angela Reyes",      password: "demo1234", points: 1340, submissions: 16, joinDate: "2026-02-02" },
  { username: "paolo.cruz",      fullName: "Paolo Cruz",        password: "demo1234", points: 980,  submissions: 12, joinDate: "2026-02-20" },
  { username: "bea.fernandez",   fullName: "Bea Fernandez",     password: "demo1234", points: 610,  submissions: 8,  joinDate: "2026-03-30" },
  { username: "jayson.torres",   fullName: "Jayson Torres",     password: "demo1234", points: 455,  submissions: 6,  joinDate: "2026-04-18" },
  { username: "nicole.villa",    fullName: "Nicole Villanueva", password: "demo1234", points: 240,  submissions: 4,  joinDate: "2026-06-05" },
  { username: "mark.aquino",     fullName: "Mark Aquino",       password: "demo1234", points: 150,  submissions: 3,  joinDate: "2026-07-11" },
  { username: "cathy.domingo",   fullName: "Cathy Domingo",     password: "demo1234", points: 60,   submissions: 1,  joinDate: "2026-08-22" },
  // "demo" is the easy account for a quick first look at the app.
  { username: "demo",            fullName: "Demo Driver",       password: "demo",     points: 35,   submissions: 1,  joinDate: "2026-09-01" },
];

const SEED_STATIONS = [
  { id: "ST-01", name: "Petron - EDSA Cubao",        city: "Quezon City",    fuelType: "Diesel",             price: 57.80, availability: "In Stock",    submittedBy: "miguel.santos", date: "2026-09-10", verified: true  },
  { id: "ST-02", name: "Shell - Ayala Avenue",       city: "Makati",         fuelType: "Gasoline (RON 95)",  price: 64.20, availability: "In Stock",    submittedBy: "angela.reyes",  date: "2026-09-12", verified: true  },
  { id: "ST-03", name: "Caltex - Roxas Boulevard",   city: "Manila",         fuelType: "Gasoline (RON 97)",  price: 66.90, availability: "Low Stock",   submittedBy: "paolo.cruz",    date: "2026-09-14", verified: true  },
  { id: "ST-04", name: "Seaoil - IT Park",           city: "Cebu City",      fuelType: "Diesel",             price: 58.10, availability: "In Stock",    submittedBy: "bea.fernandez", date: "2026-09-09", verified: true  },
  { id: "ST-05", name: "Phoenix - Buhangin",         city: "Davao City",     fuelType: "Gasoline (RON 95)",  price: 65.00, availability: "In Stock",    submittedBy: "jayson.torres", date: "2026-09-15", verified: true  },
  { id: "ST-06", name: "Petron - Session Road",      city: "Baguio City",    fuelType: "Diesel",             price: 59.40, availability: "In Stock",    submittedBy: "nicole.villa",  date: "2026-09-11", verified: true  },
  { id: "ST-07", name: "Shell - Diversion Road",     city: "Iloilo City",    fuelType: "Gasoline (RON 95)",  price: 64.50, availability: "Out of Stock", submittedBy: "mark.aquino",   date: "2026-09-16", verified: false },
  { id: "ST-08", name: "Total - Limketkai",          city: "Cagayan de Oro", fuelType: "Diesel",             price: 58.90, availability: "In Stock",    submittedBy: "cathy.domingo", date: "2026-09-08", verified: true  },
  { id: "ST-09", name: "Caltex - Governor Camins",   city: "Zamboanga City", fuelType: "Gasoline (RON 97)",  price: 67.10, availability: "In Stock",    submittedBy: "miguel.santos", date: "2026-09-13", verified: true  },
  { id: "ST-10", name: "Petron - Lacson Street",     city: "Bacolod City",   fuelType: "Diesel",             price: 57.50, availability: "Low Stock",   submittedBy: "angela.reyes",  date: "2026-09-17", verified: true  },
  { id: "ST-11", name: "Seaoil - Diversion Road",    city: "Batangas City",  fuelType: "Gasoline (RON 95)",  price: 63.70, availability: "In Stock",    submittedBy: "paolo.cruz",    date: "2026-09-18", verified: false },
  { id: "ST-12", name: "Shell - Tagaytay Rotonda",   city: "Tagaytay",       fuelType: "Diesel",             price: 58.60, availability: "In Stock",    submittedBy: "bea.fernandez", date: "2026-09-07", verified: true  },
  { id: "ST-13", name: "Total - Magsaysay Avenue",   city: "Naga City",      fuelType: "Gasoline (RON 97)",  price: 66.40, availability: "In Stock",    submittedBy: "jayson.torres", date: "2026-09-19", verified: true  },
  { id: "ST-14", name: "Petron - Rizal Street",      city: "Legazpi City",   fuelType: "Diesel",             price: 58.00, availability: "In Stock",    submittedBy: "nicole.villa",  date: "2026-09-06", verified: true  },
// Each seed station borrows its city's coordinates from CITIES
// above, so it can be plotted on the map like any user submission.
].map(s => ({ ...s, lat: CITIES[s.city].lat, lng: CITIES[s.city].lng }));

/* ---------- 3. Low-level storage helpers ---------- */

const KEYS = {
  users: "petrovision-users",
  session: "petrovision-session",
  stations: "petrovision-stations",
  vehicles: "petrovision-vehicles",
  history: "petrovision-history",
  alerts: "petrovision-alerts",
  activity: "petrovision-activity",
};

function readList(key, seed) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(seed));
    return JSON.parse(JSON.stringify(seed)); // return a fresh copy, not the seed reference
  }
  return JSON.parse(raw);
}
function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

/* ---------- 4. Session (who is logged in right now) ---------- */

function getSession() {
  return localStorage.getItem(KEYS.session); // just the username, or null
}
function setSession(username) {
  localStorage.setItem(KEYS.session, username);
}
function clearSession() {
  localStorage.removeItem(KEYS.session);
}

// Call this at the top of every page that requires login. If nobody
// is logged in, it sends the visitor back to the login page and
// stops the rest of that page's script from running.
function requireAuth() {
  const username = getSession();
  if (!username) {
    window.location.href = "index.html";
    throw new Error("Not logged in — redirecting.");
  }
  return username;
}

/* ---------- 5. Feature helpers ---------- */

// ----- Users & points -----

function getUsers() { return readList(KEYS.users, SEED_USERS); }
function saveUsers(users) { writeList(KEYS.users, users); }

function findUser(username) {
  return getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
}

// Creates a brand-new account. Returns the new user, or null if the
// username is already taken.
function createUser({ username, fullName, password }) {
  const users = getUsers();
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return null;
  }
  const newUser = { username, fullName, password, points: 0, submissions: 0, joinDate: new Date().toISOString().split("T")[0] };
  users.push(newUser);
  saveUsers(users);
  addPoints(username, POINTS.signupBonus, "Joined PetroVision");
  return newUser;
}

// Adds (or subtracts) points for a user and logs why, so the
// Rewards page can show a "recent activity" feed.
function addPoints(username, amount, reason) {
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return;
  user.points = (user.points || 0) + amount;
  saveUsers(users);

  const activity = readList(KEYS.activity, []);
  activity.unshift({
    username, amount, reason,
    date: new Date().toISOString().split("T")[0],
  });
  writeList(KEYS.activity, activity.slice(0, 100)); // keep the log from growing forever
}

function getActivity(username) {
  return readList(KEYS.activity, []).filter(a => a.username === username);
}

function getLeaderboard() {
  return getUsers().slice().sort((a, b) => b.points - a.points);
}

// ----- Vehicles (Garage) -----

function getVehicles(username) {
  return readList(KEYS.vehicles, []).filter(v => v.owner === username);
}
function addVehicle(username, fields) {
  const vehicles = readList(KEYS.vehicles, []);
  const vehicle = {
    id: "V-" + Date.now(),
    owner: username,
    name: fields.name,
    type: fields.type,
    fuelType: fields.fuelType,
    efficiency: Number(fields.efficiency),
  };
  vehicles.push(vehicle);
  writeList(KEYS.vehicles, vehicles);
  addPoints(username, POINTS.newVehicle, `Added vehicle "${vehicle.name}" to Garage`);
  return vehicle;
}
function deleteVehicle(id) {
  const vehicles = readList(KEYS.vehicles, []).filter(v => v.id !== id);
  writeList(KEYS.vehicles, vehicles);
}

// ----- Refuel & Trip History -----

function getHistory(username) {
  return readList(KEYS.history, [])
    .filter(h => h.owner === username)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
function addHistoryEntry(username, entry) {
  const history = readList(KEYS.history, []);
  const record = { id: "H-" + Date.now(), owner: username, date: new Date().toISOString().split("T")[0], ...entry };
  history.push(record);
  writeList(KEYS.history, history);
  const earned = entry.type === "Refuel" ? POINTS.refuelLog : POINTS.tripLog;
  addPoints(username, earned, `Logged a ${entry.type.toLowerCase()}`);
  return record;
}

// ----- Crowdsourced stations (Map + Availability Tracker) -----

function getStations() { return readList(KEYS.stations, SEED_STATIONS); }

function addStation(username, fields) {
  const stations = getStations();
  const station = {
    id: "ST-" + Date.now(),
    name: fields.name,
    city: fields.city,
    lat: fields.lat,
    lng: fields.lng,
    fuelType: fields.fuelType,
    price: Number(fields.price),
    availability: fields.availability || "In Stock",
    submittedBy: username,
    date: new Date().toISOString().split("T")[0],
    verified: false, // new submissions start unverified, like a real crowdsourcing app
  };
  stations.push(station);
  writeList(KEYS.stations, stations);
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user) { user.submissions = (user.submissions || 0) + 1; saveUsers(users); }
  addPoints(username, POINTS.newStation, `Reported a new station: ${station.name}`);
  return station;
}

function updateAvailability(username, stationId, availability) {
  const stations = getStations();
  const station = stations.find(s => s.id === stationId);
  if (!station) return null;
  station.availability = availability;
  station.date = new Date().toISOString().split("T")[0];
  writeList(KEYS.stations, stations);
  addPoints(username, POINTS.availabilityUpdate, `Updated availability for ${station.name}`);
  return station;
}

// Average price for a fuel type across every known station — used
// by the Trip Cost Estimator as "today's" reference price.
function averagePrice(fuelType) {
  const matches = getStations().filter(s => s.fuelType === fuelType);
  if (matches.length === 0) return null;
  const total = matches.reduce((sum, s) => sum + s.price, 0);
  return total / matches.length;
}

// ----- Fuel Price Alerts -----

function getAlerts(username) {
  return readList(KEYS.alerts, []).filter(a => a.owner === username);
}
function addAlert(username, fields) {
  const alerts = readList(KEYS.alerts, []);
  const alert = { id: "AL-" + Date.now(), owner: username, ...fields };
  alerts.push(alert);
  writeList(KEYS.alerts, alerts);
  addPoints(username, POINTS.newAlert, "Set up a fuel price alert");
  return alert;
}
function deleteAlert(id) {
  const alerts = readList(KEYS.alerts, []).filter(a => a.id !== id);
  writeList(KEYS.alerts, alerts);
}

// Checks one alert against the current stations and returns the
// matching station if the alert's condition is currently true.
function checkAlert(alert) {
  const stations = getStations().filter(s => s.fuelType === alert.fuelType);
  return stations.find(s => {
    if (alert.condition === "below") return s.price <= Number(alert.threshold);
    return s.price >= Number(alert.threshold);
  }) || null;
}

/* ---------- 6. Navbar helper ----------
   Every page's navbar has a "Profile" link containing an empty
   <span id="nav-username">. This fills it in with the logged-in
   user's first name, and is called once near the top of every
   page's own script, right after requireAuth(). */
function paintNavUser() {
  const el = document.getElementById("nav-username");
  if (!el) return;
  const user = findUser(getSession());
  if (user) el.textContent = user.fullName.split(" ")[0];
}
