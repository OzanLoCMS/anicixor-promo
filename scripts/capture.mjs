// Anicixor herkese açık sayfalarından gerçek ekran görüntüleri ve arayüz koordinatları (manifest) üretir.
// Yalnızca GET istekleri; giriş yok, token yok, yazma yok. Yorum/kullanıcı adı/avatar alanları gizlenir.
import { chromium } from "playwright";
import fs from "node:fs/promises";

const BASE = (process.env.BASE_URL ?? "https://anicixor.fun").replace(/\/$/, "");
const PROFILE_USERNAME = (process.env.PROFILE_USERNAME ?? "").trim();
const OUT = "public/captures";
const W = 1920;
const H = 1080;
const DSF = Number(process.env.DSF ?? 2);

const report = {
  startedAt: new Date().toISOString(),
  base: BASE,
  steps: [],
  warnings: [],
  consoleErrors: [],
  hidden: {},
  chosen: {},
  player: {},
};
const warn = (m) => { report.warnings.push(m); console.log("UYARI:", m); };

await fs.mkdir(OUT, { recursive: true });
await fs.mkdir("report", { recursive: true });

const launchOpts = process.env.CHROME_PATH
  ? { executablePath: process.env.CHROME_PATH, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] }
  : { channel: "chrome", args: ["--autoplay-policy=no-user-gesture-required"] };
const browser = await chromium.launch(launchOpts);
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF, locale: "tr-TR" });
const page = await context.newPage();
page.on("console", (msg) => { if (msg.type() === "error" && report.consoleErrors.length < 30) report.consoleErrors.push(msg.text().slice(0, 200)); });
page.on("pageerror", (e) => { if (report.consoleErrors.length < 30) report.consoleErrors.push("pageerror: " + String(e.message).slice(0, 200)); });

const step = async (name, fn) => {
  const t = Date.now();
  try {
    const r = await fn();
    report.steps.push({ name, ok: true, ms: Date.now() - t });
    return r;
  } catch (e) {
    report.steps.push({ name, ok: false, ms: Date.now() - t, error: String(e.message).split("\n")[0] });
    console.log("ADIM HATASI:", name, String(e.message).split("\n")[0]);
    return undefined;
  }
};

const settle = async (ms = 1500) => {
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(ms);
};

const dismiss = async () => {
  const btn = page
    .locator('[id*="cookie" i] button, [class*="cookie" i] button, [id*="consent" i] button, [class*="consent" i] button')
    .filter({ hasText: /kabul|anladım|tamam|accept|ok/i })
    .first();
  if (await btn.count()) {
    await btn.click({ timeout: 2000 }).catch(() => {});
    report.warnings.push("Çerez/onay bannerı kapatıldı.");
  }
};

// Tembel yüklenen görselleri tetiklemek için sayfayı aşağı sonra yukarı kaydır.
const warm = async () => {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < Math.min(h, 9000); y += 600) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
};

// Gizlilik: yorumlar, kullanıcı adı bağlantıları ve avatarlar görüntüde gizlenir (bölüm listeleri korunur).
const privacyHide = async (key) => {
  report.hidden[key] = await page.evaluate(() => {
    const sel = '[id*="comment" i],[class*="comment" i],a[href^="/u/"],a[href^="/user/"],[class*="avatar" i]';
    let n = 0;
    document.querySelectorAll(sel).forEach((el) => {
      if (el.querySelector('a[href*="/watch/"]') || el.closest("header,nav")) return;
      el.style.visibility = "hidden";
      n++;
    });
    return n;
  });
};

const rectFn = (el, vp) => {
  const r = el.getBoundingClientRect();
  return { x: r.x + (vp ? 0 : window.scrollX), y: r.y + (vp ? 0 : window.scrollY), w: r.width, h: r.height };
};
const R = async (loc, vp = false) => {
  try {
    if (!(await loc.count())) return undefined;
    const r = await loc.first().evaluate(rectFn, vp, { timeout: 2000 });
    return r.w > 2 && r.h > 2 ? r : undefined;
  } catch { return undefined; }
};
const RS = async (loc, vp = false) => (await loc.evaluateAll((els, v) => els.map((el) => {
  const r = el.getBoundingClientRect();
  return { x: r.x + (v ? 0 : window.scrollX), y: r.y + (v ? 0 : window.scrollY), w: r.width, h: r.height };
}), vp)).filter((r) => r.w > 2 && r.h > 2);

