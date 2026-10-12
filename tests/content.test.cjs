const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { examples, cardHTML, panelHTML } = require("./fixtures.cjs");
const manifest = require("../extension/manifest.json");
const scripts = manifest.content_scripts[0].js.map((file) => fs.readFileSync(path.join(__dirname, "../extension", file), "utf8"));
const tick = () => new Promise((resolve) => setTimeout(resolve, 55));

function setup(t, { url = "https://selfservice.peepel.io/leave", html = panelHTML(), storedHours = 8 } = {}) {
  const dom = new JSDOM(`<!doctype html><html><body><main>${html}</main></body></html>`, { url, runScripts: "outside-only", pretendToBeVisual: true });
  t.after(() => {
    dom.window.dispatchEvent(new dom.window.Event("pagehide"));
    dom.window.close();
  });
  const storage = { hoursPerDay: storedHours };
  dom.window.chrome = { storage: { local: { get: async () => storage, set: async (value) => Object.assign(storage, value) }, onChanged: { addListener() {} } } };
  scripts.forEach((source) => dom.window.eval(source));
  const document = dom.window.document;
  const summary = () => document.querySelector("#peepel-clearer");
  const text = () => summary()?.shadowRoot.querySelector(".summary").textContent;
  const total = () => summary()?.shadowRoot.querySelector("[data-total]").textContent;
  return { dom, document, summary, text, total, storage };
}

test("injects once, above the calendar, and leaves original cards untouched", async (t) => {
  const ctx = setup(t);
  await tick();
  assert.equal(ctx.total(), "19");
  assert.equal(ctx.summary().parentElement.firstElementChild, ctx.summary());
  assert.equal(ctx.document.querySelectorAll('[data-slot="card"]').length, 11);
  ctx.dom.window.eval(scripts.at(-1));
  await tick();
  assert.equal(ctx.document.querySelectorAll("#peepel-clearer").length, 1);
  assert.match(ctx.text(), /European holidays/);
  assert.match(ctx.text(), /ADV days/);
  assert.equal(ctx.summary().shadowRoot.querySelectorAll(".row").length, 3);
});

test("updates a balance changed by React and handles complete panel replacement", async (t) => {
  const ctx = setup(t);
  const balance = ctx.document.querySelectorAll(".original-card")[1].querySelector(".tabular-nums");
  balance.textContent = "48u00m";
  await tick();
  assert.equal(ctx.total(), "18");
  ctx.document.querySelector("main").innerHTML = panelHTML();
  await tick();
  assert.equal(ctx.total(), "19");
  assert.equal(ctx.document.querySelectorAll("#peepel-clearer").length, 1);
});

test("waits for asynchronously loaded cards", async (t) => {
  const ctx = setup(t, { html: "" });
  assert.equal(ctx.summary(), null);
  ctx.document.querySelector("main").innerHTML = panelHTML();
  await tick();
  assert.equal(ctx.total(), "19");
});

test("navigation into and out of leave is supported without a reload", async (t) => {
  const ctx = setup(t, { url: "https://selfservice.peepel.io/app" });
  assert.equal(ctx.summary(), null);
  ctx.dom.window.history.pushState({}, "", "/leave?year=2026");
  await new Promise((resolve) => setTimeout(resolve, 575));
  assert.equal(ctx.total(), "19");
  ctx.dom.window.history.pushState({}, "", "/app");
  await new Promise((resolve) => setTimeout(resolve, 575));
  assert.equal(ctx.summary(), null);
});

test("never summarizes team leave or a hidden personal panel", async (t) => {
  const ctx = setup(t);
  ctx.document.querySelector('[role="tabpanel"]').hidden = true;
  const team = ctx.document.createElement("div");
  team.setAttribute("role", "tabpanel");
  team.id = "example-tabpanel-team";
  team.setAttribute("aria-labelledby", "example-tab-team");
  team.innerHTML = cardHTML(examples[1]);
  ctx.document.querySelector("main").append(team);
  await tick();
  assert.equal(ctx.summary(), null);
});

test("saved working day length loads and an edit recalculates immediately", async (t) => {
  const ctx = setup(t, { storedHours: 10 });
  await tick();
  assert.equal(ctx.total(), "15.8");
  const shadow = ctx.summary().shadowRoot;
  shadow.querySelector("input").value = "8";
  shadow.querySelector("form").dispatchEvent(new ctx.dom.window.Event("submit", { bubbles: true, cancelable: true }));
  await tick();
  assert.equal(ctx.total(), "19");
  assert.equal(ctx.storage.hoursPerDay, 8);
  assert.match(ctx.text(), /Saved on this browser/);
});

test("adjacent spans still identify day units without dividing them again", async (t) => {
  const ctx = setup(t, { html: panelHTML([{ label: "Wettelijke vakantie", amounts: ["2,5", "/ 20"], unit: "dagen" }]) });
  await tick();
  assert.equal(ctx.total(), "17.5");
});

test("unreadable values produce a visible partial-balance warning", async (t) => {
  const ctx = setup(t);
  ctx.document.querySelectorAll(".original-card")[1].querySelector(".tabular-nums").textContent = "?";
  await tick();
  assert.equal(ctx.total(), "11");
  assert.match(ctx.text(), /days in readable balances/);
  assert.equal(ctx.summary().shadowRoot.querySelector(".notice").hidden, false);
});

test("page text is never interpreted as markup in the summary", async (t) => {
  const ctx = setup(t, { html: panelHTML([{ label: 'Vacation <img src=x onerror="alert(1)">', amounts: ["0", "/ 10"], unit: "days" }]) });
  await tick();
  assert.equal(ctx.total(), "10");
  assert.equal(ctx.summary().shadowRoot.querySelector("img"), null);
});
