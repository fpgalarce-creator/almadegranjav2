// Utilidades generales de UI y carrito compartidas entre páginas
function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

const THEME_KEY = 'almaTheme';

function applyTheme(theme) {
  const nextTheme = theme === 'night' ? 'night' : 'day';
  document.body.setAttribute('data-theme', nextTheme);
  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch (error) {
    console.error('No se pudo guardar el tema:', error);
  }

  const toggle = qs('#theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-label', nextTheme === 'night' ? 'Cambiar a tema día' : 'Cambiar a tema noche');
  }
}

function initThemeToggle() {
  const stored = localStorage.getItem(THEME_KEY);
  const initialTheme = stored === 'night' ? 'night' : 'day';
  applyTheme(initialTheme);

  const toggle = qs('#theme-toggle');
  toggle?.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme');
    applyTheme(current === 'night' ? 'day' : 'night');
  });
}

function initNavbar() {
  const navToggle = qs('#nav-toggle');
  const navLinks = qs('#nav-links');
  const cartBtn = qs('#cart-btn');
  const logoutBtn = qs('#logout-btn');
  const sessionLabel = qs('#session-label');
  const adminLink = qs('#admin-link');
  const dropdownToggles = qsa('.nav-dropdown-toggle');

  const currentUser = window.store.getCurrentUser();
  if (sessionLabel) {
    if (currentUser) {
      sessionLabel.textContent = `Hola, ${currentUser.nombre}`;
      sessionLabel.style.display = 'inline-flex';
      qs('#auth-link')?.classList.add('hidden');
      logoutBtn?.classList.remove('hidden');
    }
  }

  if (currentUser?.rol === 'admin' && adminLink) {
    adminLink.classList.remove('hidden');
  }

  logoutBtn?.addEventListener('click', () => {
    window.store.logoutUser();
    window.location.href = 'index.html';
  });

  navToggle?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
  });

  navLinks?.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
      navLinks.classList.remove('open');
      qsa('.nav-dropdown').forEach((item) => item.classList.remove('open'));
    }
  });

  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener('click', (event) => {
      const parent = toggle.closest('.nav-dropdown');
      if (!parent) return;
      // En mobile abrimos/cerramos el submenú en lugar de navegar de inmediato.
      if (window.innerWidth <= 1024) {
        event.preventDefault();
        parent.classList.toggle('open');
      }
    });
  });

  window.addEventListener('scroll', () => {
    const navbar = qs('.navbar');
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 12);
  });

  qsa('.nav-links a').forEach((link) => {
    if (link.href === window.location.href) {
      link.classList.add('active');
    }
  });

  cartBtn?.addEventListener('click', () => toggleCart(true));
}

function updateCartBadge() {
  const badge = qs('#cart-badge');
  if (!badge) return;
  const cart = window.store.loadCart();
  const total = cart.reduce((acc, item) => acc + item.cantidad, 0);
  badge.textContent = total;
}

function toggleCart(open) {
  const panel = qs('#cart-panel');
  const overlay = qs('#cart-overlay');
  if (!panel) return;
  if (open) {
    panel.classList.add('open');
    overlay?.classList.add('open');
    renderCart();
  } else {
    panel.classList.remove('open');
    overlay?.classList.remove('open');
  }
}

