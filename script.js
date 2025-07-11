// Bookhub script.js

const productsListEl = document.getElementById("products-list");
const cartItemsEl = document.getElementById("cart-items");
const cartCountEl = document.getElementById("cart-count");
const subtotalEl = document.getElementById("subtotal");
const searchInput = document.getElementById("search-input");
const categorySelect = document.getElementById("category-select");

let allProducts = [];

fetch("http://localhost:3000/products")
  .then(res => res.json())
  .then(products => {
    allProducts = products;
    getProducts(allProducts);
  });

// Render book cards
function getProducts(products) {
  productsListEl.innerHTML = "";
  products.forEach(book => {
    const stars = '<i class="fa fa-star"></i>'.repeat(book.rating);
    productsListEl.innerHTML += `
      <div class="col-md-4">
        <div class="product-card">
          <img src="${book.image}" alt="${book.name}">
          <h5 class="mt-3">${book.name}</h5>
          <div class="stars">${stars}</div>
          <p class="text-secondary">$${book.price}</p>
          <button class="btn btn-primary w-100" onclick="addToCart(${book.id})">Add to Cart</button>
        </div>
      </div>`;
  });
}

// Filter functionality
searchInput.addEventListener("input", () => {
  filterProducts();
});
categorySelect.addEventListener("change", () => {
  filterProducts();
});

function filterProducts() {
  const term = searchInput.value.toLowerCase();
  const category = categorySelect.value;
  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(term) &&
    (category === "" || p.category === category)
  );
  getProducts(filtered);
}

// Add to cart
window.addToCart = async function (id) {
  const product = await (await fetch(`http://localhost:3000/products/${id}`)).json();
  const existing = await (await fetch(`http://localhost:3000/cart?id=${id}`)).json();

  if (existing.length > 0) {
    await fetch(`http://localhost:3000/cart/${existing[0].id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: existing[0].quantity + 1 })
    });
  } else {
    await fetch("http://localhost:3000/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, quantity: 1 })
    });
  }

  loadCart();
};

document.getElementById("cart-toggle").addEventListener("click", () => {
  loadCart();
});

// Load Cart
async function loadCart() {
  const cart = await (await fetch("http://localhost:3000/cart")).json();
  cartItemsEl.innerHTML = "";
  let total = 0, count = 0;

  if (!cart.length) {
    cartItemsEl.innerHTML = "<p class='text-muted'>Your cart is empty.</p>";
  }

  cart.forEach(item => {
    total += item.price * item.quantity;
    count += item.quantity;

    cartItemsEl.innerHTML += `
      <div class="cart-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <img src="${item.image}" alt="${item.name}">
          <div>
            <h6>${item.name}</h6>
            <p>$${item.price}</p>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary" onclick="updateQty(${item.id}, ${item.quantity - 1})">-</button>
            <button class="btn btn-sm btn-light" disabled>${item.quantity}</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="updateQty(${item.id}, ${item.quantity + 1})">+</button>
          </div>
          <button class="btn btn-sm btn-outline-danger" onclick="removeItem(${item.id})"><i class="fa fa-trash"></i></button>
        </div>
      </div>`;
  });

  cartCountEl.textContent = count;
  subtotalEl.textContent = total.toFixed(2);
}

// Quantity & Remove
window.updateQty = async function (id, newQty) {
  if (newQty <= 0) {
    await removeItem(id);
    return;
  }
  await fetch(`http://localhost:3000/cart/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: newQty })
  });
  loadCart();
};

window.removeItem = async function (id) {
  await fetch(`http://localhost:3000/cart/${id}`, { method: "DELETE" });
  loadCart();
};
