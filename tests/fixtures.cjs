const examples = [
  { label: "Betaalde inhaalrust ADV", amounts: ["16u00m", "/ 80u00m"], color: "#bb8fce" },
  { label: "Europese vakantie", amounts: ["40u00m", "/ 104u00m"], color: "#4ecdc4" },
  { label: "Gewerkt buitenland/working remotely", amounts: ["4", "/ 20"], unit: "dagen", color: "#f89406" },
  { label: "Bevallingsrust", amounts: ["0"], unit: "gebruikt" },
  { label: "Extra-legale vakantie", amounts: ["0"], unit: "gebruikt" },
  { label: "Freelancer/Contractor Leave", amounts: ["0"], unit: "gebruikt" },
  { label: "Geboorteverlof", amounts: ["0"], unit: "gebruikt" },
  { label: "Klein verlet", amounts: ["0"], unit: "gebruikt" },
  { label: "Thuiswerk", amounts: ["0"], unit: "gebruikt" },
  { label: "Ziekte", amounts: ["0"], unit: "gebruikt" },
  { label: "Betaalde feestdag", amounts: ["5", "/ 8"], unit: "dagen", note: "3 dagen vrij in te plannen", color: "#ffa07a" }
];
const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

// All balances are synthetic. The markup reproduces Peepel's card structure.
// Do not put real account data, identifiers or credentials in fixtures.
function cardHTML(card, { animated = false } = {}) {
  const amounts = card.amounts.map((amount, index) => {
    // Peepel keeps the final value in a hidden sizing span while the visible value animates.
    const content = animated && index === 0
      ? `<span aria-hidden="true" class="invisible col-start-1 row-start-1">${escape(amount)}</span><span class="col-start-1 row-start-1">${escape(amount)}</span>`
      : escape(amount);
    return `<span class="tabular-nums${animated && index === 0 ? " grid justify-items-end" : ""}">${content}</span>`;
  }).join("");
  return `<div data-slot="card" class="original-card" style="--card-color:${card.color || "#a9b2a5"}"><div class="space-y-3"><div class="card-content"><div class="card-label"><span class="original-icon" aria-hidden="true">${card.unit === "gebruikt" ? "○" : "◷"}</span><div class="min-w-0"><span class="block text-sm font-medium wrap-break-word text-foreground">${escape(card.label)}</span>${card.note ? `<span class="block text-xs font-normal text-muted-foreground">${escape(card.note)}</span>` : ""}</div></div><div class="card-amount">${amounts}${card.unit ? `<span class="unit">${escape(card.unit)}</span>` : ""}</div></div>${card.amounts.length === 2 ? '<div class="original-progress"><span></span></div>' : ""}</div></div>`;
}

function panelHTML(cards = examples, options) {
  return `<div role="tablist"><button role="tab" id="example-tab-calendar" aria-selected="true">Mijn Verlof</button><button role="tab" id="example-tab-team" aria-selected="false">Mijn team</button></div><div role="tabpanel" data-slot="tab-panel" id="example-tabpanel-calendar" aria-labelledby="example-tab-calendar"><div class="space-y-6"><div id="calendar-slot"></div><div class="original-balances">${cards.map((card) => cardHTML(card, options)).join("")}</div></div></div>`;
}

module.exports = { examples, cardHTML, panelHTML };
