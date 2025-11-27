// Datos y utilidades para productos, autenticación y carrito en localStorage
const STORAGE_KEYS = {
  products: 'adg_products',
  users: 'adg_users',
  cart: 'adg_cart',
  currentUser: 'adg_current_user'
};

// --- Productos ---
const initialProducts = [
  {
    id: 'h1',
    nombre: 'Huevos de campo XL',
    categoria: 'Huevos',
    isFeatured: true,
    descripcion: 'Docena de huevos frescos de gallinas libres',
    presentacion: 'Docena',
    precio: 6990,
    stock: 20,
    imagen: 'assets/img/huevos.jpg'
  },
  {
    id: 'h2',
    nombre: 'Huevos orgánicos mixtos',
    categoria: 'Huevos',
    isFeatured: false,
    descripcion: 'Surtido de tamaños, gallinas de patio',
    presentacion: 'Docena',
    precio: 6290,
    stock: 12,
    imagen: 'assets/img/huevos.jpg'
  },
  {
    id: 'q1',
    nombre: 'Queso mantecoso',
    categoria: 'Quesos',
    isFeatured: true,
    descripcion: 'Queso mantecoso suave ideal para fundir',
    presentacion: '1 kg',
    precio: 10990,
    stock: 10,
    imagen: 'assets/img/quesos.jpg'
  },
  {
    id: 'q2',
    nombre: 'Queso de cabra maduro',
    categoria: 'Quesos',
    isFeatured: true,
    descripcion: 'Maduración media, sabor intenso',
    presentacion: '500 g',
    precio: 13990,
    stock: 8,
    imagen: 'assets/img/quesos.jpg'
  },
  {
    id: 'f1',
    nombre: 'Almendras naturales',
    categoria: 'Frutos secos',
    isFeatured: true,
    descripcion: 'Almendra nacional, sin sal, cruda',
    presentacion: '500 g',
    precio: 7490,
    stock: 15,
    imagen: 'assets/img/frutos-secos.jpg'
  },
  {
    id: 'f2',
    nombre: 'Nueces mariposa',
    categoria: 'Frutos secos',
    isFeatured: false,
    descripcion: 'Nuez premium seleccionada',
    presentacion: '500 g',
    precio: 8490,
    stock: 0,
    imagen: 'assets/img/frutos-secos.jpg'
  },
  {
    id: 'f3',
    nombre: 'Mix frutos secos deluxe',
    categoria: 'Frutos secos',
    isFeatured: false,
    descripcion: 'Almendras, nueces, cranberries y maní tostado',
    presentacion: '500 g',
    precio: 7890,
    stock: 9,
    imagen: 'assets/img/frutos-secos.jpg'
  },
  {
    id: 'o1',
    nombre: 'Mermelada artesanal de mora',
    categoria: 'Otros',
    isFeatured: true,
    descripcion: 'Receta casera, sin conservantes',
    presentacion: '350 g',
    precio: 4590,
    stock: 16,
    imagen: 'assets/img/otros.jpg'
  },
  {
    id: 'o2',
    nombre: 'Miel multiflora',
    categoria: 'Otros',
    isFeatured: false,
    descripcion: 'Cosecha local filtrada en frío',
    presentacion: '500 g',
    precio: 5590,
    stock: 11,
    imagen: 'assets/img/otros.jpg'
  }
];

// --- Usuarios ---
const initialUsers = [
  {
    nombre: 'Admin',
    apellido: 'Alma',
    correo: 'admin@almadegranja.cl',
    contrasena: 'admin123',
    rol: 'admin'
  }
];

function loadProducts() {
  const stored = localStorage.getItem(STORAGE_KEYS.products);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(initialProducts));
    return [...initialProducts];
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((product) => ({ ...product, isFeatured: product.isFeatured ?? false }));
  } catch (error) {
    console.error('Error leyendo productos, reinicializando', error);
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(initialProducts));
    return [...initialProducts];
  }
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
}

function loadUsers() {
  const stored = localStorage.getItem(STORAGE_KEYS.users);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(initialUsers));
    return [...initialUsers];
  }
  try {
    const parsed = JSON.parse(stored);
    if (!parsed.find((u) => u.correo === 'admin@almadegranja.cl')) {
      parsed.push(...initialUsers);
    }
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(parsed));
    return parsed;
  } catch (error) {
    console.error('Error leyendo usuarios, reinicializando', error);
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(initialUsers));
    return [...initialUsers];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function getCurrentUser() {
  const user = localStorage.getItem(STORAGE_KEYS.currentUser);
  return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

// --- Carrito ---
function loadCart() {
  const stored = localStorage.getItem(STORAGE_KEYS.cart);
  return stored ? JSON.parse(stored) : [];
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
}

function addProductToCart(productId) {
  const products = loadProducts();
  const product = products.find((p) => p.id === productId);
  if (!product || product.stock === 0) return;

  const cart = loadCart();
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.cantidad += 1;
  } else {
    cart.push({ id: product.id, cantidad: 1 });
  }
  saveCart(cart);
}

function updateCartItem(productId, quantity) {
  const cart = loadCart();
  const item = cart.find((c) => c.id === productId);
  if (!item) return;
  item.cantidad = Math.max(1, quantity);
  saveCart(cart);
}

function removeCartItem(productId) {
  const cart = loadCart().filter((item) => item.id !== productId);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function calculateCartDetails() {
  const cart = loadCart();
  const products = loadProducts();
  const detailed = cart.map((item) => {
    const product = products.find((p) => p.id === item.id);
    return {
      ...item,
      product,
      subtotal: product ? product.precio * item.cantidad : 0
    };
  });
  const total = detailed.reduce((acc, item) => acc + item.subtotal, 0);
  return { items: detailed.filter((i) => i.product), total };
}

function filteredProductsByCategory(category) {
  const products = loadProducts();
  if (!category || category === 'Todas') return products;
  return products.filter((p) => p.categoria === category);
}

function registerUser(data) {
  const users = loadUsers();
  const exists = users.some((u) => u.correo === data.correo);
  if (exists) return { ok: false, message: 'El correo ya está registrado.' };
  users.push({ ...data, rol: 'user' });
  saveUsers(users);
  return { ok: true, message: 'Cuenta creada, ya puedes iniciar sesión.' };
}

function loginUser({ correo, contrasena }) {
  const users = loadUsers();
  const user = users.find((u) => u.correo === correo && u.contrasena === contrasena);
  if (!user) return { ok: false, message: 'Credenciales inválidas.' };
  setCurrentUser({ nombre: user.nombre, apellido: user.apellido, correo: user.correo, rol: user.rol });
  return { ok: true, user };
}

function logoutUser() {
  setCurrentUser(null);
}

function upsertProduct(productData) {
  const products = loadProducts();
  const index = products.findIndex((p) => p.id === productData.id);
  if (index >= 0) {
    products[index] = productData;
  } else {
    products.push({ ...productData, id: crypto.randomUUID() });
  }
  saveProducts(products);
}

function deleteProduct(productId) {
  const products = loadProducts().filter((p) => p.id !== productId);
  saveProducts(products);
}

// Exponer funciones en window para uso en otras vistas
window.store = {
  loadProducts,
  saveProducts,
  filteredProductsByCategory,
  addProductToCart,
  calculateCartDetails,
  updateCartItem,
  removeCartItem,
  clearCart,
  loadCart,
  loadUsers,
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  setCurrentUser,
  upsertProduct,
  deleteProduct
};
