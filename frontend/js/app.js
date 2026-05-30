/**
 * Viva Leve - Lógica Principal (Catálogo, Filtros e Newsletter)
 */
import { auth, db, analytics } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let allBooks = [];
let favorites = JSON.parse(localStorage.getItem("vivaLeveFavorites")) || [];
let currentUser = null;

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

// Listener de Autenticação
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists() && docSnap.data().favorites) {
      favorites = docSnap.data().favorites;
      localStorage.setItem("vivaLeveFavorites", JSON.stringify(favorites));
      updateFavoritesUI();
      renderBooks(allBooks);
    }
  }
});

/**
 * Inicializa a aplicação, carregando os dados do JSON e tratando skeletons
 */
async function init() {
  try {
    renderSkeletons(); // Mostra o loading antes do fetch

    // Busca do Firestore em vez do JSON
    const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    allBooks = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (allBooks.length === 0) {
      booksGrid.innerHTML = `<p class="empty-msg">O catálogo está vazio. Adicione livros pelo painel de administrador.</p>`;
      return;
    }

    // Simulando um pequeno delay para que o skeleton seja visível (opcional)
    setTimeout(() => {
      changeBackgroundByCategory("all"); // Aplica cor de fundo padrão
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
 * Muda a cor de fundo baseado na categoria
 * @param {string} category
 */
function changeBackgroundByCategory(category) {
  // Remove todas as classes de categoria
  document.body.classList.remove(
    "category-all",
    "category-alimentacao",
    "category-conto",
    "category-romance",
    "category-mental",
    "category-fantasias",
  );

  // Adiciona a classe da categoria selecionada
  document.body.classList.add(`category-${category}`);
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
        <article class="book-card fade-in-node" style="animation-delay: ${index * 0.05}s" data-category="${book.categoriaTag}" onclick="window.location.href='frontend/pages/product.html?id=${book.id}'">
            <div style="position: relative;">
              <img src="${book.imagem}" alt="${book.titulo}" class="book-cover" loading="lazy" onload="this.classList.add('img-loaded')">
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.titulo}</h3>
                <span class="book-price">${book.preco === 0 ? "Grátis" : book.preco.toFixed(2) + " MT"}</span>
            </div>
            <button class="btn-favorite ${isFav ? "active" : ""}" onclick="addToFavorites(event, '${book.id}')" aria-label="Adicionar aos favoritos">
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
window.addToFavorites = async (event, id) => {
  // Impede que o clique no botão de favorito dispare o clique do card (redirecionamento)
  event.stopPropagation();

  const book = allBooks.find((b) => b.id === id);
  if (!book) return;

  const index = favorites.findIndex((fav) => fav.id === id);
  const btn = event.currentTarget;

  if (index === -1) {
    favorites.push(book);
    btn.classList.add("active");
    triggerCounterAnimation();
    openFavoritesDrawer();
  } else {
    favorites.splice(index, 1);
    btn.classList.remove("active");
  }

  localStorage.setItem("vivaLeveFavorites", JSON.stringify(favorites));

  if (currentUser) {
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, { favorites: favorites });
  }

  updateFavoritesUI();
};

window.clearAllFavorites = () => {
  favorites = [];
  localStorage.setItem("vivaLeveFavorites", JSON.stringify(favorites));
  updateFavoritesUI();
  renderFavoritesDrawer();
  renderBooks(allBooks);
};

/**
 * Lógica do Drawer de Favoritos
 */
function openFavoritesDrawer() {
  renderFavoritesDrawer();
  document.getElementById("favorites-drawer").classList.add("open");
  document.getElementById("drawer-overlay").style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeFavoritesDrawer() {
  document.getElementById("favorites-drawer").classList.remove("open");
  document.getElementById("drawer-overlay").style.display = "none";
  document.body.style.overflow = "auto";
}

function renderFavoritesDrawer() {
  const content = document.getElementById("drawer-content");
  if (!content) return;

  if (favorites.length === 0) {
    content.innerHTML = `<p class="empty-drawer-msg">Ainda não tens livros nos teus favoritos.</p>`;
    return;
  }

  content.innerHTML =
    `
    <div class="drawer-actions">
      <button class="btn-clear-all" onclick="clearAllFavorites()">Limpar Tudo</button>
    </div>
  ` +
    favorites
      .map(
        (book) => `
    <div class="drawer-item">
      <div class="drawer-item-clickable" onclick="window.location.href='frontend/pages/product.html?id=${book.id}'">
        <img src="${book.imagem}" alt="${book.titulo}">
        <div class="drawer-item-info">
          <span class="drawer-item-title">${book.titulo}</span>
          <span class="drawer-item-author">${book.autor}</span>
        </div>
      </div>
      <button class="btn-remove-fav" onclick="removeFromDrawer('${book.id}')">Remover</button>
    </div>
  `,
      )
      .join("");
}

window.removeFromDrawer = (id) => {
  favorites = favorites.filter((fav) => fav.id !== id);
  localStorage.setItem("vivaLeveFavorites", JSON.stringify(favorites));
  updateFavoritesUI();
  renderFavoritesDrawer();
  renderBooks(allBooks); // Sincroniza os corações na grade
};

document
  .getElementById("close-drawer")
  ?.addEventListener("click", closeFavoritesDrawer);
document
  .getElementById("drawer-overlay")
  ?.addEventListener("click", closeFavoritesDrawer);
document
  .querySelector(".wishlist-counter-container")
  ?.addEventListener("click", openFavoritesDrawer);

/**
 * Dispara a animação visual no contador
 */
function triggerCounterAnimation() {
  if (!favoritesCountDisplay) return;
  favoritesCountDisplay.classList.remove("pulse");
  void favoritesCountDisplay.offsetWidth; // Force reflow
  favoritesCountDisplay.classList.add("pulse");
}

/**
 * Atualiza o contador de favoritos no cabeçalho
 */
function updateFavoritesUI() {
  favoritesCountDisplay.innerText = favorites.length;
  const container = document.querySelector(".wishlist-counter-container");
  container?.classList.toggle("has-items", favorites.length > 0);
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

  // Muda a cor de fundo baseado na categoria
  changeBackgroundByCategory(tag);

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
  const subscribeButton = document.getElementById("btn-newsletter-subscribe"); // Referência ao botão
  const spinner = subscribeButton?.querySelector(".spinner"); // Referência ao spinner

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

  newsletterForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = newsletterEmail.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    // 1. Mostrar estado de carregamento
    if (subscribeButton) {
      subscribeButton.disabled = true; // Desabilita o botão
      subscribeButton.classList.add("loading"); // Adiciona classe para mostrar spinner
    }

    // 2. Simular uma operação assíncrona (ex: envio para um servidor)
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simula 1.5 segundos de atraso

    const container = document.querySelector(".newsletter-container");
    container.innerHTML = `
      <div class="success-message">
        <i class="ph ph-check-circle"></i>
        <h2 class="poppins-bold">Obrigado!</h2>
        <p>A sua inscrição foi realizada com sucesso. Em breve receberá as nossas novidades.</p>
      </div>
    `;

    // 3. O estado do botão é automaticamente "resetado" porque o container é substituído.
    // Se o container não fosse substituído, seria necessário remover a classe 'loading' e reabilitar o botão aqui.

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
