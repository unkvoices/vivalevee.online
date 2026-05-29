let allBooks = [];
let cart = JSON.parse(localStorage.getItem("vivaLeveCart")) || [];

const booksGrid = document.getElementById("books-grid");
const cartCountDisplay = document.getElementById("cart-count");
const filterLinks = document.querySelectorAll(".category-link");
const mobileFilter = document.getElementById("mobile-category-filter");

// 1. Fetch & Initialize
async function init() {
  try {
    renderSkeletons(); // Mostra o loading antes do fetch
    const response = await fetch("./frontend/json/livros.json");
    allBooks = await response.json();

    // Simulando um pequeno delay para que o skeleton seja visível (opcional)
    setTimeout(() => {
      renderBooks(allBooks);
      updateCartUI();
    }, 800);
  } catch (error) {
    console.error("Erro ao carregar livros:", error);
    booksGrid.innerHTML = `<p>Erro ao carregar o catálogo. Tente novamente mais tarde.</p>`;
  }
}

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

// 2. Renderizar Cartões
function renderBooks(books) {
  booksGrid.innerHTML = books
    .map(
      (book) => `
        <article class="book-card" data-category="${book.categoria}">
            <img src="${book.imagem}" alt="${book.titulo}" class="book-cover" loading="lazy" onclick="window.location.href='#product-${book.id}'">
            <div class="book-info">
                <h3 class="book-title">${book.titulo}</h3>
                <span class="book-price">${book.preco.toFixed(2)} MT</span>
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
  btn.addEventListener("click", (e) => {
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

// 6. Confetti Logic
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
