/**
 * ============================================================
 *  ANALYTICS ENGINE — Hamburgueria Seu Auri
 *  v3.0 — Firebase Realtime Database (sincronizado entre dispositivos)
 *  Fallback para localStorage se Firebase não estiver disponível
 * ============================================================
 *
 *  SETUP:
 *  1. No Firebase Console, crie um projeto (ou use o existente)
 *  2. Ative o Realtime Database (modo "teste" por agora)
 *  3. Cole sua databaseURL em FIREBASE_DB_URL abaixo
 *  4. Publique os arquivos
 * ============================================================
 */

(function () {
  "use strict";

  // ── ⚠️  CONFIGURE AQUI ──────────────────────────────────────
  const FIREBASE_DB_URL = "https://hamburgueriaseuauri-default-rtdb.firebaseio.com";
  // ────────────────────────────────────────────────────────────

  const DB_PATH = FIREBASE_DB_URL;

  const KEYS = {
    VISITS:    "analytics",
    CLICKS:    "produtos",
    ORDERS:    "pedidos",
    WA_CLICKS: "whatsappClicks",
    FEEDBACKS: "feedbacks",
  };

  // Chaves localStorage (fallback + sessão)
  const LS_KEYS = {
    VISITS:    "aurix_visits",
    CLICKS:    "aurix_product_clicks",
    ORDERS:    "aurix_orders",
    WA_CLICKS: "aurix_wa_clicks",
    FEEDBACKS: "aurix_feedbacks",
    SESSION:   "aurix_session",
  };

  /* ── Helpers ── */
  function now()   { return new Date().toISOString(); }
  function today() { return new Date().toLocaleDateString("pt-BR"); }
  function uid()   { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

  /* ── localStorage fallback ── */
  function lsLoad(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } }
  function lsSave(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.warn("LS:", e); } }

  /* ── Firebase REST helpers ── */
  async function fbGet(path) {
    try {
      const res = await fetch(`${DB_PATH}/${path}.json`);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  async function fbSet(path, data) {
    try {
      await fetch(`${DB_PATH}/${path}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (e) { console.warn("Firebase write:", e); }
  }

  async function fbPush(path, data) {
    try {
      await fetch(`${DB_PATH}/${path}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (e) { console.warn("Firebase push:", e); }
  }

  /* ── Testa disponibilidade do Firebase ── */
  let _fbAvailable = null;
  async function isFbAvailable() {
    if (_fbAvailable !== null) return _fbAvailable;
    if (FIREBASE_DB_URL.includes("SEU-PROJETO")) {
      _fbAvailable = false;
      return false;
    }
    try {
      const res = await fetch(`${DB_PATH}/.json?shallow=true`, { signal: AbortSignal.timeout(4000) });
      _fbAvailable = res.ok;
    } catch {
      _fbAvailable = false;
    }
    return _fbAvailable;
  }

  /* ══ VISITA ══ */
  async function recordVisit() {
    const session = lsLoad(LS_KEYS.SESSION);
    const now_ms  = Date.now();
    if (session && now_ms - session.ts < 15 * 60 * 1000) return;
    lsSave(LS_KEYS.SESSION, { ts: now_ms, id: uid() });

    const visit = {
      id: uid(), date: today(), ts: now(),
      ua: navigator.userAgent.substring(0, 100),
      ref: document.referrer ? document.referrer.substring(0, 80) : "direto",
      screen: `${screen.width}x${screen.height}`,
    };

    if (await isFbAvailable()) {
      await fbPush(KEYS.VISITS, visit);
    } else {
      const visits = lsLoad(LS_KEYS.VISITS) || [];
      visits.push(visit);
      if (visits.length > 2000) visits.splice(0, visits.length - 2000);
      lsSave(LS_KEYS.VISITS, visits);
    }
  }

  /* ══ CLIQUE EM PRODUTO ══ */
  async function recordProductClick(productId, productName, action) {
    if (await isFbAvailable()) {
      const current = await fbGet(`${KEYS.CLICKS}/${productId}`) || { name: productName, view: 0, add: 0 };
      if (action === "view") current.view = (current.view || 0) + 1;
      if (action === "add")  current.add  = (current.add  || 0) + 1;
      current.name = productName;
      current.lastTs = now();
      await fbSet(`${KEYS.CLICKS}/${productId}`, current);
    } else {
      const clicks = lsLoad(LS_KEYS.CLICKS) || {};
      if (!clicks[productId]) clicks[productId] = { name: productName, view: 0, add: 0, ts: [] };
      if (action === "view") clicks[productId].view++;
      if (action === "add")  clicks[productId].add++;
      clicks[productId].ts = clicks[productId].ts || [];
      clicks[productId].ts.push({ action, ts: now() });
      if (clicks[productId].ts.length > 500) clicks[productId].ts.splice(0, clicks[productId].ts.length - 500);
      lsSave(LS_KEYS.CLICKS, clicks);
    }
  }

  /* ══ PEDIDO ══ */
  async function recordOrder(items, total) {
    const order = {
      id: uid(), ts: now(), date: today(), total,
      items: items.map(i => ({ id: i.product.id, name: i.product.name, qty: i.qty, price: i.product.price })),
    };
    if (await isFbAvailable()) {
      await fbPush(KEYS.ORDERS, order);
    } else {
      const orders = lsLoad(LS_KEYS.ORDERS) || [];
      orders.push(order);
      if (orders.length > 500) orders.splice(0, orders.length - 500);
      lsSave(LS_KEYS.ORDERS, orders);
    }
  }

  /* ══ CLIQUE WHATSAPP ══ */
  async function recordWAClick(source) {
    const entry = { ts: now(), date: today(), source: source || "geral" };
    if (await isFbAvailable()) {
      await fbPush(KEYS.WA_CLICKS, entry);
    } else {
      const wa = lsLoad(LS_KEYS.WA_CLICKS) || [];
      wa.push(entry);
      if (wa.length > 1000) wa.splice(0, wa.length - 1000);
      lsSave(LS_KEYS.WA_CLICKS, wa);
    }
  }

  /* ══ FEEDBACK ══ */
  async function recordFeedback(text, rating) {
    const entry = {
      id: uid(), ts: now(), date: today(),
      text: String(text).substring(0, 500),
      rating: Number(rating) || 0,
    };
    if (await isFbAvailable()) {
      await fbPush(KEYS.FEEDBACKS, entry);
    } else {
      const feedbacks = lsLoad(LS_KEYS.FEEDBACKS) || [];
      feedbacks.push(entry);
      lsSave(LS_KEYS.FEEDBACKS, feedbacks);
    }
    return true;
  }

  /* ══ getData — lê tudo (painel admin) ══ */
  async function getData() {
    if (!(await isFbAvailable())) {
      return {
        visits:    lsLoad(LS_KEYS.VISITS)    || [],
        clicks:    lsLoad(LS_KEYS.CLICKS)    || {},
        orders:    lsLoad(LS_KEYS.ORDERS)    || [],
        waClicks:  lsLoad(LS_KEYS.WA_CLICKS) || [],
        feedbacks: lsLoad(LS_KEYS.FEEDBACKS) || [],
      };
    }
    const [rawVisits, rawClicks, rawOrders, rawWA, rawFeedbacks] = await Promise.all([
      fbGet(KEYS.VISITS),
      fbGet(KEYS.CLICKS),
      fbGet(KEYS.ORDERS),
      fbGet(KEYS.WA_CLICKS),
      fbGet(KEYS.FEEDBACKS),
    ]);
    const toArray = (obj) => obj ? Object.values(obj) : [];
    return {
      visits:    toArray(rawVisits),
      clicks:    rawClicks || {},
      orders:    toArray(rawOrders),
      waClicks:  toArray(rawWA),
      feedbacks: toArray(rawFeedbacks),
    };
  }

  /* ══ clearAll (admin) ══ */
  async function clearAll() {
    if (await isFbAvailable()) {
      await Promise.all([
        fbSet(KEYS.VISITS, null),
        fbSet(KEYS.CLICKS, null),
        fbSet(KEYS.ORDERS, null),
        fbSet(KEYS.WA_CLICKS, null),
        fbSet(KEYS.FEEDBACKS, null),
      ]);
    }
    Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k));
  }

  /* ── API Pública ── */
  window.AurixAnalytics = {
    recordVisit,
    recordProductClick,
    recordOrder,
    recordWAClick,
    recordFeedback,
    getData,
    clearAll,
    isFbAvailable,
    // Helpers de acesso direto ao Firebase (usados pelo admin para status)
    fbGet,
    fbSet,
    DB_PATH,
  };

  // Registra visita automaticamente (exceto no admin)
  const isDocAdmin = window.location.pathname.toLowerCase().includes("admin");
  const isRefAdmin = document.referrer && document.referrer.toLowerCase().includes("admin");
  if (!isDocAdmin && !isRefAdmin) {
    recordVisit();
  }

})();
