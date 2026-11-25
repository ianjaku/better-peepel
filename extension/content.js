(function () {
  "use strict";
  if (globalThis.__peepelClearerStarted) return;
  globalThis.__peepelClearerStarted = true;

  const { normalize, summarize, validDayLength } = globalThis.PeepelClearerBalances;
  let hoursPerDay = 8;
  let summary;
  let signature = "";
  let frame;
  let previousPath = location.pathname;
  const isLeavePage = () => /^\/leave\/?$/.test(location.pathname);

  function getPanel() {
    return Array.from(document.querySelectorAll('[role="tabpanel"]')).find((panel) => {
      const label = document.getElementById(panel.getAttribute("aria-labelledby"));
      return !panel.hidden && panel.getAttribute("aria-hidden") !== "true" &&
        (/tabpanel-calendar$/.test(panel.id) || /^(mijn verlof|my leave)$/i.test(normalize(label?.textContent)));
    });
  }

  function readAmount(element) {
    // Peepel's animated counters include a hidden sizing copy of the final value.
    // Read that copy once so the total also stays accurate during the animation.
    const finalValue = element.querySelector(':scope > span[aria-hidden="true"].invisible');
    return normalize((finalValue || element).textContent);
  }

  function readCards(panel) {
    return Array.from(panel.querySelectorAll('[data-slot="card"]'))
      .filter((card) => !card.querySelector('[data-slot="card"]'))
      .map((card) => {
        const labelElement = card.querySelector("span.wrap-break-word");
        if (!labelElement) return null;
        return {
          label: normalize(labelElement.textContent),
          note: normalize(labelElement.parentElement.textContent).slice(normalize(labelElement.textContent).length),
          amounts: Array.from(card.querySelectorAll("span.tabular-nums")).map(readAmount),
          text: normalize(Array.from(card.querySelectorAll("span")).map((span) => span.textContent).join(" "))
        };
      }).filter(Boolean);
  }

  function removeSummary() {
    summary?.host.remove();
    signature = "";
  }

  async function saveHours(value) {
    hoursPerDay = value;
    refresh();
    try {
      if (!globalThis.chrome?.storage?.local) return false;
      await chrome.storage.local.set({ hoursPerDay: value });
      return true;
    } catch {
      return false;
    }
  }

  function refresh() {
    if (!isLeavePage()) return removeSummary();
    const panel = getPanel();
    if (!panel) return removeSummary();
    const cards = readCards(panel);
    if (!cards.length) return removeSummary();
    const nextSignature = JSON.stringify([hoursPerDay, cards]);
    if (!summary) summary = globalThis.PeepelClearerUI.createSummary(document, saveHours);
    if (summary.host.parentElement !== panel) panel.prepend(summary.host);
    if (signature === nextSignature) return;
    signature = nextSignature;
    summary.update(summarize(cards, hoursPerDay));
  }

  function scheduleRefresh() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      refresh();
    });
  }

  const observer = new MutationObserver(scheduleRefresh);
  const observerOptions = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["hidden", "aria-hidden", "aria-selected"] };
  observer.observe(document.body, observerOptions);
  addEventListener("popstate", scheduleRefresh);
  // pushState does not emit popstate. Watch the path without touching the site's router.
  function checkPath() {
    if (previousPath !== location.pathname) {
      previousPath = location.pathname;
      scheduleRefresh();
    }
  }
  let routeTimer = setInterval(checkPath, 500);
  addEventListener("pagehide", () => {
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
    frame = undefined;
    clearInterval(routeTimer);
  });
  addEventListener("pageshow", () => {
    observer.observe(document.body, observerOptions);
    clearInterval(routeTimer);
    routeTimer = setInterval(checkPath, 500);
    scheduleRefresh();
  });

  if (globalThis.chrome?.storage?.local) {
    chrome.storage.local.get("hoursPerDay").then((settings) => {
      if (validDayLength(settings.hoursPerDay)) hoursPerDay = settings.hoursPerDay;
      scheduleRefresh();
    }).catch(() => {});
    chrome.storage.onChanged?.addListener((changes, area) => {
      if (area !== "local" || !changes.hoursPerDay) return;
      hoursPerDay = validDayLength(changes.hoursPerDay.newValue) ? changes.hoursPerDay.newValue : 8;
      scheduleRefresh();
    });
  }
  refresh();
})();
