// frontend/js/signup.js
// Handles signup form submission and stores token on success.

import { signup } from "./api/authApi.js";
import { setToken } from "./utils.js";

const form = document.getElementById("signupForm");
if (form) {
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault(); // prevent default form GET/POST behaviour

    const username = (document.getElementById("signupUsername").value || "").trim();
    const password = (document.getElementById("signupPassword").value || "").trim();
    const displayName = (document.getElementById("signupDisplayName").value || "").trim();

    if (!username || !password) {
      alert("Enter username and password");
      return;
    }

    try {
      // call backend signup (returns { user, token, message } on success)
      const data = await signup({ username, password, displayName });

      if (data && data.token) {
        // save JWT and navigate to channel page
        setToken(data.token);
        window.location.href = "/channel.html";
      } else {
        // handle case where signup succeeded but no token returned
        alert((data && data.message) || "Signup succeeded but token not returned");
      }
    } catch (err) {
      // err may be { status, message, details } from the API helper
      const msg = err?.message || (err?.details && JSON.stringify(err.details)) || "Signup failed";
      alert(msg);
      console.error("Signup error:", err);
    }
  });
}
