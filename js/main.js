/* AffStore — JavaScript : produits, recherche avec suggestions, panier, effets */
const PRODUCTS = [
  {id:1,name:"Wireless Studio Headphones",cat:"Electronics",badge:"Audio",price:89.99,old:119.99,reviews:412,desc:"Active noise cancelling & 40h battery.",img:"headphones",feat:1,tags:"casque ecouteurs musique headphone",pills:["Active Noise Cancelling","30h Battery","Bluetooth 5.3","USB-C Fast Charge"]},
  {id:2,name:"Everyday Canvas Backpack",cat:"Fashion",badge:"Lifestyle",price:48,old:64,reviews:188,desc:"Heavy-duty waxed cotton & 16\" laptop sleeve.",img:"backpack",feat:1,tags:"sac a dos sac voyage bag",pills:["Waxed Cotton","16\" Laptop Sleeve","Water-resistant"]},
  {id:3,name:"Smart Aroma Diffuser",cat:"Home",badge:"Home",price:39.5,old:49,reviews:96,desc:"App control, ambient LED & auto shut-off.",img:"diffuser",feat:1,tags:"diffuseur parfum maison lampe",pills:["App Control","Ambient LED","Auto Shut-off"]},
  {id:4,name:"Waterproof Bluetooth Speaker",cat:"Electronics",badge:"Audio",price:54,old:69,reviews:529,desc:"IPX7 waterproof rating, 360-degree sound.",img:"speaker",tags:"enceinte haut-parleur musique speaker",pills:["IPX7 Waterproof","360° Sound","12h Battery"]},
  {id:5,name:"Relaxed Fit Denim Jacket",cat:"Fashion",badge:"Apparel",price:68,old:85,reviews:241,desc:"100% organic cotton, vintage wash.",img:"denim",tags:"veste jean vetement manteau",pills:["Organic Cotton","Vintage Wash","Relaxed Fit"]},
  {id:6,name:"Ergonomic Mechanical Keyboard",cat:"Electronics",badge:"Computing",price:95,old:120,reviews:604,desc:"Hot-swappable switches & wireless connection.",img:"keyboard",feat:1,tags:"clavier ordinateur pc gamer",pills:["Hot-swappable","Wireless","RGB Backlight"]},
  {id:7,name:"Stoneware Dinner Plates",cat:"Home",badge:"Dining",price:52,old:60,reviews:115,desc:"Set of 4 hand-finished glazed plates.",img:"plates",tags:"assiettes vaisselle cuisine table",pills:["Set of 4","Hand-finished","Dishwasher Safe"]},
  {id:8,name:"Polarized Classic Sunglasses",cat:"Fashion",badge:"Accessories",price:28,old:39,reviews:379,desc:"UV400 protection with reinforced hinge.",img:"sunglasses",tags:"lunettes de soleil soleil glasses",pills:["UV400","Polarized","Reinforced Hinge"]}
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => "$" + n.toFixed(2);
const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const byId = id => PRODUCTS.find(p => p.id == id);
const IMAGE_URLS = {
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  backpack: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
  diffuser: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85",
  speaker: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85",
  denim: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=85",
  keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85",
  plates: "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=900&q=85",
  sunglasses: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85"
};
const src = p => IMAGE_URLS[p.img] || IMAGE_URLS.headphones;
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

let cart = load("aff-cart", {});
let favs = load("aff-favs", []);
let state = {q: "", cat: "", sort: "featured", current: 1, qty: 1};

document.body.classList.add("js");

/* ---------- TOAST ---------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- CARTES PRODUITS ---------- */
const stars = '<div class="stars">★★★★★ <span class="reviews">(%)</span></div>';

const shopCard = p => `
  <article class="shop-product reveal">
    <div class="image-wrap">
      <span class="badge">${p.badge}</span>
      <button class="heart ${favs.includes(p.id) ? "on" : ""}" data-fav="${p.id}" aria-label="Favorite">${favs.includes(p.id) ? "♥" : "♡"}</button>
      <a href="#product" data-view="${p.id}"><img src="${src(p)}" alt="${p.name}" loading="lazy"></a>
    </div>
    ${stars.replace("%", p.reviews)}
    <h3>${p.name}</h3><p class="desc">${p.desc}</p>
    <div class="product-bottom"><span class="price">${money(p.price)}</span><span class="stock">In stock</span></div>
    <div class="card-btns">
      <a class="btn btn-secondary" href="#product" data-view="${p.id}">View</a>
      <button class="btn btn-primary" data-add="${p.id}">🛒 Add</button>
    </div>
  </article>`;

const miniCard = p => `
  <article class="product-card reveal">
    <a class="product-image" href="#product" data-view="${p.id}"><img src="${src(p)}" alt="${p.name}" loading="lazy"></a>
    <h3>${p.name}</h3><p class="meta">${p.desc}</p>
    <div class="price">${money(p.price)}</div>
    <button class="btn btn-primary btn-block" data-add="${p.id}">🛒 Add to cart</button>
  </article>`;

/* ---------- SHOP : filtre + tri ---------- */
function matches(p, q) {
  return norm(`${p.name} ${p.badge} ${p.cat} ${p.desc} ${p.tags}`).includes(norm(q.trim()));
}

function renderShop() {
  let list = PRODUCTS.filter(p => (!state.cat || p.cat === state.cat) && (!state.q || matches(p, state.q)));
  const sorts = {
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
    newest: (a, b) => b.id - a.id
  };
  if (sorts[state.sort]) list.sort(sorts[state.sort]);
  $("#shop-grid").innerHTML = list.map(shopCard).join("") ||
    `<p class="empty">No product found. Try another word.</p>`;
  const label = state.q ? ` for “${state.q}”` : state.cat ? ` in ${state.cat}` : "";
  $("#shop-count").innerHTML = `Showing ${list.length} product${list.length > 1 ? "s" : ""}${label}.` +
    (state.q || state.cat ? ` <button class="link-btn" data-reset>Show all</button>` : "");
  observeReveal();
}

/* ---------- PAGE PRODUIT ---------- */
const zooms = [["1", "50% 50%"], ["1.7", "15% 25%"], ["1.7", "85% 25%"], ["1.7", "50% 90%"]];

function showProduct(id) {
  const p = byId(id);
  state.current = p.id; state.qty = 1;
  $("#pd-crumb").textContent = `${p.cat} › ${p.badge} › ${p.name}`;
  const disc = Math.round((1 - p.price / p.old) * 100);
  $("#pd").innerHTML = `
    <div>
      <div class="gallery-main"><img id="main-img" src="${src(p)}" alt="${p.name}"></div>
      <div class="thumbs">${zooms.map((z, i) => `<button class="thumb ${i ? "" : "on"}" data-zoom="${i}"><img src="${src(p)}" alt="" style="transform:scale(${z[0]});transform-origin:${z[1]}"></button>`).join("")}</div>
    </div>
    <article class="detail-content">
      <span class="detail-label">AffStore · ${p.badge}</span>
      <h2>${p.name}</h2>
      <div class="stars">★★★★★ <strong>4.8</strong> <span class="reviews">(${p.reviews} verified reviews)</span></div>
      <div class="detail-price">${money(p.price)} <span class="old-price">${money(p.old)}</span> <span class="save">-${disc}%</span></div>
      <p class="description">${p.desc} Designed for everyday use and built to last.</p>
      <div class="feature-pills">${p.pills.map(x => `<span class="feature-pill">${x}</span>`).join("")}</div>
      <div class="buy-row">
        <div class="quantity"><button type="button" data-q="-1">−</button><span id="pd-qty">1</span><button type="button" data-q="1">+</button></div>
        <button class="btn btn-primary" data-add="${p.id}" data-qty>🛒 Add to cart</button>
      </div>
      <div class="detail-benefits">
        <div class="detail-benefit"><strong>🚚 Free delivery</strong><br>On orders over $50</div>
        <div class="detail-benefit"><strong>⚙ 30-day returns</strong><br>Full refund guaranteed</div>
      </div>
    </article>`;
  $("#similar-grid").innerHTML = PRODUCTS.filter(x => x.id !== p.id && x.cat === p.cat).concat(PRODUCTS.filter(x => x.cat !== p.cat)).slice(0, 4).map(miniCard).join("");
  observeReveal();
}

/* ---------- PANIER ---------- */
function addToCart(id, n = 1) {
  cart[id] = (cart[id] || 0) + n;
  save("aff-cart", cart);
  renderCart();
  toast(`✔ ${byId(id).name} added to cart`);
  const c = $(".cart-count");
  c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
}

function renderCart() {
  const items = Object.entries(cart).map(([id, q]) => ({p: byId(id), q})).filter(i => i.p);
  const n = items.reduce((s, i) => s + i.q, 0);
  const sub = items.reduce((s, i) => s + i.q * i.p.price, 0);
  const ship = sub === 0 || sub >= 50 ? 0 : 5.99;
  const tax = sub * 0.08;
  $(".cart-count").textContent = n;
  $("#cart-n").textContent = `(${n} item${n !== 1 ? "s" : ""})`;
  $("#ship-banner").innerHTML = sub >= 50
    ? "🚚 <strong>You qualify for FREE Express Delivery!</strong> <span>Orders over $50 ship free.</span>"
    : `🚚 <strong>Add ${money(50 - sub)} more</strong> <span>to get FREE delivery.</span><div class="bar"><i style="width:${Math.min(100, sub * 2)}%"></i></div>`;
  $("#cart-items").innerHTML = items.map(({p, q}) => `
    <article class="cart-item">
      <div class="cart-image"><img src="${src(p)}" alt="${p.name}"></div>
      <div>
        <h3>${p.name}</h3><p>${p.desc}</p><p class="in-stock">● In Stock</p>
        <div class="cart-actions">
          <div class="quantity"><button type="button" data-cq="${p.id}:-1">−</button><span>${q}</span><button type="button" data-cq="${p.id}:1">+</button></div>
          <button class="remove" type="button" data-rm="${p.id}">▣ Remove</button>
        </div>
      </div>
      <strong>${money(p.price * q)}</strong>
    </article>`).join("") ||
    `<div class="empty">Your cart is empty. <a href="#shop" class="link-btn">Start shopping →</a></div>`;
  $("#s-sub").textContent = money(sub);
  $("#s-ship").textContent = ship ? money(ship) : "Free";
  $("#s-tax").textContent = money(tax);
  $("#s-total").textContent = money(sub + ship + tax);
}

/* ---------- RECHERCHE AVEC SUGGESTIONS ---------- */
const input = $("#search-input"), box = $("#suggest");
let results = [], active = -1;

function suggest(q) {
  q = norm(q.trim());
  if (!q) return [];
  return PRODUCTS.map(p => {
    const n = norm(p.name), t = norm(`${p.badge} ${p.cat} ${p.tags}`);
    const s = n.startsWith(q) ? 4 : n.split(" ").some(w => w.startsWith(q)) ? 3
      : t.split(" ").some(w => w.startsWith(q)) ? 2 : norm(p.name + " " + p.desc).includes(q) ? 1 : 0;
    return {p, s};
  }).filter(x => x.s).sort((a, b) => b.s - a.s).slice(0, 6).map(x => x.p);
}

function highlight(name, q) {
  const i = norm(name).indexOf(norm(q.trim()));
  if (i < 0 || !q.trim()) return name;
  const l = q.trim().length;
  return `${name.slice(0, i)}<mark>${name.slice(i, i + l)}</mark>${name.slice(i + l)}`;
}

function renderSuggest() {
  const q = input.value;
  results = suggest(q); active = -1;
  if (!q.trim()) return closeSuggest();
  box.innerHTML = results.length
    ? results.map((p, i) => `<li role="option" data-i="${i}"><img src="${src(p)}" alt=""><span class="s-name">${highlight(p.name, q)}<small>${p.cat} · ${p.badge}</small></span><b>${money(p.price)}</b></li>`).join("")
      + `<li class="s-all" data-all>See all results for “${q.trim()}” →</li>`
    : `<li class="s-none">No product matches “${q.trim()}”</li>`;
  box.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function closeSuggest() { box.hidden = true; active = -1; input.setAttribute("aria-expanded", "false"); }

function chooseProduct(p) {
  input.value = p.name; closeSuggest(); input.blur();
  showProduct(p.id);
  location.hash = "#product";
}

function searchAll() {
  state.q = input.value; state.cat = "";
  closeSuggest(); renderShop();
  location.hash = "#shop";
}

input.addEventListener("input", renderSuggest);
input.addEventListener("focus", () => input.value && renderSuggest());
input.addEventListener("keydown", e => {
  const items = $$("li[data-i]", box);
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    if (!items.length) return;
    e.preventDefault();
    active = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items.forEach((li, i) => li.classList.toggle("active", i === active));
  } else if (e.key === "Escape") closeSuggest();
  else if (e.key === "Enter" && active >= 0) { e.preventDefault(); chooseProduct(results[active]); }
});
box.addEventListener("mousedown", e => {
  e.preventDefault(); // garde le focus dans l'input
  const li = e.target.closest("li");
  if (!li) return;
  if (li.dataset.i !== undefined) chooseProduct(results[li.dataset.i]);
  else if (li.hasAttribute("data-all")) searchAll();
});
$(".search-box").addEventListener("submit", e => { e.preventDefault(); searchAll(); });
document.addEventListener("click", e => { if (!e.target.closest(".search-box")) closeSuggest(); });

/* ---------- CLICS (délégation) ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-add],[data-view],[data-fav],[data-cat],[data-reset],[data-cq],[data-rm],[data-q],[data-zoom],#checkout");
  if (!t) return;
  const d = t.dataset;
  if (d.add) addToCart(+d.add, t.hasAttribute("data-qty") ? state.qty : 1);
  else if (d.view) showProduct(d.view);
  else if (d.fav) {
    const id = +d.fav;
    favs = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id];
    save("aff-favs", favs);
    t.classList.toggle("on"); t.textContent = favs.includes(id) ? "♥" : "♡";
  } else if (d.cat) { state.cat = d.cat; state.q = ""; input.value = ""; renderShop(); location.hash = "#shop"; }
  else if ("reset" in d) { state.q = state.cat = ""; input.value = ""; renderShop(); }
  else if (d.cq) {
    const [id, dl] = d.cq.split(":");
    cart[id] = Math.max(1, cart[id] + +dl); save("aff-cart", cart); renderCart();
  } else if (d.rm) { delete cart[d.rm]; save("aff-cart", cart); renderCart(); toast("Item removed"); }
  else if (d.q) { state.qty = Math.max(1, Math.min(10, state.qty + +d.q)); $("#pd-qty").textContent = state.qty; }
  else if (d.zoom) {
    $$(".thumb").forEach(b => b.classList.toggle("on", b === t));
    const z = zooms[d.zoom], im = $("#main-img");
    im.style.transformOrigin = z[1]; im.style.transform = `scale(${z[0]})`; im.dataset.base = z[0];
  } else if (t.id === "checkout") toast(Object.keys(cart).length ? "Demo store — checkout not connected 🙂" : "Your cart is empty");
});
$(".category-grid").addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.dataset.cat) e.target.click();
});

$("#sort").addEventListener("change", e => { state.sort = e.target.value; renderShop(); });

/* zoom au survol de l'image produit */
document.addEventListener("mousemove", e => {
  const g = e.target.closest(".gallery-main");
  if (!g) return;
  const im = $("#main-img"), r = g.getBoundingClientRect();
  im.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`;
  im.style.transform = "scale(1.6)";
});
document.addEventListener("mouseout", e => {
  if (e.target.closest(".gallery-main") && !e.relatedTarget?.closest(".gallery-main")) $("#main-img").style.transform = "scale(1)";
});

/* ---------- EFFETS : apparition au scroll, nav active, barre de progression ---------- */
let io;
function observeReveal() {
  io = io || new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), {threshold: .12});
  $$(".reveal:not(.in)").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
}

$$(".category-card,.benefit,.standard-card,.section-heading,.featured,.form-card,.channels-card,.about-visual,.about-intro,.cart-layout")
  .forEach(el => el.classList.add("reveal"));

const navMap = {home: "home", shop: "shop", product: "shop", about: "about", contact: "contact"};
const spy = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  const key = navMap[en.target.id];
  $$(".main-nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + key));
}), {rootMargin: "-40% 0px -55% 0px"});
$$(".page-section").forEach(s => spy.observe(s));

const bar = document.createElement("div");
bar.className = "progress";
document.body.append(bar);
addEventListener("scroll", () => {
  const h = document.documentElement;
  bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + "%";
  $(".site-header").classList.toggle("scrolled", h.scrollTop > 10);
}, {passive: true});

/* formulaire de contact */
$(".form-card").addEventListener("submit", e => {
  e.preventDefault(); e.target.reset(); toast("✔ Message sent — we'll reply soon!");
});

/* ---------- INIT ---------- */
$("#featured-grid").innerHTML = PRODUCTS.filter(p => p.feat).map(miniCard).join("");
renderShop(); showProduct(1); renderCart(); observeReveal();
