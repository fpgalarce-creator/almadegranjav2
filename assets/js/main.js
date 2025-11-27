// Utilidades generales de UI y carrito compartidas entre páginas
function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

function initNavbar() {
  const navToggle = qs('#nav-toggle');
  const navLinks = qs('#nav-links');
  const cartBtn = qs('#cart-btn');
  const logoutBtn = qs('#logout-btn');
  const sessionLabel = qs('#session-label');
  const adminLink = qs('#admin-link');

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
    cartEmpty.style.display = 'block';
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
        const newQty = Math.max(1, entry.cantidad - 1);
        window.store.updateCartItem(entry.product.id, newQty);
        renderCart();
        updateCartBadge();
      });

      row.querySelector('[data-action="plus"]').addEventListener('click', () => {
        window.store.updateCartItem(entry.product.id, entry.cantidad + 1);
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
  const products = window.store.loadProducts().slice(0, 4);
  container.innerHTML = '';
  products.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${product.imagen}" alt="${product.nombre}">
      <div class="badge">${product.categoria}</div>
      <h3>${product.nombre}</h3>
      <small>${product.presentacion}</small>
      <p>${product.descripcion}</p>
      <div class="price">$${product.precio.toLocaleString('es-CL')}</div>
      <button class="btn" data-id="${product.id}">Agregar al carrito</button>
    `;
    card.querySelector('button').addEventListener('click', () => {
      window.store.addProductToCart(product.id);
      updateCartBadge();
    });
    container.appendChild(card);
  });
}

function initStoreGrid() {
  const grid = qs('#store-grid');
  const filter = qs('#category-filter');
  if (!grid || !filter) return;

  const render = () => {
    const products = window.store.filteredProductsByCategory(filter.value);
    grid.innerHTML = '';
    products.forEach((product) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <img src="${product.imagen}" alt="${product.nombre}">
        <div class="badge">${product.categoria}</div>
        <h3>${product.nombre}</h3>
        <small>${product.presentacion}</small>
        <p>${product.descripcion}</p>
        <div class="price">$${product.precio.toLocaleString('es-CL')}</div>
        ${product.stock === 0 ? '<span class="status-pill">Sin stock</span>' : ''}
        <button class="btn" data-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>Agregar al carrito</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        window.store.addProductToCart(product.id);
        updateCartBadge();
      });
      grid.appendChild(card);
    });
  };

  filter.addEventListener('change', render);
  render();
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
  let editingId = null;

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
        form.scrollIntoView({ behavior: 'smooth' });
      });

      row.querySelector('[data-action="delete"]').addEventListener('click', () => {
        if (confirm('¿Eliminar producto?')) {
          window.store.deleteProduct(product.id);
          render();
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
      imagen: form.imagen.value || 'assets/img/otros.jpg'
    };
    window.store.upsertProduct(productData);
    editingId = null;
    form.reset();
    render();
  });

  render();
}

function initPage() {
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
