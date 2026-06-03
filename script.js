// ============================================
//  EDITE AQUI — Configurações da lanchonete
// ============================================
const OWNER_WHATSAPP_NUMBER = "5568992526571"; // DDI + DDD + número

const RESTAURANT = {
  name: "Hamburgueria Seu Auri",
  hours: "Ter–Dom · 18h às 23h30",
};

const STORE_ADDRESS = "Próximo ao Senac, Brasiléia - AC";
const STORE_MAPS_URL = "https://www.google.com/maps?q=Brasileia,AC";

const DELIVERY_FEES = { retirada: 0, Brasileia: 5, "Epitaciolândia": 7 };

const PRODUCTS = [
  { id: "classico", name: "Clássico da Casa", description: "Pão, alface, tomate, carne, queijo, calabresa e batata palha.", price: 13, image: "img/classico.png", category: "burger", tag: "Top vendido" },
  { id: "turbinado", name: "Turbinado", description: "Pão, alface, tomate, carne, queijo, presunto, calabresa, bacon e batata palha.", price: 18, image: "img/turbinado.png", category: "burger" },
  { id: "duplo", name: "Duplo Supremo", description: "Pão, alface, tomate, 2 carnes, 2 queijos, 2 presuntos, 2 bacons e batata palha.", price: 23, image: "img/duplo.png", category: "burger", tag: "Pra fome grande" },
];

const fmt = (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ============================================
//  Segurança — sanitiza HTML antes de inserir
// ============================================
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================
//  Canvas de brasas animadas (background)
// ============================================
function initFireParticles() {
  const canvas = document.createElement("canvas");
  canvas.id = "fire-canvas";
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize);
  const COLORS = [[255,80,20],[255,45,10],[255,140,30],[255,200,50],[200,40,10]];
  class Ember {
    constructor(scatter) { this.reset(scatter); }
    reset(scatter) {
      this.x = Math.random() * W;
      this.y = scatter ? Math.random() * H : H + 10 + Math.random() * 40;
      this.r = Math.random() * 2.2 + 0.6;
      this.vy = -(Math.random() * 1.1 + 0.4);
      this.vx = (Math.random() - 0.5) * 0.5;
      this.life = Math.random() * 0.6 + 0.4;
      this.decay = Math.random() * 0.0025 + 0.0008;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = Math.random() * 0.04 + 0.01;
    }
    update() {
      this.wobble += this.wobbleSpeed;
      this.x += this.vx + Math.sin(this.wobble) * 0.3;
      this.y += this.vy;
      this.life -= this.decay;
      if (this.life <= 0 || this.y < -20 || this.x < -20 || this.x > W + 20) this.reset(false);
    }
    draw() {
      const alpha = Math.max(0, this.life) * 0.55;
      const [r, g, b] = this.color;
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 2.5);
      grd.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      grd.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.4})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
  }
  const COUNT = window.innerWidth < 600 ? 55 : 100;
  const embers = Array.from({ length: COUNT }, (_, i) => new Ember(true));
  let rafId;
  function animate() {
    ctx.clearRect(0, 0, W, H);
    embers.forEach(e => { e.update(); e.draw(); });
    rafId = requestAnimationFrame(animate);
  }
  animate();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(rafId); else animate();
  });
}

// ============================================
//  Estado do pedido
// ============================================
const PAY_LABEL = { pix: "Pix", credito: "Cartão de crédito", debito: "Cartão de débito", dinheiro: "Dinheiro em mão" };

let state = {
  items: [], step: 1, orderType: null,
  customer: { name: "", notes: "", street: "", number: "", neighborhood: "", complement: "", reference: "", coords: null },
  payment: null, change: "",
};

const subtotal = () => state.items.reduce((s, i) => s + i.qty * i.product.price, 0);
const fee = () => DELIVERY_FEES[state.orderType] || 0;
const total = () => subtotal() + fee();
const count = () => state.items.reduce((s, i) => s + i.qty, 0);

