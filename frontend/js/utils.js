// frontend/js/utils.js
// Small helpers used by the frontend modules

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function isAuthenticated() {
  const t = getToken();
  return !!t;
}

export function formatTime(isoOrDate) {
  if (!isoOrDate) return "";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : new Date(isoOrDate);
  return d.toLocaleString();
}

export function showError(msg, err) {
  console.error(msg, err);
  // Build a nice message for users
  let detail = "";
  if (!err) {
    detail = "";
  } else if (typeof err === "string") {
    detail = err;
  } else if (err.message) {
    detail = err.message;
  } else if (err.details) {
    try {
      detail = JSON.stringify(err.details);
    } catch (e) {
      detail = String(err.details);
    }
  } else {
    detail = JSON.stringify(err);
  }
  alert(`${msg}${detail ? "\n\nDetails: " + detail : ""}`);
}
