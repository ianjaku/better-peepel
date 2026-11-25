const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseAmount, parseCard, summarize } = require("../extension/balances.js");
const { examples } = require("./fixtures.cjs");
const card = (label, used, allowance, text = "") => ({ label, amounts: [used, allowance], text });

test("synthetic fixtures have 19 days left, excluding remote work and usage-only cards", () => {
  const result = summarize(examples, 8);
  assert.equal(result.total, 19);
  assert.deepEqual(result.balances.map(({ kind, remaining }) => [kind, remaining]), [["adv", 8], ["european", 8], ["public", 3]]);
  assert.equal(result.ignored, 8);
  assert.deepEqual(result.warnings, []);
});

test("minute components, decimal commas, signs and day units are handled accurately", () => {
  assert.deepEqual(parseAmount("7u30m"), { value: 7.5, unit: "hours" });
  assert.deepEqual(parseAmount("7h06m"), { value: 7.1, unit: "hours" });
  assert.deepEqual(parseAmount("7,6 uur"), { value: 7.6, unit: "hours" });
  assert.deepEqual(parseAmount("−1u30m"), { value: -1.5, unit: "hours" });
  assert.deepEqual(parseAmount("2,5 dagen"), { value: 2.5, unit: "days" });
  assert.equal(parseAmount("7u75m"), null);
  assert.equal(parseAmount("bad data"), null);
  assert.equal(parseAmount("15"), null);
});

test("subtracts used from allowance before conversion and never rounds each card first", () => {
  const result = summarize([card("Europese vakantie", "1u15m", "/ 8u00m"), card("ADV", "0u00m", "/ 0u15m")], 8);
  assert.equal(result.total, 0.875);
});

test("day-denominated balances are not divided by hours per day", () => {
  const result = summarize([card("Wettelijke vakantie", "2,5", "/ 20", "2,5 / 20 dagen")], 7.6);
  assert.equal(result.total, 17.5);
});

test("public holidays count only the explicitly freely bookable days", () => {
  const result = summarize([{ label: "Betaalde feestdag", amounts: ["2", "/ 10"], note: "1 dag vrij in te plannen" }]);
  assert.equal(result.total, 1);
  const unknown = parseCard({ label: "Betaalde feestdag", amounts: ["2", "/ 10"], text: "2 / 10 dagen" });
  assert.equal(unknown.status, "unknown");
});

test("exhausted public holidays need no bookable note, but unreadable or unbookable balances still warn", () => {
  for (const [used, allowance] of [["0", "/ 0"], ["8", "/ 8"], ["9", "/ 8"], ["64u00m", "/ 64u00m"]]) {
    const result = summarize([card("Betaalde feestdag", used, allowance, "dagen")]);
    assert.equal(result.total, 0);
    assert.equal(result.ignored, 1);
    assert.deepEqual(result.warnings, []);
  }
  for (const item of [
    card("Betaalde feestdag", "5", "/ 8", "dagen"),
    card("Betaalde feestdag", "broken", "/ 8", "dagen"),
    card("Betaalde feestdag", "8", "/ 8"),
    card("Betaalde feestdag", "8 dagen", "/ 8u00m"),
    card("Betaalde feestdag", "0", "/ -1", "dagen")
  ]) assert.equal(parseCard(item).status, "unknown");
});

test("exhausted and overdrawn entitlements do not inflate the total", () => {
  const result = summarize([card("ADV", "80u00m", "/ 80u00m"), card("Europese vakantie", "112u00m", "/ 104u00m")]);
  assert.equal(result.total, -1);
  assert.equal(result.balances.length, 2);
});

test("a missing or malformed allowance cannot silently become zero remaining", () => {
  const result = summarize([{ label: "Extra-legale vakantie", amounts: ["2"], text: "2 gebruikt" }, card("ADV", "broken", "/ 80u00m")]);
  assert.equal(result.balances.length, 0);
  assert.equal(result.warnings.length, 2);
});

test("unknown units and mismatched units produce a warning, not a made-up balance", () => {
  assert.equal(parseCard(card("Vakantie", "2", "/ 20")).status, "unknown");
  assert.equal(parseCard(card("Vakantie", "2 dagen", "/ 20u00m")).status, "unknown");
});

test("changing day length affects only hour balances", () => {
  assert.equal(summarize(examples, 10).total, 15.8);
  assert.equal(summarize(examples, 8).total, 19);
  for (const invalid of [0, -8, 25, NaN, Infinity, "8"]) assert.throws(() => summarize(examples, invalid), RangeError);
});

test("remote work, sickness, family leave, and unpaid holiday are excluded", () => {
  for (const label of ["Gewerkt buitenland/working remotely", "Ziekte", "Geboorteverlof", "Bevallingsrust", "Klein verlet", "Freelancer/Contractor Leave", "Unpaid holiday", "Onbetaald verlof"]) {
    assert.equal(summarize([card(label, "0", "/ 20", "0 / 20 dagen")]).balances.length, 0, label);
  }
});