function renderCart() {
  const { items, total } = window.store.calculateCartDetails();
  const list = qs('#cart-items');
  const subtotalEl = qs('#cart-subtotal');
  const cartEmpty = qs('#cart-empty');

  if (!list || !subtotalEl || !cartEmpty) return;

  list.innerHTML = '';
  if (!items.length) {
    cartEmpty.style.display = 'grid';
  } else {
    cartEmpty.style.display = 'none';
    items.forEach((entry) => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div>
          <strong>${entry.product.nombre}</strong>
          <p>${entry.product.presentacion} · $${entry.product.precio.toLocaleString('es-CL')}</p>
          <div class="quantity">
            <button data-action="minus">-</button>
            <span>${entry.cantidad}</span>
            <button data-action="plus">+</button>
          </div>
          <button class="btn outline" data-action="remove">Eliminar</button>
        </div>
        <div class="price">$${entry.subtotal.toLocaleString('es-CL')}</div>
      `;

      row.querySelector('[data-action="minus"]').addEventListener('click', () => {
        const newQty = entry.cantidad - 1;
        window.store.setCartItemQuantity(entry.product.id, newQty);
        renderCart();
        updateCartBadge();
      });

      row.querySelector('[data-action="plus"]').addEventListener('click', () => {
        window.store.setCartItemQuantity(entry.product.id, entry.cantidad + 1);
        renderCart();
        updateCartBadge();
      });

      row.querySelector('[data-action="remove"]').addEventListener('click', () => {
        window.store.removeCartItem(entry.product.id);
        renderCart();
        updateCartBadge();
      });

      list.appendChild(row);
    });
  }

  subtotalEl.textContent = `$${total.toLocaleString('es-CL')}`;
}

function buildWhatsAppMessage(formData) {
  const { items, total } = window.store.calculateCartDetails();
  const lineItems = items
    .map((i) => `${i.cantidad} x ${i.product.nombre} (${i.product.presentacion}) - $${i.product.precio.toLocaleString('es-CL')}`)
    .join('%0A');
  const header = 'Hola, quiero confirmar mi pedido:';
  const cliente = `\nCliente: ${formData.nombre} ${formData.apellido}\nDirección: ${formData.direccion}`;
  const comentarios = formData.comentarios ? `\nComentarios: ${formData.comentarios}` : '';
  const totalLine = `\nTotal aprox: $${total.toLocaleString('es-CL')}\nDespacho a coordinar.`;
  return `${header}%0A${lineItems}${cliente}${comentarios}${totalLine}`;
}

function initCartForm() {
  const cartForm = qs('#cart-form');
  if (!cartForm) return;
  const currentUser = window.store.getCurrentUser();
  if (currentUser) {
    cartForm.nombre.value = currentUser.nombre;
    cartForm.apellido.value = currentUser.apellido;
  }

  cartForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { nombre, apellido, direccion, comentarios } = cartForm;
    if (!nombre.value || !apellido.value || !direccion.value) {
      alert('Completa los datos de entrega.');
      return;
    }
    const waMessage = buildWhatsAppMessage({
      nombre: nombre.value,
      apellido: apellido.value,
      direccion: direccion.value,
      comentarios: comentarios.value
    });
    // Cambia el número de WhatsApp aquí para el contacto oficial
    const waUrl = `https://wa.me/56912345678?text=${waMessage}`;
    window.open(waUrl, '_blank');
  });
}