function addItem(product) {
  const found = state.items.find(i => i.product.id === product.id);
  if (found) found.qty++;
  else state.items.push({ product, qty: 1 });
  // Registra clique/adição no analytics
  if (window.AurixAnalytics) AurixAnalytics.recordProductClick(product.id, product.name, "add");
}

function setQty(id, qty) {
  if (qty <= 0) state.items = state.items.filter(i => i.product.id !== id);
  else { const f = state.items.find(i => i.product.id === id); if (f) f.qty = qty; }
}

function resetOrder() {
  state.items = [];
  state.orderType = null;
  state.customer = { name: "", notes: "", street: "", number: "", neighborhood: "", complement: "", reference: "", coords: null };
  state.payment = null;
  state.change = "";
}

// ============================================
//  Navegação
// ============================================
function goTo(n) {
  state.step = n;
  document.querySelectorAll(".step").forEach(el => el.classList.remove("active"));
  const target = document.getElementById(`step-${n}`);
  target.classList.add("active");
  document.querySelectorAll(".s-item").forEach(el => {
    const num = Number(el.dataset.step);
    el.classList.remove("active", "done");
    if (num === n) el.classList.add("active");
    else if (num < n) el.classList.add("done");
  });
  document.querySelectorAll(".s-line").forEach(el => {
    const after = Number(el.dataset.after);
    el.classList.toggle("done", after < n);
  });
  // Mostra botão Recomeçar apenas após etapa 1
  const btnR = document.getElementById("btn-restart");
  if (btnR) btnR.classList.toggle("hidden", n === 1);
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (n === 5) renderReview();
}

// ============================================
//  Render de produtos
// ============================================
function renderGrids() {
  renderGrid("grid-burgers", PRODUCTS.filter(p => p.category === "burger"));
}

function renderGrid(id, products) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = products.map(p => {
    const inCart = state.items.find(i => i.product.id === p.id);
    const qty = inCart ? inCart.qty : 0;
    const badge = p.tag ? `<span class="prod-badge">${escapeHtml(p.tag)}</span>` : "";
    const incart = qty > 0 ? `<span class="prod-incart">✓ ${qty} no carrinho</span>` : "";
    const ctrl = qty > 0
      ? `<div class="qty-ctrl">
           <button class="qty-btn" data-id="${p.id}" data-action="dec">−</button>
           <span class="qty-num">${qty}</span>
           <button class="qty-btn" data-id="${p.id}" data-action="inc">+</button>
         </div>`
      : `<button class="btn-hero full" data-id="${p.id}" data-action="add">Adicionar +</button>`;
    return `
      <div class="prod-card" data-id="${escapeHtml(p.id)}">
        <div class="prod-img-wrap">
          <img class="prod-img" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" />
          ${badge}${incart}
        </div>
        <div class="prod-body">
          <div class="prod-name">${escapeHtml(p.name)}</div>
          <div class="prod-desc">${escapeHtml(p.description)}</div>
          <div class="prod-price">${fmt(p.price)}</div>
          ${ctrl}
        </div>
      </div>`;
  }).join("");

  // Listeners nos botões do grid
  el.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id2 = btn.dataset.id;
      const action = btn.dataset.action;
      const product = PRODUCTS.find(p => p.id === id2);
      if (!product) return;
      if (action === "add") { addItem(product); }
      else if (action === "inc") { addItem(product); }
      else if (action === "dec") { const cur = state.items.find(i => i.product.id === id2); setQty(id2, cur ? cur.qty - 1 : 0); }
      renderGrids();
      updateBottomBar();
    });
  });

  // Registra visualização de produto
  if (window.AurixAnalytics) {
    products.forEach(p => AurixAnalytics.recordProductClick(p.id, p.name, "view"));
  }
}

// ============================================
//  Bottom bar (carrinho)
// ============================================
function updateBottomBar() {
  const c = count(), t = total();
  const countEl = document.getElementById("bb-count");
  const totalEl = document.getElementById("bb-total");
  const btn = document.getElementById("btn-continue-1");
  if (countEl) countEl.textContent = c > 0 ? `${c} item${c > 1 ? "s" : ""} no carrinho` : "Carrinho vazio";
  if (totalEl) totalEl.textContent = fmt(t);
  if (btn) btn.disabled = c === 0;
}

