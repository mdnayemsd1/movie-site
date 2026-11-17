const grid = document.querySelector("#videoGrid");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const playerModal = document.querySelector("#playerModal");
const playerFrame = document.querySelector("#playerFrame");
const adminModal = document.querySelector("#adminModal");
const loginView = document.querySelector("#loginView");
const dashboardView = document.querySelector("#dashboardView");
let videos = [];
let clickCount = 0;
let clickTimer;

document.querySelector("#year").textContent = new Date().getFullYear();

function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop();
  } catch {}
  return null;
}
function videoThumbnail(url) {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : "";
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function renderVideos() {
  const term = searchInput.value.trim().toLowerCase();
  const shown = videos.filter(v => v.title.toLowerCase().includes(term));
  grid.innerHTML = "";
  emptyState.hidden = shown.length !== 0;
  if (!shown.length) return;
  shown.forEach((video, index) => {
    const card = document.createElement("article");
    card.className = "video-card";
    card.style.animationDelay = `${Math.min(index * 70, 350)}ms`;
    const thumb = videoThumbnail(video.url);
    card.innerHTML = `<div class="thumbnail">${thumb ? `<img loading="lazy" src="${thumb}" alt="" onerror="this.remove()">` : `<span class="thumbnail-fallback">PLAY</span>`}<span class="card-play">▶</span></div><div class="card-info"><h3 class="card-title">${escapeHtml(video.title)}</h3><div class="card-meta"><span>VIDEO COLLECTION</span><span>WATCH NOW ↗</span></div></div>`;
    card.addEventListener("click", () => openPlayer(video));
    grid.appendChild(card);
  });
}
async function loadVideos() {
  try {
    const response = await fetch("/api/videos");
    if (!response.ok) throw new Error("Could not load videos");
    videos = await response.json();
    renderVideos();
  } catch {
    grid.innerHTML = '<div class="loading-state">Could not connect to the video library. Please try again later.</div>';
  }
}
function playerSource(url) {
  const id = youtubeId(url);
  if (id) return `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" title="Video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  let host = "";
  try { host = new URL(url).hostname; } catch {}
  if (host.includes("vimeo.com")) {
    const idMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (idMatch) return `<iframe src="https://player.vimeo.com/video/${idMatch[1]}?autoplay=1" title="Vimeo video player" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }
  return `<video controls autoplay playsinline src="${escapeHtml(url)}">Your browser does not support this video.</video>`;
}
function openPlayer(video) {
  document.querySelector("#playerTitle").textContent = video.title;
  playerFrame.innerHTML = playerSource(video.url);
  playerModal.classList.add("open");
  playerModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closePlayer() {
  playerModal.classList.remove("open");
  playerModal.setAttribute("aria-hidden", "true");
  playerFrame.innerHTML = "";
  document.body.style.overflow = "";
}
document.querySelectorAll("[data-close-player]").forEach(el => el.addEventListener("click", closePlayer));
searchInput.addEventListener("input", renderVideos);

function openAdmin() {
  adminModal.classList.add("open");
  adminModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  checkSession();
}
function closeAdmin() {
  adminModal.classList.remove("open");
  adminModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
document.querySelectorAll("[data-close-admin]").forEach(el => el.addEventListener("click", closeAdmin));
document.querySelector("#secretAccess").addEventListener("click", () => {
  clickCount++;
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => clickCount = 0, 2200);
  if (clickCount >= 7) {
    clickCount = 0;
    clearTimeout(clickTimer);
    openAdmin();
  }
});
async function checkSession() {
  try {
    const res = await fetch("/api/admin/session");
    const data = await res.json();
    setAdminView(Boolean(data.authenticated));
    if (data.authenticated) loadAdminVideos();
  } catch { setAdminView(false); }
}
function setAdminView(authenticated) {
  loginView.hidden = authenticated;
  dashboardView.hidden = !authenticated;
}
function message(id, text, isError = false) {
  const el = document.querySelector(id);
  el.textContent = text;
  el.classList.toggle("error", isError);
}
document.querySelector("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  message("#loginMessage", "Signing in...");
  try {
    const res = await fetch("/api/admin/login", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:document.querySelector("#adminPassword").value})});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    document.querySelector("#adminPassword").value = "";
    message("#loginMessage", "");
    setAdminView(true);
    loadAdminVideos();
  } catch (err) { message("#loginMessage", err.message, true); }
});
async function loadAdminVideos() {
  const list = document.querySelector("#adminVideoList");
  list.innerHTML = '<p class="admin-empty">Loading...</p>';
  try {
    const res = await fetch("/api/videos");
    if (!res.ok) throw new Error();
    const items = await res.json();
    list.innerHTML = "";
    if (!items.length) { list.innerHTML = '<p class="admin-empty">No videos published yet.</p>'; return; }
    items.forEach(video => {
      const row = document.createElement("div");
      row.className = "admin-video-row";
      row.innerHTML = `<span title="${escapeHtml(video.title)}">${escapeHtml(video.title)}</span><button class="delete-button" type="button">Delete</button>`;
      row.querySelector("button").addEventListener("click", () => deleteVideo(video.id, video.title));
      list.appendChild(row);
    });
  } catch { list.innerHTML = '<p class="admin-empty">Could not load videos.</p>'; }
}
document.querySelector("#videoForm").addEventListener("submit", async e => {
  e.preventDefault();
  const title = document.querySelector("#videoTitle").value.trim();
  const url = document.querySelector("#videoUrl").value.trim();
  message("#videoMessage", "Publishing...");
  try {
    const res = await fetch("/api/videos", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,url})});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not publish video");
    document.querySelector("#videoForm").reset();
    message("#videoMessage", "Video published successfully.");
    await Promise.all([loadVideos(), loadAdminVideos()]);
  } catch (err) { message("#videoMessage", err.message, true); }
});
async function deleteVideo(id, title) {
  if (!confirm(`Delete "${title}"?`)) return;
  try {
    const res = await fetch(`/api/videos/${encodeURIComponent(id)}`, {method:"DELETE"});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");
    await Promise.all([loadVideos(), loadAdminVideos()]);
  } catch (err) { alert(err.message); }
}
document.querySelector("#logoutButton").addEventListener("click", async () => {
  await fetch("/api/admin/logout", {method:"POST"});
  setAdminView(false);
  message("#loginMessage", "You have signed out.");
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { closePlayer(); closeAdmin(); }
});
loadVideos();