function initFeaturedProducts() {
  const container = qs('#featured-products');
  if (!container) return;
  const products = window.store.loadProducts();
  // Los destacados se controlan desde el admin: si no hay marcados, mostramos un fallback.
  const featured = products.filter((product) => product.isFeatured);
  const fallback = products.filter((product) => product.stock > 0).slice(0, 4);
  const productsToShow = featured.length ? featured : fallback.length ? fallback : products.slice(0, 4);
  container.innerHTML = '';
  productsToShow.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${product.imagen}" alt="${product.nombre}">
      <div class="badge">${product.categoria}</div>
      <h3>${product.nombre}</h3>
      <small>${product.presentacion}</small>
      <p>${product.descripcion}</p>
      <div class="price">$${product.precio.toLocaleString('es-CL')}</div>
      <div class="card-actions">
        <div class="quantity pill">
          <button data-action="minus">-</button>
          <span class="qty-value">${window.store.getCartQuantity(product.id)}</span>
          <button data-action="plus">+</button>
        </div>
        <button class="btn add-btn" data-id="${product.id}">Agregar al carrito</button>
      </div>
    `;
    const minus = card.querySelector('[data-action="minus"]');
    const plus = card.querySelector('[data-action="plus"]');
    const qty = card.querySelector('.qty-value');
    const addBtn = card.querySelector('.add-btn');

    const syncQty = () => {
      const value = window.store.getCartQuantity(product.id);
      qty.textContent = value;
      minus.disabled = value === 0;
    };

    addBtn.addEventListener('click', () => {
      window.store.addProductToCart(product.id);
      syncQty();
      renderCart();
      updateCartBadge();
    });

    plus.addEventListener('click', () => {
      window.store.setCartItemQuantity(product.id, window.store.getCartQuantity(product.id) + 1);
      syncQty();
      renderCart();
      updateCartBadge();
    });

    minus.addEventListener('click', () => {
      window.store.setCartItemQuantity(product.id, window.store.getCartQuantity(product.id) - 1);
      syncQty();
      renderCart();
      updateCartBadge();
    });

    syncQty();
    container.appendChild(card);
  });
}

function initStoreGrid() {
  const grid = qs('#store-grid');
  const filter = qs('#category-filter');
  const chipGroup = qs('#category-chips');
  const sortButtons = qsa('[data-sort]');
  if (!grid || !filter) return;

  let currentSort = 'price-asc';

  const setActiveCategory = (category) => {
    filter.value = category;
    qsa('.chip', chipGroup).forEach((chip) => chip.classList.toggle('active', chip.dataset.category === category));
  };

  const sortProducts = (products) => {
    const sorted = [...products];
    switch (currentSort) {
      case 'price-asc':
        return sorted.sort((a, b) => a.precio - b.precio);
      case 'price-desc':
        return sorted.sort((a, b) => b.precio - a.precio);
      case 'za':
        return sorted.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'));
      default:
        return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    }
  };

  const render = () => {
    const products = sortProducts(window.store.filteredProductsByCategory(filter.value));
    grid.innerHTML = '';
    products.forEach((product) => {
      const card = document.createElement('article');
      card.className = 'card';
      const isNew = ['o2', 'f3'].includes(product.id);
      const quantity = window.store.getCartQuantity(product.id);
      card.innerHTML = `
        <img src="${product.imagen}" alt="${product.nombre}">
        <div class="badge">${product.categoria} ${isNew ? '<span class="badge-new">Nuevo</span>' : ''}</div>
        <h3>${product.nombre}</h3>
        <small>${product.presentacion}</small>
        <p>${product.descripcion}</p>
        <div class="price">$${product.precio.toLocaleString('es-CL')}</div>
        ${product.stock === 0 ? '<span class="status-pill">Sin stock</span>' : ''}
        <div class="card-actions">
          <div class="quantity pill">
            <button data-action="minus">-</button>
            <span class="qty-value">${quantity}</span>
            <button data-action="plus">+</button>
          </div>
          <button class="btn add-btn" data-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>Agregar al carrito</button>
        </div>
      `;

      const minus = card.querySelector('[data-action="minus"]');
      const plus = card.querySelector('[data-action="plus"]');
      const qty = card.querySelector('.qty-value');
      const addBtn = card.querySelector('.add-btn');

      const syncQty = () => {
        const value = window.store.getCartQuantity(product.id);
        qty.textContent = value;
        minus.disabled = value === 0 || product.stock === 0;
        plus.disabled = product.stock === 0;
        addBtn.disabled = product.stock === 0;
      };

      addBtn.addEventListener('click', () => {
        window.store.addProductToCart(product.id);
        syncQty();
        renderCart();
        updateCartBadge();
      });

      plus.addEventListener('click', () => {
        window.store.setCartItemQuantity(product.id, window.store.getCartQuantity(product.id) + 1);
        syncQty();
        renderCart();
        updateCartBadge();
      });

      minus.addEventListener('click', () => {
        window.store.setCartItemQuantity(product.id, window.store.getCartQuantity(product.id) - 1);
        syncQty();
        renderCart();
        updateCartBadge();
      });

      syncQty();
      grid.appendChild(card);
    });
  };

  filter.addEventListener('change', () => {
    setActiveCategory(filter.value);
    render();
  });
  chipGroup?.addEventListener('click', (event) => {
    if (event.target.classList.contains('chip')) {
      const category = event.target.dataset.category;
      setActiveCategory(category);
      render();
    }
  });

  // Lee la categoría desde la URL (?categoria=) y aplica el filtro de forma automática.
  const applyCategoryFromQuery = () => {
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get('categoria');
    if (!urlCategory) return;
    const map = {
      huevos: 'Huevos',
      quesos: 'Quesos',
      'frutos-secos': 'Frutos secos',
      otros: 'Otros'
    };
    const mapped = map[urlCategory.toLowerCase()];
    if (mapped) {
      setActiveCategory(mapped);
    }
  };

  applyCategoryFromQuery();
  render();

  sortButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      sortButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      render();
    })
  );
}

function initContactForms() {
  qsa('[data-contact-form]').forEach((form) => {
    const feedback = form.querySelector('.message');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const valid = qsa('input, textarea', form).every((field) => field.value.trim() !== '');
      if (!valid) {
        alert('Completa todos los campos.');
        return;
      }
      if (feedback) {
        feedback.textContent = 'Gracias por contactarnos, responderemos pronto.';
        feedback.style.display = 'block';
      }
      form.reset();
      // Aquí se podría integrar un backend real o un servicio de email.
    });
  });
}

function initAuthPage() {
  const loginForm = qs('#login-form');
  const registerForm = qs('#register-form');
  const tabs = qsa('[data-tab]');
  const panels = qsa('[data-panel]');

  if (!loginForm || !registerForm) return;

  const switchTab = (target) => {
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === target));
    panels.forEach((p) => (p.style.display = p.dataset.panel === target ? 'block' : 'none'));
  };

  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    })
  );

  switchTab('login');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const correo = loginForm.correo.value;
    const contrasena = loginForm.contrasena.value;
    const result = window.store.loginUser({ correo, contrasena });
    const feedback = qs('.message', loginForm);
    if (!result.ok) {
      if (feedback) feedback.textContent = result.message;
      return;
    }
    window.location.href = 'index.html';
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      nombre: registerForm.nombre.value,
      apellido: registerForm.apellido.value,
      correo: registerForm.correo.value,
      contrasena: registerForm.contrasena.value
    };
    const confirm = registerForm.confirmar.value;
    const feedback = qs('.message', registerForm);
    if (!Object.values(data).every((v) => v)) {
      feedback.textContent = 'Completa todos los campos.';
      return;
    }
    if (data.contrasena !== confirm) {
      feedback.textContent = 'Las contraseñas no coinciden.';
      return;
    }
    const result = window.store.registerUser(data);
    feedback.textContent = result.message;
    if (result.ok) registerForm.reset();
  });
}

function initAdminPage() {
  const guard = qs('[data-admin-guard]');
  if (!guard) return;
  const currentUser = window.store.getCurrentUser();
  if (!currentUser || currentUser.rol !== 'admin') {
    window.location.href = 'auth.html';
    return;
  }

  const form = qs('#product-form');
  const list = qs('#products-table tbody');
  const adminName = qs('#admin-name');
  const adminFeedback = qs('#admin-feedback');
  let editingId = null;

  if (adminName) {
    adminName.textContent = currentUser.nombre || 'Admin';
  }

  const render = () => {
    const products = window.store.loadProducts();
    list.innerHTML = '';
    products.forEach((product) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.nombre}</td>
        <td>${product.categoria}</td>
        <td>$${product.precio.toLocaleString('es-CL')}</td>
        <td>${product.stock}</td>
        <td>
          <button class="btn outline" data-action="edit">Editar</button>
          <button class="btn secondary" data-action="delete">Eliminar</button>
        </td>
      `;

      row.querySelector('[data-action="edit"]').addEventListener('click', () => {
        editingId = product.id;
        form.nombre.value = product.nombre;
        form.categoria.value = product.categoria;
        form.descripcion.value = product.descripcion;
        form.presentacion.value = product.presentacion;
        form.precio.value = product.precio;
        form.stock.value = product.stock;
        form.imagen.value = product.imagen;
        form.isFeatured.checked = !!product.isFeatured;
        form.scrollIntoView({ behavior: 'smooth' });
      });

      row.querySelector('[data-action="delete"]').addEventListener('click', () => {
        if (confirm('¿Eliminar producto?')) {
          window.store.deleteProduct(product.id);
          render();
          if (adminFeedback) {
            adminFeedback.textContent = 'Producto eliminado.';
            adminFeedback.style.display = 'block';
          }
        }
      });

      list.appendChild(row);
    });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const productData = {
      id: editingId || crypto.randomUUID(),
      nombre: form.nombre.value,
      categoria: form.categoria.value,
      descripcion: form.descripcion.value,
      presentacion: form.presentacion.value,
      precio: Number(form.precio.value),
      stock: Number(form.stock.value),
      isFeatured: form.isFeatured.checked,
      imagen: form.imagen.value || 'assets/img/otros.jpg'
    };
    window.store.upsertProduct(productData);
    editingId = null;
    form.reset();
    render();
    if (adminFeedback) {
      adminFeedback.textContent = 'Producto guardado correctamente.';
      adminFeedback.style.display = 'block';
    }
  });

  render();
}

function initPage() {
  initThemeToggle();
  initNavbar();
  updateCartBadge();
  initCartForm();
  initFeaturedProducts();
  initStoreGrid();
  initContactForms();
  initAuthPage();
  initAdminPage();

  qs('#cart-close')?.addEventListener('click', () => toggleCart(false));
  qs('#cart-overlay')?.addEventListener('click', () => toggleCart(false));
}

document.addEventListener('DOMContentLoaded', initPage);