// ============================================
//  Revisão do pedido
// ============================================
function renderReview() {
  const sub = subtotal(), f = fee(), tot = total();
  const orderLabel = state.orderType === "retirada" ? "Retirada no local" : `Entrega — ${state.orderType}`;
  const burgers = state.items.filter(i => i.product.category === "burger");
  const itemRows = (arr) => arr.map(i =>
    `<div class="rev-item">
      <span class="rev-item-name"><strong>${i.qty}×</strong> ${escapeHtml(i.product.name)}</span>
      <span class="rev-item-price">${fmt(i.qty * i.product.price)}</span>
    </div>`
  ).join("");
  const safeCustomer = {
    name: escapeHtml(state.customer.name), notes: escapeHtml(state.customer.notes),
    street: escapeHtml(state.customer.street), number: escapeHtml(state.customer.number),
    neighborhood: escapeHtml(state.customer.neighborhood), complement: escapeHtml(state.customer.complement),
    reference: escapeHtml(state.customer.reference), change: escapeHtml(state.change),
  };
  let addrHtml = `<div class="rev-row"><span>Local</span><span>${escapeHtml(STORE_ADDRESS)}</span></div>`;
  if (state.orderType !== "retirada") {
    if (state.customer.coords) {
      const mapsLink = `https://www.google.com/maps?q=${state.customer.coords.lat},${state.customer.coords.lng}`;
      addrHtml = `<div class="rev-row"><span>Localização GPS</span><span><a href="${mapsLink}" target="_blank" style="color:var(--orange)">Ver no mapa</a></span></div>`;
    } else {
      addrHtml = `
        <div class="rev-row"><span>Rua</span><span>${safeCustomer.street}, nº ${safeCustomer.number}</span></div>
        <div class="rev-row"><span>Bairro</span><span>${safeCustomer.neighborhood}</span></div>
        ${safeCustomer.complement ? `<div class="rev-row"><span>Complemento</span><span>${safeCustomer.complement}</span></div>` : ""}
        ${safeCustomer.reference ? `<div class="rev-row"><span>Referência</span><span>${safeCustomer.reference}</span></div>` : ""}`;
    }
  }
  document.getElementById("review-card").innerHTML = `
    <div class="rev-card">
      <h3 class="rev-card-title">Cliente</h3>
      <div class="rev-row"><span>Nome</span><span>${safeCustomer.name}</span></div>
      <div class="rev-row"><span>Tipo de pedido</span><span>${escapeHtml(orderLabel)}</span></div>
      ${safeCustomer.notes ? `<div class="rev-row"><span>Observação</span><span>${safeCustomer.notes}</span></div>` : ""}
    </div>
    <div class="rev-card">
      <h3 class="rev-card-title">Itens</h3>
      ${burgers.length ? `<div class="rev-items">${itemRows(burgers)}</div>` : ""}
    </div>
    <div class="rev-card">
      <h3 class="rev-card-title">${state.orderType === "retirada" ? "Retirada no local" : "Endereço de entrega"}</h3>
      ${addrHtml}
    </div>
    <div class="rev-card">
      <h3 class="rev-card-title">Pagamento</h3>
      <div class="rev-row"><span>Forma</span><span>${escapeHtml(PAY_LABEL[state.payment] || "—")}</span></div>
      ${state.payment === "dinheiro" && safeCustomer.change ? `<div class="rev-row"><span>Troco para</span><span>${safeCustomer.change}</span></div>` : ""}
    </div>
    <div class="rev-card">
      <h3 class="rev-card-title">Total</h3>
      <div class="rev-row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
      <div class="rev-row"><span>Taxa de entrega</span><span>${fmt(f)}</span></div>
      <div class="rev-total">
        <span class="rev-total-label">Total</span>
        <span class="rev-total-val">${fmt(tot)}</span>
      </div>
    </div>`;
}

