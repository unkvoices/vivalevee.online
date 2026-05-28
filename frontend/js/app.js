let allBooks = [];
let cart = JSON.parse(localStorage.getItem("vivaLeveCart")) || [];

const booksGrid = document.getElementById("books-grid");
const cartCountDisplay = document.getElementById("cart-count");
const filterLinks = document.querySelectorAll(".category-link");
const mobileFilter = document.getElementById("mobile-category-filter");

// 1. Fetch & Initialize
async function init() {
  try {
    const response = await fetch("./frontend/json/livros.json");
    allBooks = await response.json();
    renderBooks(allBooks);
    updateCartUI();
  } catch (error) {
    console.error("Erro ao carregar livros:", error);
    booksGrid.innerHTML = `<p>Erro ao carregar o catálogo. Tente novamente mais tarde.</p>`;
  }
}

// 2. Renderizar Cartões
function renderBooks(books) {
  booksGrid.innerHTML = books
    .map(
      (book) => `
        <article class="book-card" data-category="${book.categoria}">
            <img src="${book.imagem}" alt="${book.titulo}" class="book-cover" loading="lazy">
            <div class="book-info">
                <h3 class="book-title">${book.titulo}</h3>
                <p class="book-author">${book.autor}</p>
                <span class="book-price">${book.preco.toFixed(2)} MT</span>
                <button class="add-btn" onclick="addToCart(event, ${book.id})">
                    <svg class="heart-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    Adicionar
                </button>
            </div>
        </article>
    `,
    )
    .join("");
}

// 3. Lógica do Carrinho
window.addToCart = (event, id) => {
  const book = allBooks.find((b) => b.id === id);
  if (book) {
    cart.push(book);
    localStorage.setItem("vivaLeveCart", JSON.stringify(cart));
    updateCartUI();

    // Feedback visual no botão
    const btn = event.target;
    btn.innerText = "Adicionado! ✓";
    btn.style.background = "var(--accent-orange)";
    setTimeout(() => {
      btn.innerText = "Adicionar";
      btn.style.background = "var(--accent-blue)";
    }, 1500);
  }
};

function updateCartUI() {
  cartCountDisplay.innerText = cart.length;
}

// 4. Filtros
function applyFilter(category) {
  const filtered =
    category === "all"
      ? allBooks
      : allBooks.filter(
          (b) => b.category === category || b.categoria === category,
        );
  renderBooks(filtered);
}

// Eventos para Filtros Desktop
filterLinks.forEach((btn) => {
  btn.addEventListener("click", () => {
    e.preventDefault();
    filterLinks.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const category = btn.dataset.category;
    applyFilter(category);
  });
});

// Evento para Filtro Mobile
mobileFilter?.addEventListener("change", (e) => {
  const category = e.target.value;
  applyFilter(category);
});

// 5. Cabeçalho Sticky (Scroll up reveal)
let lastScrollTop = 0;
const header = document.querySelector(".main-header");

window.addEventListener("scroll", () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (scrollTop > lastScrollTop && scrollTop > 100) {
    // Scrolling down - Esconder
    header.style.transform = "translateY(-100%)";
  } else {
    // Scrolling up - Mostrar
    header.style.transform = "translateY(0)";
  }
  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

init();
