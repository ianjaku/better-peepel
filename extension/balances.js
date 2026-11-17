(function (root) {
  "use strict";

  const normalize = (value) => String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const number = (value) => Number(value.replace(",", "."));
  const decimal = "[+-]?\\d+(?:[.,]\\d+)?";

  function parseAmount(value, fallbackUnit) {
    const text = normalize(value).replace(/\u2212/g, "-");
    const hours = text.match(/^([+-]?)(\d+)\s*[uh]\s*(?:(\d{1,2})\s*m)?$/i);
    if (hours) {
      const minutes = Number(hours[3] || 0);
      if (minutes >= 60) return null;
      return { value: (Number(hours[2]) + minutes / 60) * (hours[1] === "-" ? -1 : 1), unit: "hours" };
    }
    const explicit = text.match(new RegExp(`^(${decimal})\\s*(dag(?:en)?|days?|uur|uren|hours?|h)$`, "i"));
    if (explicit) return { value: number(explicit[1]), unit: /^(dag|dagen|day|days)$/i.test(explicit[2]) ? "days" : "hours" };
    if (fallbackUnit && new RegExp(`^${decimal}$`).test(text)) return { value: number(text), unit: fallbackUnit };
    return null;
  }

  function classify(label) {
    const text = normalize(label).toLowerCase();
    if (/\b(ziekte|sick|thuiswerk|remote|buitenland|geboorte|bevallings|maternity|paternity|parental|klein verlet|contractor|freelancer|onbetaald|unpaid)\b/.test(text)) return null;
    if (/feestdag|public holiday|bank holiday/.test(text)) return { kind: "public", title: "Public holidays", color: "amber" };
    if (/\badv\b|inhaalrust|\brtt\b|compensatory/.test(text)) return { kind: "adv", title: "ADV days", color: "purple" };
    if (/europese vakantie|european (leave|holiday)/.test(text)) return { kind: "european", title: "European holidays", color: "green" };
    if (/extra[- ]?legale? vakantie|extra[- ]?legal|additional (holiday|leave)/.test(text)) return { kind: "extra", title: "Extra holidays", color: "blue" };
    if (/vakantie|jaarlijks verlof|annual leave|holiday|vacation/.test(text)) return { kind: "holiday", title: label, color: "blue" };
    return null;
  }

  function parseUsage(amounts, text) {
    if (amounts.length !== 2) return null;
    const defaultUnit = /\b(dag(?:en)?|days?)\b/i.test(text) ? "days" : /\b(uur|uren|hours?)\b/i.test(text) ? "hours" : undefined;
    const allowance = parseAmount(normalize(amounts[1]).replace(/^\/\s*/, ""), defaultUnit);
    const used = parseAmount(amounts[0], allowance?.unit || defaultUnit);
    if (!allowance || !used || used.unit !== allowance.unit || allowance.value < 0) return null;
    return { unit: used.unit, used: used.value, allowance: allowance.value, remaining: allowance.value - used.value };
  }

  // Peepel displays used / allowance, not remaining / allowance.
  // Public holidays are different: only the explicitly bookable amount is useful.
  function parseCard({ label, amounts, note = "", text = "" }) {
    const category = classify(label);
    if (!category) return { status: "ignored", label };
    if (category.kind === "public") {
      const bookable = normalize(note).match(new RegExp(`(${decimal})\\s*(dag(?:en)?|days?)\\s*(?:vrij in te plannen|freely bookable|available to (?:book|schedule))`, "i"));
      if (!bookable) {
        // Peepel omits the bookable note when no days remain.
        const usage = parseUsage(amounts, text);
        if (usage && usage.remaining <= 0) return { status: "ignored", label };
        return { status: "unknown", label, reason: "Public holidays have no freely bookable balance listed." };
      }
      return { status: "balance", label, ...category, remaining: number(bookable[1]), unit: "days", used: null, allowance: null };
    }
    if (amounts.length < 2) {
      // A usage-only card is not an entitlement. Zero used does not mean zero left.
      if (/^0(?:[.,]0+)?(?:\s*[uh]0{1,2}m)?$/.test(normalize(amounts[0]))) return { status: "ignored", label };
      return { status: "unknown", label, reason: `${label}: no allowance is listed.` };
    }
    const usage = parseUsage(amounts, text);
    if (!usage) {
      return { status: "unknown", label, reason: `${label}: the balance could not be read.` };
    }
    if (usage.allowance === 0 && usage.used === 0) return { status: "ignored", label };
    return { status: "balance", label, ...category, ...usage };
  }

  function validDayLength(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 24;
  }

  function summarize(cards, hoursPerDay = 8) {
    if (!validDayLength(hoursPerDay)) throw new RangeError("A working day must be between 1 and 24 hours.");
    const parsed = cards.map(parseCard);
    const balances = parsed.filter((card) => card.status === "balance").map((card) => {
      const divisor = card.unit === "hours" ? hoursPerDay : 1;
      return { ...card, remaining: card.remaining / divisor, used: card.used === null ? null : card.used / divisor, allowance: card.allowance === null ? null : card.allowance / divisor };
    }).sort((a, b) => b.remaining - a.remaining || a.label.localeCompare(b.label));
    return {
      balances,
      total: balances.reduce((sum, card) => sum + card.remaining, 0),
      warnings: parsed.filter((card) => card.status === "unknown").map((card) => card.reason),
      hoursPerDay,
      ignored: parsed.filter((card) => card.status === "ignored").length
    };
  }

  const api = { normalize, parseAmount, classify, parseCard, summarize, validDayLength };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PeepelClearerBalances = api;
})(globalThis);