// ============================================
//  WhatsApp
// ============================================
function buildMessage() {
  const sub = subtotal(), f = fee(), tot = total();
  const obs = state.customer.notes.trim() || "Nenhuma";
  const troco = state.payment === "dinheiro" && state.change.trim() ? `\n💵 *Troco para:* ${state.change.trim()}` : "";
  const items = state.items.map(i => `• ${i.qty}x ${i.product.name} — ${fmt(i.product.price)}`).join("\n");
  if (state.orderType === "retirada") {
    return `🍔 *NOVO PEDIDO — RETIRADA NO LOCAL*\n\n👤 *Cliente:* ${state.customer.name}\n\n🛒 *Itens do pedido:*\n${items}\n\n💰 *Subtotal:* ${fmt(sub)}\n✅ *Total:* ${fmt(tot)}\n\n💳 *Forma de pagamento:* ${PAY_LABEL[state.payment]}${troco}\n\n📝 *Observação:* ${obs}\n\n📍 *Tipo de pedido:* Retirada no local\n📌 *Endereço:* ${STORE_ADDRESS}`;
  } else if (state.customer.coords) {
    const mapsLink = `https://www.google.com/maps?q=${state.customer.coords.lat},${state.customer.coords.lng}`;
    return `🍔 *NOVO PEDIDO — ENTREGA COM GPS*\n\n👤 *Cliente:* ${state.customer.name}\n\n🛒 *Pedido:*\n${items}\n\n🏙️ Cidade: ${state.orderType}\n\n📍 Localização GPS do cliente: ${mapsLink}\n\n💰 Subtotal: ${fmt(sub)}\n🚚 Taxa de entrega: ${fmt(f)}\n✅ *Total: ${fmt(tot)}*\n\n💳 Forma de pagamento: ${PAY_LABEL[state.payment]}${troco}\n\n📝 Observação: ${obs}`;
  } else {
    return `🍔 *NOVO PEDIDO — ENTREGA*\n\n👤 *Cliente:* ${state.customer.name}\n\n🛒 *Pedido:*\n${items}\n\n🏙️ Cidade: ${state.orderType}\n\n📍 *Endereço:*\n   Rua: ${state.customer.street}, nº ${state.customer.number}\n   Bairro: ${state.customer.neighborhood}\n   Complemento: ${state.customer.complement || "—"}\n   Ponto de referência: ${state.customer.reference || "—"}\n\n💰 Subtotal: ${fmt(sub)}\n🚚 Taxa de entrega: ${fmt(f)}\n✅ *Total: ${fmt(tot)}*\n\n💳 Forma de pagamento: ${PAY_LABEL[state.payment]}${troco}\n\n📝 Observação: ${obs}`;
  }
}

// ============================================
//  Vídeo Hero — força reprodução em mobile
// ============================================
function initHeroVideo() {
  const video = document.getElementById("hero-video");
  if (!video) return;
  // Força atributos críticos para autoplay em iOS/Android
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");
  video.muted = true;
  video.setAttribute("autoplay", "");
  video.setAttribute("loop", "");
  // Tenta reproduzir programaticamente (necessário em alguns browsers)
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Silencia erro de política de autoplay — o poster já cobre
    });
  }
  // Retenta ao interação do usuário (Safari iOS strict)
  document.addEventListener("touchstart", function tryPlay() {
    video.play().catch(() => {});
    document.removeEventListener("touchstart", tryPlay);
  }, { once: true, passive: true });
}

