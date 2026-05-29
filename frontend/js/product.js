/**
 * Viva Leve - Product Details Logic
 * Renderiza dinamicamente as informações do livro baseado no ID da URL.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elementos do DOM e Estado Inicial
  const container = document.getElementById("product-details-container");
  const params = new URLSearchParams(window.location.search);
  const bookId = parseInt(params.get("id")); // Recupera o ID da URL (?id=X)

  // Recuperar favoritos do LocalStorage para consistência
  let favorites = JSON.parse(localStorage.getItem("vivaLeveFavorites")) || [];
  updateFavoritesCount();

  /**
   * Atualiza o contador de favoritos no cabeçalho
   */
  function updateFavoritesCount() {
    const countDisplay = document.getElementById("favorites-count");
    if (countDisplay) {
      countDisplay.innerText = favorites.length;
    }
  }

  function triggerCounterAnimation() {
    const countDisplay = document.getElementById("favorites-count");
    if (!countDisplay) return;
    countDisplay.classList.remove("pulse");
    void countDisplay.offsetWidth;
    countDisplay.classList.add("pulse");
  }

  /**
   * Executa a animação visual da barra de progresso no topo
   */
  function animateDownloadProgressBar() {
    let container = document.querySelector(".download-progress-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "download-progress-container";
      container.innerHTML =
        '<div class="download-progress-bar" id="download-progress-bar"></div>';
      document.body.appendChild(container);
    }

    const bar = document.getElementById("download-progress-bar");
    bar.style.opacity = "1";
    bar.style.width = "0%";

    // Sequência de animação simulada para feedback visual imediato
    setTimeout(() => (bar.style.width = "40%"), 100);
    setTimeout(() => (bar.style.width = "75%"), 500);
    setTimeout(() => (bar.style.width = "100%"), 1000);

    // Finalizar e esconder após a conclusão
    setTimeout(() => {
      bar.style.opacity = "0";
      setTimeout(() => (bar.style.width = "0%"), 300);
    }, 1500);
  }

  /**
   * Renderiza o estado de carregamento (Skeleton)
   */
  function renderProductSkeleton() {
    container.innerHTML = `
      <div class="product-page-wrapper skeleton-product">
        <div class="product-media skeleton skeleton-product-media"></div>
        <div class="product-content">
          <div class="skeleton skeleton-product-title"></div>
          <div class="skeleton skeleton-product-text" style="width: 40%"></div>
          <div class="skeleton skeleton-product-text" style="height: 60px; margin-top: 30px"></div>
          <div class="skeleton skeleton-product-text" style="margin-top: 40px"></div>
          <div class="skeleton skeleton-product-text"></div>
          <div class="skeleton skeleton-product-text" style="width: 80%"></div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza Skeletons para Livros Relacionados
   */
  function renderRelatedSkeletons() {
    const grid = document.getElementById("related-books-grid");
    if (grid) {
      grid.innerHTML = Array(4)
        .fill(0)
        .map(
          () => `
        <div class="skeleton-card">
          <div class="skeleton skeleton-related"></div>
        </div>
      `,
        )
        .join("");
    }
  }

  /**
   * Busca os dados do livro no arquivo JSON e gerencia o estado de carregamento
   */
  async function loadProductDetails() {
    if (!bookId) {
      renderError("Produto não encontrado.");
      return;
    }

    try {
      renderProductSkeleton();
      renderRelatedSkeletons();
      // Requisição dos dados do catálogo
      const response = await fetch("../json/livros.json");
      const books = await response.json();
      const book = books.find((b) => b.id === bookId);

      if (!book) {
        renderError("O livro solicitado não existe no nosso catálogo.");
        return;
      }

      // Simulação de delay para visualização do skeleton
      setTimeout(() => {
        renderProduct(book);
        renderRelatedBooks(book, books);
      }, 600);
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      renderError("Ocorreu um erro ao carregar os detalhes do produto.");
    }
  }

  /**
   * Injeta o HTML dinâmico do produto e as meta tags de SEO
   * @param {Object} book - Objeto contendo os dados do livro
   */
  function renderProduct(book) {
    // Atualização dinâmica das Meta Tags para SEO e Browser
    document.title = `${book.titulo} - Viva Leve`;

    const ogTitle = document.getElementById("og-title");
    const ogDesc = document.getElementById("og-description");
    const ogImg = document.getElementById("og-image");
    const ogUrl = document.getElementById("og-url");

    if (ogTitle) ogTitle.setAttribute("content", book.titulo);
    if (ogDesc)
      ogDesc.setAttribute("content", book.descricao || "Saúde e Bem-Estar");
    if (ogImg) ogImg.setAttribute("content", book.imagem);
    if (ogUrl) ogUrl.setAttribute("content", window.location.href);

    injectJSONLD(book);

    const isFav = favorites.some((fav) => fav.id === book.id);
    const downloadCounts =
      JSON.parse(localStorage.getItem("downloadCounts")) || {};
    const currentCount = downloadCounts[book.id] || 0;

    const formattedPrice =
      book.preco === 0 ? "DOWNLOAD GRATUITO" : `${book.preco.toFixed(2)} MT`;

    const mainCtaText = book.preco === 0 ? "DOWNLOAD GRÁTIS" : "FAZER DOWNLOAD";

    const categoriaNome = book.categoria || "Catálogo";

    container.innerHTML = `
      <div class="product-page-wrapper">
        <div class="product-media">
          <img src="${book.imagem}" alt="${book.titulo}" class="product-main-image">
        </div>
        
        <div class="product-content">
          <a href="index.html" class="btn-back">
            <i class="ph ph-arrow-left"></i> Voltar ao Catálogo
          </a>
          <nav class="breadcrumb">
            <a href="index.html">Início</a> / <span>${categoriaNome}</span>
          </nav>
          
          <h1 class="product-title poppins-bold">${book.titulo}</h1>
          <p class="product-author">Por <span>${book.autor}</span></p>
          
          <div class="product-price-row">
            <span class="product-price">${formattedPrice}</span>
            <button class="btn-favorite-large ${isFav ? "active" : ""}" id="fav-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="heart-icon">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span class="fav-text">${isFav ? "FAVORITADO" : "ADICIONAR AOS FAVORITOS"}</span>
            </button>
          </div>

          <div class="download-stats" style="font-size: 0.8rem; color: #888; margin-bottom: 20px;">
            <i class="ph ph-download-simple"></i> <span id="count-display">${currentCount}</span> downloads realizados
          </div>

          <div class="product-actions">
            <button class="btn-buy-now" id="main-download-btn">${mainCtaText}</button>
            ${book.arquivoUrl ? `<button class="btn-direct-download" id="direct-download-btn">DOWNLOAD DIRETO</button>` : ""}
            <button class="btn-share" id="share-btn">
              <i class="ph ph-share-network"></i> Partilhar
            </button>
          </div>

          <div class="product-description">
            <h2 class="poppins-semibold">Sinopse</h2>
            <p>${book.descricao || "Sem descrição disponível para este título."}</p>
          </div>
        </div>
      </div>
    `;

    // Listener para o botão de favoritos na página de detalhes
    document
      .getElementById("fav-btn")
      .addEventListener("click", (e) => toggleFavorite(e, book));

    // Listener para Partilha Nativa (Web Share API)
    document
      .getElementById("share-btn")
      .addEventListener("click", () => handleShare(book));

    // Lógica de Download e Contador
    const handleDownload = () => {
      if (book.arquivoUrl) {
        const mainBtn = document.getElementById("main-download-btn");
        const directBtn = document.getElementById("direct-download-btn");

        // Guarda os textos originais para restaurar depois
        const originalMainText = mainBtn ? mainBtn.innerText : "";
        const originalDirectText = directBtn ? directBtn.innerText : "";

        // Altera para o estado de carregamento e desativa cliques
        if (mainBtn) {
          mainBtn.innerText = "CARREGANDO...";
          mainBtn.disabled = true;
        }
        if (directBtn) {
          directBtn.innerText = "CARREGANDO...";
          directBtn.disabled = true;
        }

        // Incrementar Contador Local
        let counts = JSON.parse(localStorage.getItem("downloadCounts")) || {};
        counts[book.id] = (counts[book.id] || 0) + 1;
        localStorage.setItem("downloadCounts", JSON.stringify(counts));
        document.getElementById("count-display").innerText = counts[book.id];

        animateDownloadProgressBar();

        // Trigger Download
        const link = document.createElement("a");
        link.href = book.arquivoUrl;
        link.download = `${book.titulo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Restaura o estado original dos botões após 1.5s (fim da barra de progresso)
        setTimeout(() => {
          if (mainBtn) {
            mainBtn.innerText = originalMainText;
            mainBtn.disabled = false;
          }
          if (directBtn) {
            directBtn.innerText = originalDirectText;
            directBtn.disabled = false;
          }
        }, 1500);
      }
    };

    document
      .getElementById("main-download-btn")
      ?.addEventListener("click", handleDownload);
    document
      .getElementById("direct-download-btn")
      ?.addEventListener("click", handleDownload);
  }

  /**
   * Lógica do Drawer de Favoritos para a Página de Produto
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

  window.clearAllFavorites = () => {
    favorites = [];
    localStorage.setItem("vivaLeveFavorites", JSON.stringify(favorites));
    updateFavoritesCount();
    renderFavoritesDrawer();

    const favBtn = document.getElementById("fav-btn");
    if (favBtn) {
      favBtn.classList.remove("active");
      favBtn.querySelector(".fav-text").innerText = "ADICIONAR AOS FAVORITOS";
    }
  };

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
        <div class="drawer-item-clickable" onclick="window.location.href='product.html?id=${book.id}'">
          <img src="${book.imagem}" alt="${book.titulo}">
          <div class="drawer-item-info">
            <span class="drawer-item-title">${book.titulo}</span>
            <span class="drawer-item-author">${book.autor}</span>
          </div>
        </div>
        <button class="btn-remove-fav" onclick="removeFromDrawer(${book.id})">Remover</button>
      </div>
    `,
        )
        .join("");
  }

  window.removeFromDrawer = (id) => {
    favorites = favorites.filter((fav) => fav.id !== id);
    localStorage.setItem("vivaLeveFavorites", JSON.stringify(favorites));
    updateFavoritesCount();
    renderFavoritesDrawer();

    // Se o livro removido for o que estamos a visualizar, atualiza o botão da página
    if (bookId === id) {
      const favBtn = document.getElementById("fav-btn");
      if (favBtn) {
        favBtn.classList.remove("active");
        favBtn.querySelector(".fav-text").innerText = "ADICIONAR AOS FAVORITOS";
      }
    }
  };

  document
    .getElementById("close-drawer")
    ?.addEventListener("click", closeFavoritesDrawer);
  document
    .getElementById("drawer-overlay")
    ?.addEventListener("click", closeFavoritesDrawer);
  document
    .querySelector(".favorites-wrapper")
    ?.addEventListener("click", openFavoritesDrawer);

  /**
   * Renderiza livros da mesma categoria (Relacionados)
   */
  function renderRelatedBooks(currentBook, allBooks) {
    const relatedGrid = document.getElementById("related-books-grid");
    if (!relatedGrid) return;

    const related = allBooks
      .filter(
        (b) =>
          b.categoriaTag === currentBook.categoriaTag &&
          b.id !== currentBook.id,
      )
      .slice(0, 4);

    if (related.length === 0) {
      document.querySelector(".related-books-section").style.display = "none";
      return;
    }

    relatedGrid.innerHTML = related
      .map((book, index) => {
        return `
        <article class="book-card fade-in-node" style="animation-delay: ${index * 0.1}s" onclick="window.location.href='product.html?id=${book.id}'">
            <img src="${book.imagem}" alt="${book.titulo}" class="book-cover" loading="lazy">
            <div class="book-info">
                <h3 class="book-title">${book.titulo}</h3>
                <span class="book-price">${book.preco === 0 ? "GRÁTIS" : book.preco.toFixed(2) + " MT"}</span>
            </div>
        </article>
      `;
      })
      .join("");
  }

  /**
   * Injeta dados estruturados (JSON-LD) para otimização de Rich Snippets no Google
   * @param {Object} book
   */
  function injectJSONLD(book) {
    // Remove script anterior se existir (evita duplicados em SPAs ou navegação interna)
    const existingScript = document.getElementById("json-ld-product");
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.id = "json-ld-product";
    script.type = "application/ld+json";

    // Define a raiz do site para garantir links absolutos corretos no Breadcrumb
    const siteRoot = window.location.origin + "/";

    const bookSchema = {
      "@type": "Book",
      name: book.titulo,
      author: { "@type": "Person", name: book.autor },
      image: book.imagem,
      description: book.descricao || "Saúde e Bem-Estar",
      offers: {
        "@type": "Offer",
        price: book.preco,
        priceCurrency: "MZN",
        availability: "https://schema.org/InStock",
      },
    };

    const breadcrumbSchema = {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Início",
          item: `${siteRoot}index.html`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: book.categoria || "Catálogo",
          item: `${siteRoot}index.html?tag=${book.categoriaTag}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: book.titulo,
          item: window.location.href,
        },
      ],
    };

    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [bookSchema, breadcrumbSchema],
    });

    document.head.appendChild(script);
  }

  /**
   * Gerencia a partilha nativa (Web Share API) ou copia o link no Desktop
   * @param {Object} book
   */
  async function handleShare(book) {
    const shareData = {
      title: `Viva Leve - ${book.titulo}`,
      text: `Dá uma olhadela neste livro: "${book.titulo}" de ${book.autor}. Encontrei na Viva Leve!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback para Desktop: Copiar link e dar feedback
        await navigator.clipboard.writeText(window.location.href);
        const shareBtn = document.getElementById("share-btn");
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = '<i class="ph ph-check"></i> Link Copiado!';
        setTimeout(() => (shareBtn.innerHTML = originalText), 2000);
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("Erro ao partilhar:", err);
    }
  }

  /**
   * Alterna o estado de favorito de um livro e persiste no LocalStorage
   * @param {Event} event
   * @param {Object} book
   */
  function toggleFavorite(event, book) {
    const btn = event.currentTarget;
    const index = favorites.findIndex((fav) => fav.id === book.id);

    if (index === -1) {
      favorites.push(book);
      btn.classList.add("active");
      btn.querySelector(".fav-text").innerText = "FAVORITADO";
      triggerCounterAnimation();
      openFavoritesDrawer(); // Abre o menu automaticamente ao adicionar
    } else {
      favorites.splice(index, 1);
      btn.classList.remove("active");
      btn.querySelector(".fav-text").innerText = "ADICIONAR AOS FAVORITOS";
    }

    localStorage.setItem("vivaLeveFavorites", JSON.stringify(favorites));
    updateFavoritesCount();
  }

  /**
   * Renderiza uma mensagem de erro caso o produto não seja encontrado
   * @param {string} msg
   */
  function renderError(msg) {
    container.innerHTML = `<div class="error-state"><p>${msg}</p><a href="index.html">Voltar ao catálogo</a></div>`;
  }

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

  loadProductDetails();
});
