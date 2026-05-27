let allBooks = [];
let cart = JSON.parse(localStorage.getItem('vivaLeveCart')) || [];

const booksGrid = document.getElementById('books-grid');
const cartCountDisplay = document.getElementById('cart-count');
const filterButtons = document.querySelectorAll('.filter-btn');

// 1. Fetch & Initialize
async function init() {
    try {
        const response = await fetch('./frontend/json/livros.json');
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
    booksGrid.innerHTML = books.map(book => `
        <article class="book-card" data-category="${book.categoria}">
            <img src="${book.imagem}" alt="${book.titulo}" class="book-cover" loading="lazy">
            <div class="book-info">
                <h3 class="book-title">${book.titulo}</h3>
                <p class="book-author">${book.autor}</p>
                <span class="book-price">${book.preco.toFixed(2)} MT</span>
                <button class="add-btn" onclick="addToCart(${book.id})">Adicionar</button>
            </div>
        </article>
    `).join('');
}

// 3. Lógica do Carrinho
window.addToCart = (id) => {
    const book = allBooks.find(b => b.id === id);
    if (book) {
        cart.push(book);
        localStorage.setItem('vivaLeveCart', JSON.stringify(cart));
        updateCartUI();
        
        // Feedback simples
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
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const category = btn.dataset.category;
        const filtered = category === 'all' 
            ? allBooks 
            : allBooks.filter(b => b.category === category || b.categoria === category);
        renderBooks(filtered);
    });
});

init();