// ============================================
//  Feedback
// ============================================
function initFeedback() {
  let selectedRating = 0;
  const stars = document.querySelectorAll(".star");
  const labelEl = document.getElementById("star-label");
  const textArea = document.getElementById("feedback-text");
  const charEl = document.getElementById("feedback-char");
  const sendBtn = document.getElementById("btn-feedback-send");
  const successEl = document.getElementById("feedback-success");

  const STAR_LABELS = ["", "Ruim 😞", "Regular 😐", "Bom 🙂", "Ótimo 😄", "Excelente! 🔥"];

  stars.forEach(star => {
    star.addEventListener("mouseenter", () => {
      const n = Number(star.dataset.star);
      stars.forEach((s, idx) => s.classList.toggle("hovered", idx < n));
    });
    star.addEventListener("mouseleave", () => {
      stars.forEach(s => s.classList.remove("hovered"));
    });
    star.addEventListener("click", () => {
      selectedRating = Number(star.dataset.star);
      stars.forEach((s, idx) => s.classList.toggle("active", idx < selectedRating));
      if (labelEl) labelEl.textContent = STAR_LABELS[selectedRating];
    });
  });

  if (textArea && charEl) {
    textArea.addEventListener("input", () => {
      charEl.textContent = `${textArea.value.length} / 500`;
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      const text = textArea ? textArea.value.trim() : "";
      if (!text && selectedRating === 0) {
        alert("Por favor, dê uma avaliação com estrelas ou escreva um comentário.");
        return;
      }
      if (window.AurixAnalytics) {
        AurixAnalytics.recordFeedback(text, selectedRating);
      }
      // Exibe sucesso
      sendBtn.closest(".feedback-form").classList.add("hidden");
      document.getElementById("star-rating").classList.add("hidden");
      if (labelEl) labelEl.classList.add("hidden");
      if (successEl) successEl.classList.remove("hidden");
    });
  }
}

// ============================================
//  Inicialização
// ============================================
// ============================================
//  Firebase DB URL — deve ser igual ao analytics.js
// ============================================
const FIREBASE_DB_URL_MAIN = "https://hamburgueriaseuauri-default-rtdb.firebaseio.com";

// ============================================
//  Verificação de status do site (Firebase)
//  Bloqueia o site em todos os dispositivos
//  quando o admin aciona o bloqueio manual
// ============================================
const OPEN_HOUR_MAIN  = 18;
const CLOSE_HOUR_MAIN = 22;

function getNowAcre() {
  try {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Rio_Branco",
      hour12: false,
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
      weekday: "short"
    });
    const parts = formatter.formatToParts(d);
    const getPart = type => parts.find(p => p.type === type).value;
    const daysMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      hours: parseInt(getPart("hour"), 10),
      minutes: parseInt(getPart("minute"), 10),
      seconds: parseInt(getPart("second"), 10),
      day: daysMap[getPart("weekday")]
    };
  } catch (e) {
    const d = new Date();
    return {
      hours: d.getHours(),
      minutes: d.getMinutes(),
      seconds: d.getSeconds(),
      day: d.getDay()
    };
  }
}

async function checkAndApplySiteStatus() {
  // 1. Horário automático (Acre UTC-5)
  const acre = getNowAcre();
  const day = acre.day;
  const h = acre.hours;
  const totalMin = h * 60 + acre.minutes;
  const isWeekend      = (day === 0 || day === 6);
  const isOutsideHours = (totalMin < OPEN_HOUR_MAIN * 60 || totalMin >= CLOSE_HOUR_MAIN * 60);

  // 2. Bloqueio manual do Firebase
  let isManual = false;
  let manualMsg = '';
  try {
    if (!FIREBASE_DB_URL_MAIN.includes("SEU-PROJETO")) {
      const res = await fetch(`${FIREBASE_DB_URL_MAIN}/site_status.json`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const status = await res.json();
        if (status && status.locked === true) {
          isManual  = true;
          manualMsg = status.message || 'No momento não estamos aceitando pedidos. Pedimos desculpas!';
        }
      }
    }
  } catch(e) {
    // Falhou a verificar Firebase — fallback localStorage
    try {
      const ls = JSON.parse(localStorage.getItem("aurix_site_status") || "null");
      if (ls && ls.locked === true) { isManual = true; manualMsg = ls.message || ''; }
    } catch(e2) {}
  }

  // 3. Salva no localStorage para sincronizar com o script inline
  const statusObj = { locked: isManual, message: manualMsg };
  localStorage.setItem("aurix_site_status", JSON.stringify(statusObj));
  return !isManual && !isWeekend && !isOutsideHours;
}

