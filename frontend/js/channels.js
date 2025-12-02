// frontend/js/channels.js
// Load channel list, create channel, handle join/leave actions
import { getChannels, createChannel as apiCreateChannel, joinChannel as apiJoinChannel, leaveChannel as apiLeaveChannel, getChannel } from "./api/channelApi.js";
import { createSocket, joinChannelRoom, leaveChannelRoom } from "./socket.js";
import { showError, getToken } from "./utils.js";
import chat from "./chat.js";

/**
 * Expected DOM:
 * - #channelList        (container)
 * - #createChannelForm  (form)
 * - #createChannelName  (input)
 */

export async function loadChannels() {
  try {
    const res = await getChannels();
    const channels = res.channels || [];
    const list = document.getElementById("channelList");
    if (!list) return;
    list.innerHTML = "";

    const token = getToken();

    channels.forEach((c) => {
      const el = document.createElement("div");
      el.className = "channel-item";
      el.dataset.channelId = c.id;

      // If user is not authenticated, show "View" only
      const joinBtnHtml = token
        ? `<button class="join-btn">Join</button>`
        : `<button class="join-btn" disabled title="Login to join">Login to join</button>`;

      el.innerHTML = `
        <div>
          <div class="channel-name">${escapeHtml(c.name)}</div>
          <div class="channel-meta">${c.memberCount} members</div>
        </div>
        ${joinBtnHtml}
      `;

      const btn = el.querySelector(".join-btn");
      if (btn && !btn.disabled) {
        btn.addEventListener("click", async () => {
          try {
            await apiJoinChannel(c.id);
            // join socket room too
            const sock = createSocket();
            if (sock) joinChannelRoom(c.id);
            // open chat UI
            chat.openChannel({ id: c.id, name: c.name });
          } catch (err) {
            // If unauthorized, send to login
            if (err && err.status === 401) {
              window.location.href = "/login.html";
              return;
            }
            showError("Failed to join channel", err);
          }
        });
      }

      list.appendChild(el);
    });
  } catch (err) {
    showError("Failed to load channels", err);
  }
}

export function attachCreateChannelHandler() {
  const form = document.getElementById("createChannelForm");
  if (!form) return;
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const nameInput = document.getElementById("createChannelName");
    const name = (nameInput.value || "").trim();
    if (!name) return alert("Enter channel name");

    try {
      const res = await apiCreateChannel({ name });
      nameInput.value = "";
      // reload channels
      await loadChannels();
      // open the created channel
      const channel = res.channel;
      if (channel && channel.id) {
        chat.openChannel({ id: channel.id, name: channel.name });
      }
    } catch (err) {
      // redirect to login when unauthorized
      if (err && err.status === 401) {
        window.location.href = "/login.html";
        return;
      }
      showError("Failed to create channel", err);
    }
  });
}

function escapeHtml(s = "") {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
