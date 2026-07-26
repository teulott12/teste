(function () {
  const products = window.AXEN_PRODUCTS || [];
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function productLink(product) {
    return `
      <a class="app-card" href="./produto-app.html?slug=${product.slug}">
        <img src="${product.front}" alt="${product.name}" />
        <div><small>${product.category}</small><h2>${product.name}</h2><strong>${money.format(product.price)}</strong></div>
      </a>
    `;
  }

  function init() {
    const list = document.querySelector("[data-app-products]");
    if (list) list.innerHTML = products.slice(0, 6).map(productLink).join("");

    const detail = document.querySelector("[data-app-product-detail]");
    if (detail) {
      const slug = new URLSearchParams(location.search).get("slug") || "axen-oversize-incrivel";
      const product = products.find((item) => item.slug === slug) || products[0];
      detail.querySelector("img").src = product.front;
      detail.querySelector("img").alt = product.name;
      detail.querySelector("h1").textContent = product.name;
      detail.querySelector("strong").textContent = money.format(product.price);
      detail.querySelector("p").textContent = product.description;
      detail.querySelector("[data-app-sizes]").innerHTML = product.sizes.map((size) => `<button type="button">${size}</button>`).join("");
    }

    const profile = document.querySelector("[data-app-profile]");
    profile?.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = profile.querySelector("input").value.trim() || "Atleta AXEN";
      profile.querySelector("p").textContent = `${name} · nível Discipline Silver salvo.`;
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
