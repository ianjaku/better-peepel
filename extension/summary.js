(function (root) {
  "use strict";

  const css = `
    /* Keep the gap even when Peepel's global reset sets the host's margin to zero. */
    :host { display:block; margin:0; margin-bottom:32px !important; color:#173f37; color-scheme:light; text-align:left; font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    *,*::before,*::after { box-sizing:border-box; }
    .summary { background:#f3f9f5; border:1px solid #d6e6dc; border-radius:18px; overflow:hidden; box-shadow:0 3px 9px #173f3705; }
    .header { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:24px 28px 0; }
    h2 { margin:0; font-size:12px; font-weight:700; letter-spacing:1.8px; text-transform:uppercase; }
    .brand { color:#60756c; font-size:12px; white-space:nowrap; }
    .body { display:grid; grid-template-columns:minmax(210px,0.9fr) minmax(0,1.35fr); align-items:center; gap:38px; padding:18px 28px 26px; }
    .total { font-size:76px; letter-spacing:-4px; font-weight:650; font-variant-numeric:tabular-nums; line-height:1.1; }
    .total-label { margin:6px 0 16px; font-size:18px; letter-spacing:-0.3px; }
    .composition { display:flex; height:7px; gap:4px; max-width:240px; overflow:hidden; border-radius:5px; background:#e1eae4; }
    .segment { min-width:4px; border-radius:4px; background:var(--accent); }
    .caption { color:#63776e; font-size:12px; margin:9px 0 0; }
    .breakdown { list-style:none; padding:0; margin:0; }
    .row { display:grid; grid-template-columns:9px minmax(0,1fr) auto; gap:12px; align-items:center; padding:13px 0; border-bottom:1px solid #dce8df; }
    .row:last-child { border-bottom:0; }
    .dot { width:8px; height:8px; border-radius:50%; background:var(--accent); }
    .name { display:block; font-size:14px; font-weight:600; }
    .detail { display:block; margin-top:2px; font-size:12px; color:#63776e; }
    .days { white-space:nowrap; text-align:right; font-size:22px; font-weight:600; font-variant-numeric:tabular-nums; letter-spacing:-0.5px; }
    .days span { display:block; font-weight:400; font-size:11px; color:#63776e; letter-spacing:0; }
    .exhausted .days { color:#7b8982; }
    .negative .days { color:#a33c35; }
    .green { --accent:#299880; } .purple { --accent:#a493c0; } .amber { --accent:#d39241; } .blue { --accent:#5b8dbc; }
    footer { padding:13px 28px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px 18px; background:#eaf3ed; border-top:1px solid #d6e6dc; color:#5d7167; font-size:11px; }
    .basis { margin:0; }
    details { width:100%; }
    details summary { cursor:pointer; width:fit-content; font-size:12px; font-weight:600; color:#365d4e; }
    details summary:hover { text-decoration:underline; }
    details[open] summary { margin-bottom:12px; }
    .settings { display:flex; flex-wrap:wrap; align-items:end; gap:10px; padding:3px 0 6px; font-size:12px; }
    label { display:grid; gap:5px; }
    input { font:inherit; width:90px; padding:8px; border:1px solid #aabeb1; border-radius:7px; background:white; color:#173f37; }
    button { font:inherit; padding:9px 14px; border:0; border-radius:7px; background:#245e4d; color:white; cursor:pointer; }
    button:hover { background:#174736; }
    :focus-visible { outline:3px solid #357dca; outline-offset:3px; }
    .explanation { max-width:650px; line-height:1.65; margin:8px 0; }
    .notice { margin:0 28px 20px; padding:12px 14px; color:#765523; background:#fff5de; border:1px solid #ecdbaf; border-radius:8px; font-size:12px; }
    .notice p { margin:0; } .notice p+p { margin-top:6px; }
    .status { margin:0; align-self:center; }
    @media(max-width:650px) {
      .header { padding:20px 20px 0; } .body { grid-template-columns:1fr; gap:16px; padding:18px 20px 20px; }
      .total { font-size:68px; } .total-label { margin-top:0; } .composition { max-width:none; }
      footer { padding:13px 20px; } .notice { margin:0 20px 20px; } .row { padding:12px 0; }
    }
    @media(prefers-reduced-motion:reduce) { * { scroll-behavior:auto; } }
    @media print { details { display:none; } .summary { break-inside:avoid; box-shadow:none; } }
  `;

  const format = (value) => new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(Math.abs(value) < 0.000001 ? 0 : value);
  function element(document, tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function createSummary(document, onSave) {
    const host = document.createElement("section");
    host.id = "peepel-clearer";
    host.setAttribute("aria-label", "Holiday balance in days");
    const shadow = host.attachShadow({ mode: "open" });
    const style = element(document, "style", "", css);
    const card = element(document, "div", "summary");
    const header = element(document, "header", "header");
    header.append(element(document, "h2", "", "Your time off"), element(document, "span", "brand", "Peepel, in days"));
    const body = element(document, "div", "body");
    body.setAttribute("aria-live", "polite");
    const notice = element(document, "div", "notice");
    const footer = element(document, "footer");
    const basis = element(document, "p", "basis");
    const source = element(document, "span", "", "From your Peepel balances");
    const details = element(document, "details");
    details.append(element(document, "summary", "", "How this is calculated"));
    details.append(element(document, "p", "explanation", "Remaining = allowance minus used. Hour balances are converted to working days. Public holidays include only days Peepel says you can freely book. Remote work, sick leave and other absence types are excluded. Types with no allowance are left out."));
    const form = element(document, "form", "settings");
    const label = element(document, "label", "", "Hours in your working day");
    const input = element(document, "input");
    input.type = "number";
    input.min = "1";
    input.max = "24";
    input.step = "0.01";
    input.required = true;
    input.name = "hoursPerDay";
    label.append(input);
    const save = element(document, "button", "", "Save");
    save.type = "submit";
    const status = element(document, "p", "status");
    status.setAttribute("role", "status");
    form.append(label, save, status);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const value = input.valueAsNumber;
      if (!form.reportValidity() || !root.PeepelClearerBalances.validDayLength(value)) return;
      const persisted = await onSave(value);
      status.textContent = persisted ? "Saved on this browser." : "Applied for this visit. Could not save the setting.";
    });
    details.append(form);
    footer.append(basis, source, details);
    card.append(header, body, notice, footer);
    shadow.append(style, card);

    function update(data) {
      const hero = element(document, "div", "hero");
      const hasBalances = data.balances.length > 0;
      const total = element(document, "div", "total", hasBalances ? format(data.total) : "?");
      total.dataset.total = "";
      hero.append(total, element(document, "p", "total-label", data.warnings.length ? "days in readable balances" : "days left to book"));
      const bar = element(document, "div", "composition");
      bar.setAttribute("aria-hidden", "true");
      data.balances.filter((item) => item.remaining > 0).forEach((item) => {
        const segment = element(document, "span", `segment ${item.color}`);
        segment.style.flexGrow = String(item.remaining);
        bar.append(segment);
      });
      hero.append(bar, element(document, "p", "caption", "Your remaining holiday balance"));
      const list = element(document, "ul", "breakdown");
      list.setAttribute("aria-label", "Remaining holidays by type");
      data.balances.forEach((item) => {
        const row = element(document, "li", `row ${item.color}${item.remaining === 0 ? " exhausted" : item.remaining < 0 ? " negative" : ""}`);
        const dot = element(document, "span", "dot");
        dot.setAttribute("aria-hidden", "true");
        const description = element(document, "div");
        const title = element(document, "span", "name", item.title);
        title.title = item.label;
        const explanation = item.kind === "public" ? "Freely bookable" : `${format(item.used)} of ${format(item.allowance)} days used`;
        description.append(title, element(document, "span", "detail", explanation));
        const days = element(document, "div", "days", format(item.remaining));
        days.append(element(document, "span", "", item.remaining < 0 ? "days overdrawn" : item.remaining === 1 ? "day left" : "days left"));
        row.append(dot, description, days);
        list.append(row);
      });
      body.replaceChildren(hero, list);
      const warnings = hasBalances ? data.warnings : ["No readable holiday allowance was found. Check Peepel's original balances below.", ...data.warnings];
      notice.replaceChildren(...warnings.map((warning) => element(document, "p", "", warning)));
      notice.hidden = warnings.length === 0;
      basis.textContent = `1 day = ${format(data.hoursPerDay)} hours`;
      if (shadow.activeElement !== input) input.value = String(data.hoursPerDay);
    }
    return { host, update };
  }

  root.PeepelClearerUI = { createSummary };
})(globalThis);
