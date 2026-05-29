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
    if (countDisplay) countDisplay.innerText = favorites.length;
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
   * Busca os dados do livro no arquivo JSON e gerencia o estado de carregamento
   */
  async function loadProductDetails() {
    if (!bookId) {
      renderError("Produto não encontrado.");
      return;
    }

    try {
      renderProductSkeleton();
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

          <div class="product-actions">
            <button class="btn-buy-now">${mainCtaText}</button>
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
  }

  /**
   * Renderiza livros da mesma categoria (Relacionados)
   */
  function renderRelatedBooks(currentBook, allBooks) {
    const relatedGrid = document.getElementById("related-books-grid");
    if (!relatedGrid) return;

    const related = allBooks
      .filter(b => b.categoriaTag === currentBook.categoriaTag && b.id !== currentBook.id)
      .slice(0, 4);

    if (related.length === 0) {
      document.querySelector(".related-books-section").style.display = "none";
      return;
    }

    relatedGrid.innerHTML = related.map((book, index) => {
      return `
        <article class="book-card fade-in-node" style="animation-delay: ${index * 0.1}s" onclick="window.location.href='product.html?id=${book.id}'">
            <img src="${book.imagem}" alt="${book.titulo}" class="book-cover" loading="lazy">
            <div class="book-info">
                <h3 class="book-title">${book.titulo}</h3>
                <span class="book-price">${book.preco === 0 ? "GRÁTIS" : book.preco.toFixed(2) + " MT"}</span>
            </div>
        </article>
      `;
    }).join("");
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
      btn.innerHTML = btn.innerHTML.replace(
        "Adicionar aos Favoritos",
        "Favoritado",
      );
    } else {
      favorites.splice(index, 1);
      btn.classList.remove("active");
      btn.innerHTML = btn.innerHTML.replace(
        "Favoritado",
        "Adicionar aos Favoritos",
      );
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
