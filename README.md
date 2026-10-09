# PetroVision 🛺⛽

**PetroVision: A Mobile and Web-based Crowdsourced Fuel Price, Station
Locator, and Trip Cost Estimation System.**

A front-end-only prototype — plain HTML, CSS, and JavaScript, no server,
no Node.js, no install step. Every bit of data (accounts, stations, trips,
points) is saved in your browser's **localStorage**.

## How to run it

Open `public/index.html` in a browser.

- **Easiest:** double-click `public/index.html`.
- **Recommended:** if you're using VS Code, right-click `public/index.html`
  → **Open with Live Server**. Serving over `http://localhost` avoids some
  browsers' quirks with storage on `file://` pages.

**The Map page needs an internet connection** to load the map itself —
it fetches map tile images live from OpenStreetMap. Every other page
works completely offline.

## Log in

Use the quick demo account, or sign up your own (Sign Up is a tab right
on the login screen):

| Username | Password |
|---|---|
| `demo` | `demo` |

A "crowd" of 8 other sample drivers (with their own points and station
reports already in the system) is seeded in on first run, so the
leaderboard and map don't look empty before you've added anything.

## The 8 features → the 8 things in the navbar

| Navbar item | Feature |
|---|---|
| Map | Crowdsourced Map & Price Updates — tap "Report a Fuel Price," click anywhere on the map to drop a pin, fill in the details |
| Trip Cost | Trip Cost Estimator — pick a start city, end city, and one of your vehicles |
| History | Refuel & Trip History — trips saved from the estimator, plus refuels you log yourself |
| Rewards | Gamified Rewards System — your points, badge tier, the leaderboard, and your recent activity |
| Garage | Personalized Vehicle Garage — add/remove vehicles with their fuel type and efficiency |
| Alerts | Fuel Price Alerts — get flagged the moment a crowdsourced price matches your target |
| Availability | Fuel Availability Tracker — see and update stock status per station |
| Profile (top right) | Driver Profile Card — your info, badge, and contribution stats |

## The points system

| Action | Points |
|---|---|
| Sign up | +5 |
| Report a new fuel station / price | +10 |
| Update a station's availability | +5 |
| Log a refuel | +5 |
| Save a trip estimate to History | +5 |
| Add a vehicle to the Garage | +5 |
| Create a Price Alert | +2 |

Badge tiers: **Newbie** (0) → **Contributor** (100) → **Trusted Reporter**
(300) → **Fuel Hero** (700) → **Legend** (1500).

## Project structure

```
PetroVision/
└── public/
    ├── index.html            (login / sign up — the front page)
    ├── dashboard.html         (home after login)
    ├── map.html
    ├── trip-estimator.html
    ├── history.html
    ├── rewards.html
    ├── garage.html
    ├── profile.html
    ├── alerts.html
    ├── availability.html
    ├── css/
    │   └── style.css          (one shared stylesheet)
    ├── vendor/leaflet/         (the Leaflet mapping library, bundled
    │                            locally so only the map *tiles* need
    │                            internet, not the library itself)
    └── js/
        ├── store.js            (the "database" — localStorage + all
        │                        seed data + every CRUD function)
        ├── auth.js              (login/signup page)
        ├── dashboard.js
        ├── map.js
        ├── trip-estimator.js
        ├── history.js
        ├── rewards.js
        ├── garage.js
        ├── profile.js
        ├── alerts.js
        └── availability.js
```

## How the pieces connect

- Every page loads `js/store.js` first — it defines the cities, fuel
  types, badge tiers, point values, seed data, and every function that
  reads or writes localStorage (`getStations()`, `addVehicle()`,
  `addPoints()`, etc.). Every other script calls these instead of
  touching `localStorage` directly.
- `requireAuth()` runs at the top of every page except the login page —
  if nobody's logged in, it redirects straight back to `index.html`.
- The Map's crowdsourced station data is reused by three features at
  once: the Map itself, the Availability Tracker (same records, shown
  as a table), and the Trip Cost Estimator (today's average price per
  fuel type is calculated from these same reports).
- Distance between two cities is estimated with the haversine formula
  (straight-line "great circle" distance) × a 1.3 road-distance factor
  — a reasonable estimate for a prototype, though it doesn't account
  for ferries/flights between islands.

Every file is commented to explain what it does and why. Suggested
study order: `js/store.js` first, then pick one feature (e.g. the Map)
and follow it through its HTML file, its own script, and the store.js
functions it calls.

## Note on accounts

Passwords are stored in plain text in localStorage for this prototype —
fine for a demo, but never do this in a real production system (real
systems hash and salt passwords, and never store them in the browser).
