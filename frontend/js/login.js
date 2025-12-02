// frontend/js/login.js
import { login } from "./api/authApi.js";
import { setToken } from "./utils.js";

const form = document.getElementById("loginForm");
if (form) {
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const username = (document.getElementById("loginUsername").value || "").trim();
    const password = (document.getElementById("loginPassword").value || "").trim();
    if (!username || !password) return alert("Enter username and password");
    try {
      const data = await login({ username, password });
      if (data.token) {
        setToken(data.token);
        // redirect to main chat page
        window.location.href = "/channel.html";
      } else {
        alert("Login succeeded but token not returned");
      }
    } catch (err) {
      alert(err?.message || "Login failed");
    }
  });
}
