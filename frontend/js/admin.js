/* ── Pawan Kumar Store — Admin JS ─────────────────────────────────────────── */
const API = '/api';
let token = localStorage.getItem('pk_admin_token');
let adminUser = null;
let adminPage = 1;
let editMode = false;
let confirmCallback = null;

const $ = id => document.getElementById(id);
const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

// ── Toast ──────────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = msg;
  $('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Auth ───────────────────────────────────────────────────────────────────────
async function checkAuth() {
  if (!token) { showLogin(); return; }
  try {
    const res = await fetch(`${API}/auth/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const { admin } = await res.json();
      adminUser = admin;
      showDashboard();
    } else {
      localStorage.removeItem('pk_admin_token');
      showLogin();
    }
  } catch {
    showLogin();
  }
}

function showLogin() {
  $('loginPage').style.display = 'flex';
  $('adminLayout').style.display = 'none';
}

function showDashboard() {
  $('loginPage').style.display = 'none';
  $('adminLayout').style.display = 'flex';
  if (adminUser) {
    $('adminName').textContent = adminUser.username;
    $('adminInfo').querySelector('.admin-avatar').textContent = adminUser.username[0].toUpperCase();
  }
  showView('dashboard');
  loadCategoriesForForm();
}

// ── Login Form ─────────────────────────────────────────────────────────────────
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const username = $('loginUsername').value.trim();
  const password = $('loginPassword').value;
  const errEl = $('loginError');
  const btnText = $('loginBtnText');
  const spinner = $('loginSpinner');

  errEl.textContent = '';
  btnText.style.display = 'none';
  spinner.style.display = 'block';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
      token = data.token;
      adminUser = data.admin;
      localStorage.setItem('pk_admin_token', token);
      showDashboard();
      toast('Welcome back, ' + adminUser.username + '!');
    } else {
      errEl.textContent = data.error || 'Login failed.';
    }
  } catch {
    errEl.textContent = 'Server error. Please try again.';
  } finally {
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  }
});

$('togglePw').addEventListener('click', () => {
  const pw = $('loginPassword');
  pw.type = pw.type === 'password' ? 'text' : 'password';
});

// ── Logout ─────────────────────────────────────────────────────────────────────
$('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('pk_admin_token');
  token = null;
  adminUser = null;
  showLogin();
});

// ── Navigation ─────────────────────────────────────────────────────────────────
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showView(link.dataset.view);
    if (window.innerWidth < 768) $('sidebar').classList.remove('open');
  });
});

$('topbarMenu').addEventListener('click', () => {
  $('sidebar').classList.toggle('open');
});
$('sidebarClose').addEventListener('click', () => {
  $('sidebar').classList.remove('open');
});

function showView(name) {
  const views = { dashboard: 'viewDashboard', products: 'viewProducts', 'add-product': 'viewAddProduct', settings: 'viewSettings' };
  const titles = { dashboard: 'Dashboard', products: 'Products', 'add-product': 'Add Product', settings: 'Settings' };
  Object.values(views).forEach(v => $(`${v}`).style.display = 'none');
  $(views[name]).style.display = 'block';
  $('topbarTitle').textContent = titles[name] || name;
  document.querySelectorAll('.sidebar-link').forEach(l => {
    l.classList.toggle('active', l.dataset.view === name);
  });
  if (name === 'dashboard') loadDashboard();
  if (name === 'products') loadAdminProducts();
  if (name === 'add-product' && !editMode) {
    $('productFormTitle').textContent = 'Add New Product';
    $('submitBtnText').textContent = 'Add Product';
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [prodRes, catRes] = await Promise.all([
      fetch(`${API}/products/admin/all?limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/categories`)
    ]);
    const { products, pagination } = await prodRes.json();
    const { categories } = await catRes.json();

    const active = products.filter(p => p.isActive).length;
    $('dashStats').innerHTML = `
      <div class="stat-card"><div class="stat-card-icon">📦</div><div class="stat-card-num">${pagination?.total || 0}</div><div class="stat-card-label">Total Products</div></div>
      <div class="stat-card"><div class="stat-card-icon">⭐</div><div class="stat-card-num">${products.filter(p => p.featured).length}</div><div class="stat-card-label">Featured</div></div>
      <div class="stat-card"><div class="stat-card-icon">📂</div><div class="stat-card-num">${categories.length}</div><div class="stat-card-label">Categories</div></div>
      <div class="stat-card"><div class="stat-card-icon">✓</div><div class="stat-card-num">${active}</div><div class="stat-card-label">Active (last 5)</div></div>
    `;

    $('recentTable').innerHTML = products.map(p => {
      const src = p.imageUrl || p.image;
      return `<div class="recent-row">
        ${src ? `<img class="recent-img" src="${src}" alt="${p.name}">` : `<div class="recent-img">🛍️</div>`}
        <div class="recent-name">${p.name}</div>
        <div class="recent-price">${fmt(p.price)}</div>
      </div>`;
    }).join('');

    $('dashCategories').innerHTML = categories.map(c => `
      <div class="cat-item"><span class="cat-name">${c.name}</span><span class="cat-count">${c.count}</span></div>
    `).join('');
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

// ── Admin Products ─────────────────────────────────────────────────────────────
let adminSearchTimer;
$('adminSearch').addEventListener('input', e => {
  clearTimeout(adminSearchTimer);
  adminSearchTimer = setTimeout(() => {
    adminPage = 1;
    loadAdminProducts();
  }, 400);
});
$('adminCatFilter').addEventListener('change', () => {
  adminPage = 1;
  loadAdminProducts();
});

async function loadAdminProducts() {
  const search = $('adminSearch').value.trim();
  const category = $('adminCatFilter').value;
  const params = new URLSearchParams({ page: adminPage, limit: 10 });
  if (search) params.set('search', search);
  if (category) params.set('category', category);

  $('adminProductsTable').innerHTML = `<div style="padding:40px;text-align:center"><div class="btn-spinner" style="margin:auto;border-color:var(--border);border-top-color:var(--gold)"></div></div>`;

  try {
    const res = await fetch(`${API}/products/admin/all?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) { localStorage.removeItem('pk_admin_token'); showLogin(); return; }
    const { products, pagination } = await res.json();

    if (!products || products.length === 0) {
      $('adminProductsTable').innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">No products found.</div>`;
      $('adminPagination').innerHTML = '';
      return;
    }

    $('adminProductsTable').innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => {
            const src = p.imageUrl || p.image;
            return `<tr>
              <td>${src ? `<img class="table-img" src="${src}" alt="${p.name}">` : `<div class="table-img" style="display:flex;align-items:center;justify-content:center">🛍️</div>`}</td>
              <td><div class="table-product-name">${p.name}</div>${p.featured ? '<span class="badge badge--featured" style="margin-top:3px;display:inline-block">Featured</span>' : ''}</td>
              <td><span class="table-cat">${p.category || 'General'}</span></td>
              <td><span class="table-price">${fmt(p.price)}</span></td>
              <td>${p.stock}</td>
              <td><span class="badge ${p.isActive ? 'badge--active' : 'badge--inactive'}">${p.isActive ? 'Active' : 'Hidden'}</span></td>
              <td>
                <div class="table-actions">
                  <button class="action-btn action-btn--edit" onclick="editProduct('${p._id}')">Edit</button>
                  <button class="action-btn action-btn--delete" onclick="confirmDelete('${p._id}','${p.name.replace(/'/g,"\\'")}')">Delete</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;

    renderAdminPagination(pagination);
  } catch (err) {
    $('adminProductsTable').innerHTML = `<div style="padding:40px;text-align:center;color:var(--danger)">Failed to load products.</div>`;
  }
}

function renderAdminPagination({ pages, page }) {
  if (!pages || pages <= 1) { $('adminPagination').innerHTML = ''; return; }
  $('adminPagination').innerHTML = Array.from({ length: pages }, (_, i) => `
    <button class="admin-page-btn ${i + 1 === page ? 'active' : ''}" onclick="adminPage=${i+1};loadAdminProducts()">${i + 1}</button>
  `).join('');
}

async function loadCategoriesForForm() {
  try {
    const res = await fetch(`${API}/categories`);
    const { categories } = await res.json();
    const datalist = $('catList');
    const filter = $('adminCatFilter');
    datalist.innerHTML = categories.map(c => `<option value="${c.name}">`).join('');
    filter.innerHTML = `<option value="">All Categories</option>` + categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  } catch {}
}

// ── Product Form ───────────────────────────────────────────────────────────────
$('pImage').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => {
      $('imgPreview').src = ev.target.result;
      $('imgPreview').style.display = 'block';
      $('imgLabel').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
});

$('productForm').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = $('formError');
  const btnText = $('submitBtnText');
  const spinner = $('submitSpinner');
  errEl.textContent = '';
  btnText.style.display = 'none';
  spinner.style.display = 'block';

  try {
    const fd = new FormData();
    fd.append('name', $('pName').value.trim());
    fd.append('description', $('pDesc').value.trim());
    fd.append('price', $('pPrice').value);
    fd.append('originalPrice', $('pOriginalPrice').value || '');
    fd.append('category', $('pCategory').value.trim() || 'General');
    fd.append('stock', $('pStock').value || '100');
    fd.append('featured', $('pFeatured').checked);
    fd.append('tags', $('pTags').value.trim());
    fd.append('imageUrl', $('pImageUrl').value.trim());
    if ($('pImage').files[0]) fd.append('image', $('pImage').files[0]);

    const editId = $('editProductId').value;
    const url = editId ? `${API}/products/${editId}` : `${API}/products`;
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: fd
    });
    const data = await res.json();

    if (res.ok) {
      toast(editId ? 'Product updated!' : 'Product added!');
      resetProductForm();
      loadCategoriesForForm();
      showView('products');
    } else {
      errEl.textContent = data.error || 'Failed to save product.';
    }
  } catch {
    errEl.textContent = 'Server error. Please try again.';
  } finally {
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  }
});

async function editProduct(id) {
  try {
    const res = await fetch(`${API}/products/${id}`);
    const { product: p } = await res.json();

    editMode = true;
    $('editProductId').value = p._id;
    $('pName').value = p.name;
    $('pDesc').value = p.description;
    $('pPrice').value = p.price;
    $('pOriginalPrice').value = p.originalPrice || '';
    $('pCategory').value = p.category || '';
    $('pStock').value = p.stock;
    $('pFeatured').checked = p.featured;
    $('pTags').value = p.tags ? p.tags.join(', ') : '';
    $('pImageUrl').value = p.imageUrl || '';

    const src = p.imageUrl || p.image;
    if (src) {
      $('imgPreview').src = src;
      $('imgPreview').style.display = 'block';
      $('imgLabel').style.display = 'none';
    }

    $('productFormTitle').textContent = 'Edit Product';
    $('submitBtnText').textContent = 'Update Product';
    showView('add-product');
  } catch {
    toast('Failed to load product.', 'error');
  }
}

function resetProductForm() {
  editMode = false;
  $('productForm').reset();
  $('editProductId').value = '';
  $('imgPreview').style.display = 'none';
  $('imgLabel').style.display = 'flex';
  $('formError').textContent = '';
  $('productFormTitle').textContent = 'Add New Product';
  $('submitBtnText').textContent = 'Add Product';
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────
function confirmDelete(id, name) {
  $('confirmMessage').textContent = `Delete "${name}"? This cannot be undone.`;
  $('confirmOverlay').classList.add('open');
  confirmCallback = () => deleteProduct(id);
}

$('confirmNo').addEventListener('click', () => {
  $('confirmOverlay').classList.remove('open');
  confirmCallback = null;
});
$('confirmYes').addEventListener('click', () => {
  $('confirmOverlay').classList.remove('open');
  if (confirmCallback) confirmCallback();
  confirmCallback = null;
});

async function deleteProduct(id) {
  try {
    const res = await fetch(`${API}/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      toast('Product deleted.');
      loadAdminProducts();
      loadCategoriesForForm();
    } else {
      const { error } = await res.json();
      toast(error || 'Delete failed.', 'error');
    }
  } catch {
    toast('Server error.', 'error');
  }
}

// ── Change Password ────────────────────────────────────────────────────────────
$('changePasswordForm').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = $('pwError');
  errEl.textContent = '';
  const newPw = $('newPw').value;
  const confirmPw = $('confirmPw').value;
  if (newPw !== confirmPw) { errEl.textContent = 'Passwords do not match.'; return; }

  try {
    const res = await fetch(`${API}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: $('currentPw').value, newPassword: newPw })
    });
    const data = await res.json();
    if (res.ok) {
      toast('Password changed successfully!');
      $('changePasswordForm').reset();
    } else {
      errEl.textContent = data.error || 'Failed to change password.';
    }
  } catch {
    errEl.textContent = 'Server error.';
  }
});

// ── Init ───────────────────────────────────────────────────────────────────────
checkAuth();
