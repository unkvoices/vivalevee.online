/**
 * Viva Leve - Lógica Principal (Catálogo, Filtros e Newsletter)
 */
let allBooks = [];
let favorites = JSON.parse(localStorage.getItem("vivaLeveFavorites")) || [];

const categoryMap = {
  alimentacao: "Alimentação Saudável",
  conto: "Conto",
  romance: "Romance",
  mental: "Saúde Mental & Emocional",
  fantasias: "Ficção & Fantasias",
};

const booksGrid = document.getElementById("books-grid");
const favoritesCountDisplay = document.getElementById("favorites-count");
const filterLinks = document.querySelectorAll(".category-link");
const mobileFilter = document.getElementById("mobile-category-filter");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

/**
 * Inicializa a aplicação, carregando os dados do JSON e tratando skeletons
 */
async function init() {
  try {
    renderSkeletons(); // Mostra o loading antes do fetch
    const response = await fetch("./frontend/json/livros.json");
    allBooks = await response.json();

    // Simulando um pequeno delay para que o skeleton seja visível (opcional)
    setTimeout(() => {
      renderBooks(allBooks);
      updateFavoritesUI();
    }, 800);
  } catch (error) {
    console.error("Erro ao carregar livros:", error);
    booksGrid.innerHTML = `<p>Erro ao carregar o catálogo. Tente novamente mais tarde.</p>`;
  }
}

/**
 * Renderiza os cartões de carregamento visual
 */
function renderSkeletons() {
  const skeletons = Array(4)
    .fill(0)
    .map(
      () => `
    <div class="book-card skeleton-card">
      <div class="skeleton skeleton-cover"></div>
      <div class="book-info">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-author"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>
    </div>
  `,
    )
    .join("");
  booksGrid.innerHTML = skeletons;
}

/**
 * Renderiza a grade de livros dinamicamente
 * @param {Array} books
 */
function renderBooks(books) {
  booksGrid.innerHTML = books
    .map((book, index) => {
      const isFav = favorites.some((fav) => fav.id === book.id);
      return `
        <article class="book-card fade-in-node" style="animation-delay: ${index * 0.05}s" data-category="${book.categoria}" onclick="window.location.href='frontend/pages/product.html?id=${book.id}'">
            <img src="${book.imagem}" alt="${book.titulo}" class="book-cover" loading="lazy">
            <div class="book-info">
                <h3 class="book-title">${book.titulo}</h3>
                <span class="book-price">${book.preco === 0 ? "Grátis" : book.preco.toFixed(2) + " MT"}</span>
            </div>
            <button class="btn-favorite ${isFav ? "active" : ""}" onclick="addToFavorites(event, ${book.id})" aria-label="Adicionar aos favoritos">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="heart-icon">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
        </article>
    `;
    })
    .join("");
}

/**
 * Adiciona ou remove um livro dos favoritos via clique no ícone de coração
 * @param {Event} event
 * @param {number} id
 */
window.addToFavorites = (event, id) => {
  // Impede que o clique no botão de favorito dispare o clique do card (redirecionamento)
  event.stopPropagation();

  const book = allBooks.find((b) => b.id === id);
  if (!book) return;

  const index = favorites.findIndex((fav) => fav.id === id);
  const btn = event.currentTarget;

  if (index === -1) {
    favorites.push(book);
    btn.classList.add("active");
  } else {
    favorites.splice(index, 1);
    btn.classList.remove("active");
  }

  localStorage.setItem("vivaLeveFavorites", JSON.stringify(favorites));
  updateFavoritesUI();
};

/**
 * Atualiza o contador de favoritos no cabeçalho
 */
function updateFavoritesUI() {
  favoritesCountDisplay.innerText = favorites.length;
}

/**
 * Executa a lógica de filtragem por texto
 */
function handleSearch() {
  const query = searchInput.value.toLowerCase().trim();

  if (query === "") {
    renderBooks(allBooks);
    return;
  }

  const filtered = allBooks.filter(
    (book) =>
      book.titulo.toLowerCase().includes(query) ||
      book.autor.toLowerCase().includes(query) ||
      book.categoria.toLowerCase().includes(query),
  );

  renderBooks(filtered);
}

// Listeners para Pesquisa
searchBtn?.addEventListener("click", handleSearch);
searchInput?.addEventListener("keyup", (e) => {
  if (e.key === "Enter") handleSearch();
});

/**
 * Filtra os livros baseando-se na tagId
 * @param {string} tag
 */
function applyFilter(tag) {
  const filtered =
    tag === "all"
      ? allBooks
      : allBooks.filter((book) => book.categoriaTag === tag);

  renderBooks(filtered);
}

// Eventos para Filtros Desktop
filterLinks.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    filterLinks.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const tag = btn.dataset.tag;
    applyFilter(tag);
  });
});

// Evento para Filtro Mobile
mobileFilter?.addEventListener("change", (e) => {
  const category = e.target.value;
  applyFilter(category);
});

/**
 * Lógica de Header Sticky (Revelar ao subir o scroll)
 */
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

/**
 * Gera o efeito de confetti usando a API de Canvas
 */
function startConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles = [];
  const colors = ["#f1c40f", "#ff8c00", "#0070f3", "#ffffff"];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 7 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 3 + 2,
      angle: Math.random() * 6.28,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      p.y += p.speed;
      p.x += Math.sin(p.angle) * 2;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      if (p.y > canvas.height) particles[i].y = -20;
    });
    requestAnimationFrame(draw);
  }
  draw();
  setTimeout(() => {
    canvas.style.display = "none";
  }, 4000);
}

// 6. Newsletter & Modal Logic
document.addEventListener("DOMContentLoaded", () => {
  // Newsletter
  const newsletterForm = document.getElementById("newsletter-form");
  const newsletterEmail = document.getElementById("newsletter-email");
  const newsletterError = document.getElementById("newsletter-error");

  // Validação em tempo real
  newsletterEmail?.addEventListener("input", (e) => {
    const email = e.target.value;
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (email.length > 0 && !isValid) {
      newsletterEmail.classList.add("invalid");
      newsletterError.style.display = "block";
    } else {
      newsletterEmail.classList.remove("invalid");
      newsletterError.style.display = "none";
    }
  });

  newsletterForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = newsletterEmail.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    const container = document.querySelector(".newsletter-container");
    container.innerHTML = `
      <div class="success-message">
        <i class="ph ph-check-circle"></i>
        <h2 class="poppins-bold">Obrigado!</h2>
        <p>A sua inscrição foi realizada com sucesso. Em breve receberá as nossas novidades.</p>
      </div>
    `;

    startConfetti();
  });

  // Modal Política de Privacidade
  const modal = document.getElementById("privacy-modal");
  const openBtn = document.getElementById("open-privacy");
  const closeBtn = document.querySelector(".close-modal");

  openBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Trava o scroll do fundo
  });

  const closeModal = () => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  };

  closeBtn?.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
});

init();
