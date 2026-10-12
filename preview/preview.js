// A local-only storage adapter. This file is not shipped in the extension.
window.chrome = { storage: { local: {
  async get() { return { hoursPerDay: Number(localStorage.getItem("preview-hours-per-day") || 8) }; },
  async set({ hoursPerDay }) { localStorage.setItem("preview-hours-per-day", hoursPerDay); }
} } };

const calendar = document.createElement("div");
calendar.className = "calendar";
calendar.setAttribute("aria-label", "October 2026 calendar preview");
calendar.innerHTML = '<div class="calendar-header"><strong>oktober 2026</strong><span class="arrows" aria-hidden="true">‹ ›</span></div><div class="calendar-grid"></div>';
const grid = calendar.querySelector(".calendar-grid");
for (const day of ["MA", "DI", "WO", "DO", "VR", "ZA", "ZO"]) {
  const cell = document.createElement("span"); cell.className = "weekday"; cell.textContent = day; grid.append(cell);
}
for (let i = -2; i <= 32; i++) {
  const cell = document.createElement("span");
  cell.textContent = i < 1 ? i + 30 : i > 31 ? 1 : i;
  if (i < 1 || i > 31) cell.className = "outside";
  if (i === 12) cell.className = "today";
  grid.append(cell);
}
document.getElementById("calendar-slot").append(calendar);

document.getElementById("simulate-update").addEventListener("click", () => {
  document.querySelectorAll(".original-card")[1].querySelector(".tabular-nums").textContent = "48u00m";
});
document.getElementById("reset").addEventListener("click", () => {
  localStorage.removeItem("preview-hours-per-day");
  location.reload();
});
document.getElementById("example-tab-team").addEventListener("click", () => {
  document.querySelector('[role="tabpanel"]').hidden = true;
  document.getElementById("example-tab-team").setAttribute("aria-selected", "true");
  document.getElementById("example-tab-calendar").setAttribute("aria-selected", "false");
});
document.getElementById("example-tab-calendar").addEventListener("click", () => {
  document.querySelector('[role="tabpanel"]').hidden = false;
  document.getElementById("example-tab-team").setAttribute("aria-selected", "false");
  document.getElementById("example-tab-calendar").setAttribute("aria-selected", "true");
});