const shot = async (name, { full = false, maxH = 6000 } = {}) => {
  const file = `${name}.jpg`;
  if (full) {
    const sh = await page.evaluate(() => document.documentElement.scrollHeight);
    const height = Math.max(H, Math.min(sh, maxH));
    await page.screenshot({ path: `${OUT}/${file}`, type: "jpeg", quality: 92, fullPage: true, clip: { x: 0, y: 0, width: W, height } });
    return { file, width: W, height };
  }
  await page.screenshot({ path: `${OUT}/${file}`, type: "jpeg", quality: 92 });
  return { file, width: W, height: H };
};

const cardRects = async (vp = false) =>
  RS(page.locator('a[href^="/anime/"]:has(img)'), vp).then((rs) => rs.filter((r) => r.w > 80 && r.h > 120));

const manifest = { capturedAt: new Date().toISOString() };

// ---- Logo ----
await step("logo", async () => {
  const res = await page.request.get(BASE + "/favicon.png");
  if (!res.ok()) throw new Error("favicon.png " + res.status());
  const buf = await res.body();
  await fs.writeFile(`${OUT}/logo.png`, buf);
  manifest.logo = { file: "logo.png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
});

// ---- Ana sayfa ----
manifest.home = await step("home", async () => {
  const resp = await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  report.homeStatus = resp?.status();
  await settle(); await dismiss(); await warm(); await privacyHide("home");
  report.homeTitle = await page.title();
  const rects = {
    header: await R(page.locator("header, nav").first()),
    hero: await R(page.locator("main section, section").first()),
  };
  const cards = await cardRects();
  report.homeCards = cards.length;
  return { name: "home", shot: await shot("home", { full: true }), rects, cards };
});

// ---- Keşfet ----
const search = await step("search", async () => {
  await page.goto(BASE + "/search", { waitUntil: "domcontentloaded" });
  await settle(2000); await dismiss(); await warm();
  const fb = page.getByRole("button", { name: /filtre/i }).first();
  const base = { name: "search", shot: await shot("search", { full: true }), rects: { filtersButton: await R(fb) }, cards: await cardRects() };
  if (!base.rects.filtersButton) warn("Keşfet: Filtreler düğmesi bulunamadı.");
  let open;
  if (base.rects.filtersButton) {
    await fb.click({ timeout: 3000 }).catch((e) => warn("Filtreler tıklanamadı: " + e.message.split("\n")[0]));
    await page.waitForTimeout(800);
    const ctl = await fb.getAttribute("aria-controls").catch(() => null);
    const panel = ctl ? await R(page.locator("#" + ctl)) : undefined;
    open = { name: "search-open", shot: await shot("search-open", { full: true }), rects: { panel }, cards: await cardRects() };
    if (!panel) warn("Keşfet: filtre paneli (aria-controls) bulunamadı.");
  }
  return open ? { base, open } : { base };
});
manifest.search = search;

// ---- Anime ve bölüm seçimi (herkese açık sitemap'ler) ----
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const picked = await step("pick-anime", async () => {
  const get = async (p) => (await page.request.get(BASE + p)).text();
  const animeLocs = locs(await get("/sitemap-animes.xml"));
  const epLocs = locs(await get("/sitemap-episodes.xml"));
  const counts = new Map();
  for (const u of epLocs) { const m = u.match(/\/watch\/([^/]+)\//); if (m) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1); }
  const slugs = animeLocs.map((u) => u.split("/anime/")[1]).filter(Boolean);
  const slug = [...slugs].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))[0];
  if (!slug) throw new Error("sitemap'te anime yok");
  const eps = epLocs.filter((u) => u.includes(`/watch/${slug}/`)).sort((a, b) => {
    const k = (u) => { const m = u.match(/sezon-(\d+)\/bolum-(\d+)/); return m ? Number(m[1]) * 10000 + Number(m[2]) : 1e9; };
    return k(a) - k(b);
  });
  report.chosen = { animeSlug: slug, episodeCount: counts.get(slug) ?? 0, episodeUrl: eps[0] ?? null, animeCount: slugs.length };
  return { slug, episodeUrl: eps[0] };
});

// ---- Anime detay ----
if (picked) {
  manifest.anime = await step("anime", async () => {
    await page.goto(`${BASE}/anime/${picked.slug}`, { waitUntil: "domcontentloaded" });
    await settle(2000); await dismiss(); await warm(); await privacyHide("anime");
    const cover = await page.evaluate(() => {
      let best; let area = 0;
      for (const img of document.images) {
        const r = img.getBoundingClientRect();
        if (r.y + scrollY < 1100 && r.width * r.height > area && r.width < 700) { area = r.width * r.height; best = { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; }
      }
      return best;
    });
    const description = await page.evaluate(() => {
      const p = [...document.querySelectorAll("p")].find((e) => e.textContent.trim().length > 80 && e.getBoundingClientRect().height > 20);
      if (!p) return undefined;
      const r = p.getBoundingClientRect();
      return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height };
    });
    const epRects = await RS(page.locator('a[href*="/watch/"]'));
    const union = epRects.length ? (() => {
      const x = Math.min(...epRects.map((r) => r.x)), y = Math.min(...epRects.map((r) => r.y));
      return { x, y, w: Math.max(...epRects.map((r) => r.x + r.w)) - x, h: Math.max(...epRects.map((r) => r.y + r.h)) - y };
    })() : undefined;
    const rects = { cover, title: await R(page.locator("h1").first()), description, episodes: union, firstEpisode: epRects[0] };
    for (const k of ["cover", "title", "description", "episodes"]) if (!rects[k]) warn(`Anime sayfası: ${k} bulunamadı.`);
    return { name: "anime", shot: await shot("anime", { full: true }), rects };
  });
}

// ---- İzleme sayfası / oynatıcı ----
const describe = `(e) => ({ tag: e.tagName, cls: String(e.className).slice(0, 90), label: e.getAttribute('aria-label'), title: e.title || null, text: (e.textContent || '').trim().slice(0, 40) })`;
if (picked?.episodeUrl) {
  manifest.watch = await step("watch", async () => {
    await page.goto(picked.episodeUrl, { waitUntil: "domcontentloaded" });
    await settle(3000); await dismiss(); await privacyHide("watch");
    await page.evaluate(() => window.scrollTo(0, 0));

    // Keşif: oynatıcı sınıfları, kontroller, iframe kaynakları (yalnızca origin), video durumu.
    report.player.classes = await page.evaluate(() => [...new Set([...document.querySelectorAll('[class*="acx-"]')].flatMap((e) => [...e.classList].filter((c) => c.startsWith("acx-"))))].slice(0, 300));
    report.player.iframes = await page.evaluate(() => [...document.querySelectorAll("iframe")].map((f) => { try { return new URL(f.src).origin; } catch { return "(src yok)"; } }));
    report.player.hasVideoTag = (await page.locator("video").count()) > 0;

    const playerLoc = page.locator('.acx-player, [class*="acx-player"]').first();
    let player = await R(playerLoc, true);
    if (!player) { player = await R(page.locator("video").first().locator(".."), true); warn("Oynatıcı .acx-player ile bulunamadı; video üst öğesi kullanıldı."); }
    if (!player) { player = await R(page.locator("iframe").first(), true); warn("Oynatıcı iframe olarak varsayıldı."); }
    if (!player) throw new Error("oynatıcı bulunamadı");

    // Oynatmayı başlat (sessiz) ve karenin gelmesini bekle.
    report.player.playback = await page.evaluate(async () => {
      const v = document.querySelector("video");
      if (!v) return { video: false };
      v.muted = true;
      try { await v.play(); } catch (e) { return { video: true, played: false, err: String(e).slice(0, 80) }; }
      await new Promise((r) => setTimeout(r, 4000));
      return { video: true, played: !v.paused, readyState: v.readyState, currentTime: Math.round(v.currentTime * 10) / 10, w: v.videoWidth, h: v.videoHeight };
    });

    const ctrlLoc = page.locator('.acx-player button, .acx-player [role="button"], .acx-player [role="menuitem"]');
    report.player.controls = await ctrlLoc.evaluateAll(eval(`(els) => els.slice(0, 80).map(${describe})`));
    const find = async (re) => {
      const all = page.locator('.acx-player button, .acx-player [role="button"], .acx-player [role="menuitem"], .acx-player li, .acx-player [class*="item"], .acx-player [class*="option"]');
      const info = await all.evaluateAll(eval(`(els) => els.map((e) => [e.getAttribute('aria-label'), e.title, e.className, (e.textContent || '').trim().slice(0, 60)].join(' | '))`));
      const i = info.findIndex((s) => re.test(s));
      return i >= 0 ? all.nth(i) : undefined;
    };
    const reveal = async () => { await page.mouse.move(player.x + player.w / 2, player.y + player.h / 2); await page.mouse.move(player.x + player.w / 2 + 12, player.y + player.h - 120); await page.waitForTimeout(700); };
    const menuRect = async () => {
      const rs = await RS(page.locator('.acx-player [role="menu"], .acx-player [class*="menu"], .acx-player [class*="settings"], .acx-player [class*="panel"]'), true);
      const pa = player.w * player.h;
      return rs.filter((r) => r.w > 80 && r.h > 50 && r.w * r.h < pa * 0.6).sort((a, b) => b.w * b.h - a.w * a.h)[0];
    };

    const states = [];
    await reveal();
    states.push({ name: "controls", shot: await shot("watch-controls"), rects: { player } });

    const settingsBtn = await find(/ayar|setting|gear|cog/i);
    if (!settingsBtn) warn("Ayarlar düğmesi bulunamadı (kalite menüsü yakalanamadı).");
    else {
      const clicked = await R(settingsBtn, true);
      await settingsBtn.click({ timeout: 3000 }).catch((e) => warn("Ayarlar tıklanamadı: " + e.message.split("\n")[0]));
      await page.waitForTimeout(800);
      const focus = (await menuRect()) ?? clicked;
      states.push({ name: "settings", shot: await shot("watch-settings"), rects: { player, clicked, focus } });
      const qItem = await find(/kalite|quality|çözünürlük|resolution|1080|720/i);
      if (qItem) {
        const qClicked = await R(qItem, true);
        await qItem.click({ timeout: 3000 }).catch((e) => warn("Kalite öğesi tıklanamadı: " + e.message.split("\n")[0]));
        await page.waitForTimeout(800);
        const qFocus = (await menuRect()) ?? qClicked;
        states.push({ name: "quality", shot: await shot("watch-quality"), rects: { player, clicked: qClicked, focus: qFocus } });
      } else warn("Kalite öğesi bulunamadı.");
      await page.keyboard.press("Escape").catch(() => {});
    }

    await reveal();
    const nextBtn = await find(/sonraki|next/i);
    if (nextBtn) {
      const nb = await R(nextBtn, true);
      await nextBtn.hover({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);
      states.push({ name: "next", shot: await shot("watch-next"), rects: { player, clicked: nb, focus: nb ? { x: nb.x - 160, y: nb.y - 80, w: nb.w + 320, h: nb.h + 160 } : undefined } });
    } else warn("Sonraki bölüm düğmesi oynatıcıda bulunamadı.");

    // Oynatıcı altı: bölüm listesi.
    await page.mouse.move(5, 5);
    await page.evaluate(() => window.scrollTo(0, 0));
    const outside = await RS(page.locator('a[href*="/watch/"]'));
    const listRect = outside.length ? (() => {
      const x = Math.min(...outside.map((r) => r.x)), y = Math.min(...outside.map((r) => r.y));
      return { x, y, w: Math.max(...outside.map((r) => r.x + r.w)) - x, h: Math.max(...outside.map((r) => r.y + r.h)) - y };
    })() : undefined;
    if (!listRect) warn("İzleme sayfasında bölüm listesi bulunamadı.");
    const below = { name: "watch-full", shot: await shot("watch-full", { full: true }), rects: { episodeList: listRect, firstEpisode: outside[0] } };
    return { states, below };
  });
}

// ---- Profil (yalnızca kullanıcı kullanıcı adı verirse) ----
if (PROFILE_USERNAME) {
  manifest.profile = await step("profile", async () => {
    await page.goto(`${BASE}/u/${encodeURIComponent(PROFILE_USERNAME)}`, { waitUntil: "domcontentloaded" });
    await settle(2500); await dismiss(); await warm();
    const focus = await R(page.locator("main").first());
    return { name: "profile", shot: await shot("profile", { full: true, maxH: 3000 }), rects: { focus: focus ? { ...focus, h: Math.min(focus.h, 700) } : undefined } };
  });
} else warn("Profil sahnesi atlandı: PROFILE_USERNAME verilmedi; kapanışta ana sayfa kullanılacak.");

await browser.close();
report.finishedAt = new Date().toISOString();
for (const k of Object.keys(manifest)) if (manifest[k] === undefined) delete manifest[k];
await fs.writeFile("src/manifest.json", JSON.stringify(manifest, null, 2));
await fs.writeFile("report/capture-report.json", JSON.stringify(report, null, 2));
console.log("Manifest anahtarları:", Object.keys(manifest).join(", "));
if (!manifest.home) { console.error("Ana sayfa yakalanamadı."); process.exit(1); }