document.addEventListener("DOMContentLoaded", async () => {
  // Sincroniza status inicial com Firebase
  await checkAndApplySiteStatus();

  initFireParticles();
  initHeroVideo();
  initFeedback();
  renderGrids();
  updateBottomBar();

  document.getElementById("btn-logo").addEventListener("click", () => {
    resetOrder(); renderGrids(); updateBottomBar(); goTo(1);
  });
  document.getElementById("btn-restart").addEventListener("click", () => {
    if (confirm("Recomeçar o pedido?")) { resetOrder(); renderGrids(); updateBottomBar(); goTo(1); }
  });
  document.getElementById("btn-continue-1").addEventListener("click", () => {
    if (state.items.length === 0) { alert("Adicione pelo menos 1 item ao carrinho 🍔"); return; }
    goTo(2);
  });

  document.querySelectorAll(".s-bubble[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.goto);
      if (n <= state.step) goTo(n);
    });
  });
  document.querySelectorAll("[data-goto]").forEach(btn => {
    if (!btn.classList.contains("s-bubble")) {
      btn.addEventListener("click", () => goTo(Number(btn.dataset.goto)));
    }
  });

  // Entrega
  document.querySelectorAll(".opt-row").forEach(row => {
    row.addEventListener("click", () => {
      document.querySelectorAll(".opt-row").forEach(r => r.classList.remove("selected"));
      row.classList.add("selected");
      state.orderType = row.dataset.type;
      document.getElementById("btn-next-2").disabled = false;
    });
  });
  document.getElementById("btn-next-2").addEventListener("click", () => {
    if (!state.orderType) { alert("Escolha como você quer receber seu pedido."); return; }
    const isPickup = state.orderType === "retirada";
    document.getElementById("addr-block").classList.toggle("hidden", isPickup);
    document.getElementById("pickup-card").classList.toggle("hidden", !isPickup);
    goTo(3);
  });

  // Dados
  const form = document.getElementById("customer-form");
  form.addEventListener("input", e => {
    const t = e.target;
    if (t.name === "name") state.customer.name = t.value;
    if (t.name === "notes") state.customer.notes = t.value;
    if (t.name === "street") state.customer.street = t.value;
    if (t.name === "number") state.customer.number = t.value;
    if (t.name === "neighborhood") state.customer.neighborhood = t.value;
    if (t.name === "complement") state.customer.complement = t.value;
    if (t.name === "reference") state.customer.reference = t.value;
  });
  document.getElementById("btn-next-3").addEventListener("click", () => {
    const err = document.getElementById("form-error");
    err.textContent = "";
    if (!state.customer.name.trim()) { err.textContent = "Informe seu nome para o vendedor identificar o pedido."; return; }
    if (state.orderType !== "retirada") {
      const { street, number, neighborhood } = state.customer;
      const hasManual = street.trim() && number.trim() && neighborhood.trim();
      if (!hasManual && !state.customer.coords) { err.textContent = "Preencha o endereço completo OU envie sua localização por GPS."; return; }
    }
    goTo(4);
  });

  // Pagamento
  document.querySelectorAll(".pay-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pay-opt").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.payment = btn.dataset.pay;
      document.getElementById("btn-next-4").disabled = false;
      document.getElementById("pay-note-pix").classList.toggle("hidden", state.payment !== "pix");
      document.getElementById("pay-note-card").classList.toggle("hidden", state.payment !== "credito" && state.payment !== "debito");
      document.getElementById("troco-block").classList.toggle("hidden", state.payment !== "dinheiro");
    });
  });
  document.getElementById("troco-input").addEventListener("input", e => { state.change = e.target.value; });
  document.getElementById("btn-next-4").addEventListener("click", () => {
    if (!state.payment) { alert("Escolha a forma de pagamento."); return; }
    goTo(5);
  });

  // Envio WhatsApp
  document.getElementById("btn-send").addEventListener("click", () => {
    if (!state.orderType || !state.payment) { alert("Faltam informações no pedido."); return; }
    // Registra pedido e clique WA no analytics
    if (window.AurixAnalytics) {
      AurixAnalytics.recordOrder(state.items, total());
      AurixAnalytics.recordWAClick("btn-enviar-pedido");
    }
    const url = `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage())}`;
    window.open(url, "_blank");
    setTimeout(() => { resetOrder(); renderGrids(); updateBottomBar(); goTo(1); }, 800);
  });

  goTo(1);
});
