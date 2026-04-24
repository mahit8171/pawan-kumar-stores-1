/* ── Pawan Kumar Store — Frontend JS ─────────────────────────────────────── */
const API = '/api';
let currentPage = 1;
let currentCategory = 'All';
let currentSort = 'createdAt-desc';
let searchQuery = '';
let cart = JSON.parse(localStorage.getItem('pk_cart') || '[]');

// ── Helpers ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const fmt = n => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = msg;
  $('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function imgSrc(product) {
  if (product.imageUrl) return product.imageUrl;
  if (product.image) return product.image;
  return null;
}

// ── Header Scroll ─────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('header').classList.toggle('scrolled', window.scrollY > 50);
});

// ── Hamburger ─────────────────────────────────────────────────────────────────
$('hamburger').addEventListener('click', () => {
  document.getElementById('nav').classList.toggle('open');
});

// ── Search ────────────────────────────────────────────────────────────────────
let searchTimer;
$('searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = e.target.value.trim();
    currentPage = 1;
    loadProducts();
  }, 400);
});

// ── Sort ──────────────────────────────────────────────────────────────────────
$('sortSelect').addEventListener('change', e => {
  currentSort = e.target.value;
  currentPage = 1;
  loadProducts();
});

// ── Categories ────────────────────────────────────────────────────────────────
async function loadCategories() {
  try {
    const res = await fetch(`${API}/categories`);
    const { categories } = await res.json();
    const grid = $('categoriesGrid');
    grid.innerHTML = `<button class="cat-pill active" data-cat="All">All Products</button>`;
    categories.forEach(({ name, count }) => {
      const btn = document.createElement('button');
      btn.className = 'cat-pill';
      btn.dataset.cat = name;
      btn.textContent = `${name} (${count})`;
      grid.appendChild(btn);
    });
    grid.addEventListener('click', e => {
      const btn = e.target.closest('.cat-pill');
      if (!btn) return;
      grid.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat;
      currentPage = 1;
      loadProducts();
    });
  } catch (err) {
    console.error('Categories error:', err);
  }
}

// ── Products ──────────────────────────────────────────────────────────────────
async function loadProducts() {
  const grid = $('productsGrid');
  const loading = $('loadingWrap');
  const empty = $('emptyState');
  const pagination = $('pagination');

  grid.innerHTML = '';
  loading.style.display = 'flex';
  empty.style.display = 'none';
  pagination.innerHTML = '';

  const [sortField, sortOrder] = currentSort.split('-');

  const params = new URLSearchParams({
    page: currentPage,
    limit: 12,
    sort: sortField,
    order: sortOrder,
  });
  if (currentCategory !== 'All') params.set('category', currentCategory);
  if (searchQuery) params.set('search', searchQuery);

  try {
    const res = await fetch(`${API}/products?${params}`);
    const { products, pagination: pg } = await res.json();

    loading.style.display = 'none';

    if (!products || products.length === 0) {
      empty.style.display = 'block';
      $('statProducts').textContent = '0';
      return;
    }

    $('statProducts').textContent = pg.total;
    products.forEach((p, i) => {
      const card = createProductCard(p, i);
      grid.appendChild(card);
    });

    renderPagination(pg);
  } catch (err) {
    loading.style.display = 'none';
    empty.style.display = 'block';
    console.error('Products error:', err);
  }
}

function createProductCard(p, delay = 0) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.style.animationDelay = `${delay * 60}ms`;

  const src = imgSrc(p);
  const imgHTML = src
    ? `<img class="product-img" src="${src}" alt="${p.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=product-placeholder>🛍️</div>'">`
    : `<div class="product-placeholder">🛍️</div>`;

  const discount = p.discountPercent || (p.originalPrice && p.originalPrice > p.price
    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0);

  card.innerHTML = `
    <div class="product-img-wrap">
      ${imgHTML}
      ${p.featured ? '<span class="product-badge">Featured</span>' : ''}
      ${discount > 0 ? `<span class="product-badge product-badge--sale">-${discount}%</span>` : ''}
      <button class="btn btn--sm btn--outline product-quick" onclick="openModal('${p._id}');event.stopPropagation()">View</button>
    </div>
    <div class="product-body">
      <span class="product-cat">${p.category || 'General'}</span>
      <h3 class="product-name">${p.name}</h3>
      <p class="product-desc">${p.description}</p>
      <div class="product-footer">
        <div class="product-price">
          <span class="product-price-main">${fmt(p.price)}</span>
          ${p.originalPrice ? `<span class="product-price-old">${fmt(p.originalPrice)}</span>` : ''}
        </div>
        <button class="product-add" onclick="addToCart('${p._id}','${escHtml(p.name)}',${p.price},'${src||''}');event.stopPropagation()">Add</button>
      </div>
    </div>
  `;
  card.addEventListener('click', () => openModal(p._id));
  return card;
}

function escHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ── Pagination ────────────────────────────────────────────────────────────────
function renderPagination({ pages, page }) {
  if (pages <= 1) return;
  const container = $('pagination');
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement('button');
    btn.className = `page-btn${i === page ? ' active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => {
      currentPage = i;
      loadProducts();
      document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    });
    container.appendChild(btn);
  }
}

// ── Product Modal ─────────────────────────────────────────────────────────────
async function openModal(id) {
  const overlay = $('productModal');
  overlay.classList.add('open');
  $('modalBody').innerHTML = `<div style="padding:60px;display:flex;align-items:center;justify-content:center;width:100%;grid-column:1/-1"><div class="spinner"></div></div>`;

  try {
    const res = await fetch(`${API}/products/${id}`);
    const { product: p } = await res.json();
    const src = imgSrc(p);

    $('modalBody').innerHTML = `
      <div class="modal-img">
        ${src
          ? `<img src="${src}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">`
          : `<div class="product-placeholder" style="height:100%;font-size:5rem">🛍️</div>`}
      </div>
      <div class="modal-info">
        <span class="modal-cat">${p.category || 'General'}</span>
        <h2 class="modal-title">${p.name}</h2>
        <div class="modal-price">${fmt(p.price)}${p.originalPrice ? ` <span style="font-size:1rem;color:var(--text-dim);text-decoration:line-through;margin-left:8px">${fmt(p.originalPrice)}</span>` : ''}</div>
        <p class="modal-desc">${p.description}</p>
        ${p.stock > 0 ? `<p class="modal-stock">✓ In Stock (${p.stock} available)</p>` : '<p style="color:#f87171;font-size:.8rem">Out of Stock</p>'}
        ${p.tags?.length ? `<p style="font-size:.75rem;color:var(--text-dim);margin-bottom:16px">${p.tags.map(t=>`<span style="background:var(--bg-3);padding:3px 8px;border-radius:4px;margin-right:4px">${t}</span>`).join('')}</p>` : ''}
        <div class="modal-actions">
          <button class="btn btn--primary" onclick="addToCart('${p._id}','${escHtml(p.name)}',${p.price},'${src||''}')">Add to Cart</button>
          <button class="btn btn--ghost" onclick="closeModal()">Close</button>
        </div>
      </div>
    `;
  } catch {
    $('modalBody').innerHTML = `<div style="padding:40px;grid-column:1/-1;text-align:center;color:var(--text-muted)">Failed to load product.</div>`;
  }
}

function closeModal() {
  $('productModal').classList.remove('open');
}
$('productModal').addEventListener('click', e => { if (e.target === $('productModal')) closeModal(); });
$('modalClose').addEventListener('click', closeModal);

// ── Cart ──────────────────────────────────────────────────────────────────────
function addToCart(id, name, price, image) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, image, qty: 1 });
  }
  saveCart();
  toast(`"${name}" added to cart ✓`);
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem('pk_cart', JSON.stringify(cart));
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const countEl = $('cartCount');
  countEl.textContent = total;
  countEl.classList.toggle('visible', total > 0);
}

function renderCart() {
  const itemsEl = $('cartItems');
  if (cart.length === 0) {
    itemsEl.innerHTML = `<div class="cart-empty"><div style="font-size:2rem;margin-bottom:8px">🛒</div><p>Your cart is empty</p></div>`;
    $('cartTotal').textContent = '₹0';
    return;
  }
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      ${item.image ? `<img class="cart-item-img" src="${item.image}" alt="${item.name}">` : `<div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem">🛍️</div>`}
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${fmt(item.price)} × ${item.qty}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
    </div>
  `).join('');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  $('cartTotal').textContent = fmt(total);
}

$('cartBtn').addEventListener('click', () => {
  renderCart();
  $('cartDrawer').classList.add('open');
  $('cartOverlay').classList.add('open');
});
$('cartClose').addEventListener('click', closeCart);
$('cartOverlay').addEventListener('click', closeCart);
function closeCart() {
  $('cartDrawer').classList.remove('open');
  $('cartOverlay').classList.remove('open');
}

// ── Stats Counter ─────────────────────────────────────────────────────────────
function animateCount(el, target) {
  let start = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = start;
    if (start >= target) clearInterval(timer);
  }, 30);
}

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  saveCart();
  await Promise.all([loadCategories(), loadProducts()]);
})();
