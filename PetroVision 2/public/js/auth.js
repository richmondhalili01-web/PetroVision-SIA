/* ============================================================
   PetroVision — js/auth.js
   ------------------------------------------------------------
   Powers index.html: switching between the Log In and Sign Up
   forms, and handling both submissions using the functions in
   store.js (findUser, createUser, setSession).

   If someone is already logged in and lands back on this page
   (e.g. they hit the back button), send them straight to the
   dashboard instead of showing the login form again.
   ============================================================ */

if (getSession()) {
  const activeUser = findUser(getSession());
  window.location.href = activeUser && activeUser.role === "admin" ? "admin-dashboard.html" : "dashboard.html";
}

const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const banner = document.getElementById("banner");

function showTab(which) {
  const isLogin = which === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabSignup.classList.toggle("active", !isLogin);
  loginForm.style.display = isLogin ? "block" : "none";
  signupForm.style.display = isLogin ? "none" : "block";
  banner.innerHTML = "";
}

tabLogin.addEventListener("click", () => showTab("login"));
tabSignup.addEventListener("click", () => showTab("signup"));

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  const user = findUser(username);
  if (!user || user.password !== password) {
    banner.innerHTML = `<div class="banner banner-danger">Incorrect username or password.</div>`;
    return;
  }

  setSession(user.username);
  window.location.href = user.role === "admin" ? "admin-dashboard.html" : "dashboard.html";
});

signupForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const fullName = document.getElementById("signup-fullname").value.trim();
  const username = document.getElementById("signup-username").value.trim();
  const password = document.getElementById("signup-password").value;

  if (!fullName || !username || !password) {
    banner.innerHTML = `<div class="banner banner-danger">Please fill in every field.</div>`;
    return;
  }

  const user = createUser({ username, fullName, password });
  if (!user) {
    banner.innerHTML = `<div class="banner banner-danger">That username is already taken.</div>`;
    return;
  }

  setSession(user.username);
  window.location.href = user.role === "admin" ? "admin-dashboard.html" : "dashboard.html";
});
