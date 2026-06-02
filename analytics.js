/**
 * ============================================================
 *  ANALYTICS ENGINE — Hamburgueria Seu Auri
 *  Armazena dados localmente via localStorage (sem servidor)
 *  Versão: 2.0 | Seguro, leve, privacy-first
 * ============================================================
 */

(function () {
  "use strict";

  const KEYS = {
    VISITS: "aurix_visits",
    CLICKS: "aurix_product_clicks",
    ORDERS: "aurix_orders",
    WA_CLICKS: "aurix_wa_clicks",
    FEEDBACKS: "aurix_feedbacks",
    SESSION: "aurix_session",
  };

  /* ── Helpers ── */
  function now() { return new Date().toISOString(); }
  function today() { return new Date().toLocaleDateString("pt-BR"); }
  function load(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } }
  function save(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.warn("Analytics storage:", e); } }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

  /* ── Visita ── */
  function recordVisit() {
    // Verifica sessão ativa (15 min)
    const session = load(KEYS.SESSION);
    const now_ms = Date.now();
    if (session && now_ms - session.ts < 15 * 60 * 1000) return; // mesma sessão
    save(KEYS.SESSION, { ts: now_ms, id: uid() });

    const visits = load(KEYS.VISITS) || [];
    visits.push({
      id: uid(),
      date: today(),
      ts: now(),
      ua: navigator.userAgent.substring(0, 100),
      ref: document.referrer ? document.referrer.substring(0, 80) : "direto",
      screen: `${screen.width}x${screen.height}`,
    });
    // Mantém no máximo 2000 registros
    if (visits.length > 2000) visits.splice(0, visits.length - 2000);
    save(KEYS.VISITS, visits);
  }

  /* ── Clique em produto ── */
  function recordProductClick(productId, productName, action) {
    const clicks = load(KEYS.CLICKS) || {};
    if (!clicks[productId]) clicks[productId] = { name: productName, view: 0, add: 0, ts: [] };
    if (action === "view") clicks[productId].view++;
    if (action === "add") clicks[productId].add++;
    clicks[productId].ts.push({ action, ts: now() });
    if (clicks[productId].ts.length > 500) clicks[productId].ts.splice(0, clicks[productId].ts.length - 500);
    save(KEYS.CLICKS, clicks);
  }

  /* ── Pedido via WhatsApp ── */
  function recordOrder(items, total) {
    const orders = load(KEYS.ORDERS) || [];
    orders.push({
      id: uid(),
      ts: now(),
      date: today(),
      total,
      items: items.map(i => ({ id: i.product.id, name: i.product.name, qty: i.qty, price: i.product.price })),
    });
    if (orders.length > 500) orders.splice(0, orders.length - 500);
    save(KEYS.ORDERS, orders);
  }

  /* ── Clique WhatsApp (intenção) ── */
  function recordWAClick(source) {
    const wa = load(KEYS.WA_CLICKS) || [];
    wa.push({ ts: now(), date: today(), source: source || "geral" });
    if (wa.length > 1000) wa.splice(0, wa.length - 1000);
    save(KEYS.WA_CLICKS, wa);
  }

  /* ── Feedback ── */
  function recordFeedback(text, rating) {
    const feedbacks = load(KEYS.FEEDBACKS) || [];
    feedbacks.push({
      id: uid(),
      ts: now(),
      date: today(),
      text: String(text).substring(0, 500),
      rating: Number(rating) || 0,
    });
    save(KEYS.FEEDBACKS, feedbacks);
    return true;
  }

  /* ── API Pública ── */
  window.AurixAnalytics = {
    recordVisit,
    recordProductClick,
    recordOrder,
    recordWAClick,
    recordFeedback,
    // Para uso do painel
    getData() {
      return {
        visits: load(KEYS.VISITS) || [],
        clicks: load(KEYS.CLICKS) || {},
        orders: load(KEYS.ORDERS) || [],
        waClicks: load(KEYS.WA_CLICKS) || [],
        feedbacks: load(KEYS.FEEDBACKS) || [],
      };
    },
    clearAll() {
      Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    }
  };

  // Registra visita automaticamente
  recordVisit();

})();
