(function () {
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const products = window.AXEN_PRODUCTS || [];
  const state = {
    cart: JSON.parse(localStorage.getItem("axen-final-cart") || "[]"),
    size: "",
    maxPrice: 500,
    sort: "featured"
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  async function loadPartial(selector, path) {
    const mount = $(selector);
    if (!mount) return;
    const response = await fetch(path);
    mount.innerHTML = await response.text();
  }

  async function init() {
    await Promise.all([
      loadPartial("[data-header]", "../components/header.html"),
      loadPartial("[data-footer]", "../components/footer.html")
    ]);
    injectOverlays();
    bindGlobalEvents();
    renderCart();
    renderCurrentPage();
  }

  function injectOverlays() {
    document.body.insertAdjacentHTML("beforeend", `
      <section class="search-panel" data-search-panel>
        <div class="search-box-global">
          <input type="search" data-global-search placeholder="Buscar produto AXEN" autofocus />
          <button class="outline-button" type="button" data-close-search>Fechar</button>
        </div>
      </section>
      <section class="cart-drawer" data-cart-drawer>
        <div class="cart-backdrop" data-close-cart></div>
        <aside class="cart-panel">
          <header><strong>Carrinho AXEN</strong><button type="button" data-close-cart>×</button></header>
          <div class="cart-items" data-cart-items></div>
          <footer><div>Subtotal: <strong data-cart-total>R$ 0,00</strong></div><button class="gold-button" type="button">Finalizar compra</button></footer>
        </aside>
      </section>
    `);
  }

  function bindGlobalEvents() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-open-search],[data-close-search],[data-open-cart],[data-close-cart],[data-size],[data-view],[data-add-cart],[data-remove-cart]");
      if (!target) return;
      if (target.dataset.openSearch !== undefined) return $("[data-search-panel]").classList.add("is-open");
      if (target.dataset.closeSearch !== undefined) return $("[data-search-panel]").classList.remove("is-open");
      if (target.dataset.openCart !== undefined) return $("[data-cart-drawer]").classList.add("is-open");
      if (target.dataset.closeCart !== undefined) return $("[data-cart-drawer]").classList.remove("is-open");
      if (target.dataset.size) return selectSize(target);
      if (target.dataset.view) return changeProductView(target.dataset.view);
      if (target.dataset.addCart) return addCurrentProduct();
      if (target.dataset.removeCart !== undefined) return removeCartItem(Number(target.dataset.removeCart));
    });

    const search = $("[data-global-search]");
    search?.addEventListener("change", () => {
      location.href = `../cliente/masculino.html?q=${encodeURIComponent(search.value)}`;
    });
  }

  function renderCurrentPage() {
    const page = document.body.dataset.page;
    if (page === "catalog") renderCatalog();
    if (page === "product") renderProduct();
    if (page === "admin-products") renderAdminProducts();
  }

  function productsForPage() {
    const category = document.body.dataset.category || "masculino";
    let list = products.filter((product) => product.audience.includes(category));
    const query = new URLSearchParams(location.search).get("q")?.toLowerCase();
    if (query) list = list.filter((product) => product.name.toLowerCase().includes(query));
    if (state.size) list = list.filter((product) => product.sizes.includes(state.size));
    list = list.filter((product) => product.price <= state.maxPrice);
    if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
    return list;
  }

  function renderCatalog() {
    const grid = $("[data-product-grid]");
    if (!grid) return;
    const list = productsForPage();
    $("[data-result-count]").textContent = `${list.length} produto${list.length === 1 ? "" : "s"}`;
    grid.innerHTML = list.length ? list.map(productCard).join("") : `<div class="empty-state">Nenhum produto disponível nesta seleção.</div>`;

    $("[data-price-range]")?.addEventListener("input", (event) => {
      state.maxPrice = Number(event.target.value);
      $("[data-price-label]").textContent = money.format(state.maxPrice);
      renderCatalog();
    }, { once: true });
    $("[data-sort]")?.addEventListener("change", (event) => {
      state.sort = event.target.value;
      renderCatalog();
    }, { once: true });
  }

  function productCard(product) {
    return `
      <article class="product-card">
        <a class="product-card-link" href="../cliente/produto.html?slug=${product.slug}">
          <div class="product-media">
            <img class="front" src="${product.front}" alt="Frente de ${product.name}" />
            <img class="back" src="${product.back}" alt="Costas de ${product.name}" />
            <span class="product-arrow">→</span>
          </div>
          <div class="product-copy">
            <small>${product.category}</small>
            <h2>${product.name}</h2>
            <strong>${money.format(product.price)}</strong>
            <p>${product.description}</p>
          </div>
        </a>
      </article>
    `;
  }

  function selectSize(button) {
    state.size = button.dataset.size;
    $$("[data-size]").forEach((item) => item.classList.toggle("is-active", item === button));
    if (document.body.dataset.page === "catalog") renderCatalog();
  }

  function currentProduct() {
    const slug = new URLSearchParams(location.search).get("slug") || "axen-oversize-incrivel";
    return products.find((product) => product.slug === slug) || products[0];
  }

  function renderProduct() {
    const product = currentProduct();
    if (!product) return;
    document.title = `${product.name} | AXEN`;
    $("[data-product-image]").src = product.front;
    $("[data-product-image]").alt = `Frente de ${product.name}`;
    $("[data-product-category]").textContent = product.category;
    $("[data-product-name]").textContent = product.name;
    $("[data-product-price]").textContent = money.format(product.price);
    $("[data-product-description]").textContent = product.description;
    $("[data-product-sizes]").innerHTML = product.sizes.map((size, index) =>
      `<button class="${index === 0 ? "is-active" : ""}" type="button" data-size="${size}">${size}</button>`
    ).join("");
    state.size = product.sizes[0];
    const colorGroup = $("[data-product-colors-group]");
    if (product.category === "Oversize") colorGroup.hidden = true;
    else $("[data-product-colors]").innerHTML = product.colors.map((color) => `<button type="button">${color}</button>`).join("");
    const spin = $('[data-view="spin"]');
    if (!product.spin) spin.hidden = true;
  }

  function changeProductView(view) {
    const product = currentProduct();
    const image = $("[data-product-image]");
    const source = view === "back" ? product.back : view === "spin" ? product.spin : product.front;
    if (!source) return;
    image.src = source;
    $$("[data-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  }

  function addCurrentProduct() {
    const product = currentProduct();
    state.cart.push({ slug: product.slug, name: product.name, price: product.price, image: product.front, size: state.size, quantity: 1 });
    saveCart();
    $("[data-cart-drawer]").classList.add("is-open");
  }

  function removeCartItem(index) {
    state.cart.splice(index, 1);
    saveCart();
  }

  function saveCart() {
    localStorage.setItem("axen-final-cart", JSON.stringify(state.cart));
    renderCart();
  }

  function renderCart() {
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    $$("[data-cart-count]").forEach((item) => item.textContent = String(count));
    const list = $("[data-cart-items]");
    if (!list) return;
    list.innerHTML = state.cart.length ? state.cart.map((item, index) => `
      <article class="cart-item">
        <img src="${item.image}" alt="${item.name}" />
        <div><h3>${item.name}</h3><small>${item.size}</small><p>${money.format(item.price)}</p></div>
        <button type="button" data-remove-cart="${index}">Remover</button>
      </article>
    `).join("") : `<div class="empty-state">Seu carrinho está vazio.</div>`;
    $("[data-cart-total]").textContent = money.format(state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
  }

  function renderAdminProducts() {
    const table = $("[data-admin-products]");
    if (!table) return;
    table.innerHTML = products.map((product) => `
      <tr><td>${product.name}</td><td>${product.category}</td><td>${money.format(product.price)}</td><td class="status">Ativo</td></tr>
    `).join("");
  }

  init().catch((error) => {
    console.error("AXEN init error", error);
  });
})();
