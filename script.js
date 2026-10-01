// --- ESTADO DA APLICAÇÃO ---
let books = JSON.parse(localStorage.getItem('@BookManager:data')) || [];
let editingId = null;

// --- ELEMENTOS DO DOM ---
const booksGrid = document.getElementById('booksGrid');
const bookModal = document.getElementById('bookModal');
const bookForm = document.getElementById('bookForm');
const modalTitle = document.getElementById('modalTitle');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');

const starRatingInput = document.getElementById('starRatingInput');
const ratingInput = document.getElementById('rating');
const btnClearRating = document.getElementById('btnClearRating');

// Elementos do preenchimento automático
const autoFillInput = document.getElementById('autoFillInput');
const btnAutoFill = document.getElementById('btnAutoFill');
const amazonStatus = document.getElementById('amazonStatus');

// Ícones SVG exatos do Figma
const starOutlineSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
const starFilledSVG = `<svg class="filled" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
const pencilSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path><line x1="14" y1="6" x2="18" y2="10"></line></svg>`;
const trashSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
const defaultBookSVG = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`;

// --- SEGURANÇA: escapa texto antes de usar em innerHTML ---
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// --- INICIALIZAR ESTRELAS NO FORMULÁRIO ---
function initFormStars() {
    starRatingInput.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('div');
        star.innerHTML = starOutlineSVG;
        star.dataset.value = i;
        star.addEventListener('click', () => {
            ratingInput.value = i;
            updateFormStars(i);
        });
        starRatingInput.appendChild(star);
    }
}
initFormStars();

function updateFormStars(value) {
    const stars = starRatingInput.children;
    for (let i = 0; i < stars.length; i++) {
        stars[i].innerHTML = (i < value) ? starFilledSVG : starOutlineSVG;
    }
}

btnClearRating.addEventListener('click', () => {
    ratingInput.value = 0;
    updateFormStars(0);
});

// --- PREENCHIMENTO AUTOMÁTICO (Google Books API) ---
function setStatus(message, color) {
    amazonStatus.textContent = message;
    amazonStatus.style.color = color;
}

// Descobre ISBN e/ou título a partir do que foi colado
function parseAutoFillInput(text) {
    // Link da Amazon: tenta ISBN (/dp/ISBN10) e também o título que vem na URL
    if (text.includes('amazon')) {
        const result = {};
        const asin = text.match(/\/(?:dp|gp\/product)\/(\d{9}[\dX])/i);
        if (asin) result.isbn = asin[1].toUpperCase();
        try {
            const slug = new URL(text).pathname.split('/')[1];
            if (slug && !['dp', 'gp'].includes(slug)) {
                result.title = decodeURIComponent(slug).replace(/-/g, ' ');
            }
        } catch (e) {
            // URL inválida: segue só com o que já foi extraído
        }
        return result;
    }

    // Outro link (ex.: amzn.to encurtado): não dá para resolver no navegador
    if (/^https?:\/\//i.test(text)) return {};

    // ISBN digitado direto (10 ou 13 dígitos)
    const digits = text.replace(/[-\s]/g, '');
    if (/^(\d{13}|\d{9}[\dX])$/i.test(digits)) return { isbn: digits.toUpperCase() };

    // Texto livre = título
    return { title: text };
}

function isbn10to13(isbn10) {
    const core = '978' + isbn10.slice(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(core[i]) * (i % 2 === 0 ? 1 : 3);
    return core + ((10 - (sum % 10)) % 10);
}

// Opcional: chave gratuita da Google Books API (evita o limite de uso sem chave)
const GOOGLE_BOOKS_KEY = '';

async function fetchJson(url) {
    const host = new URL(url).hostname;
    let res;
    try {
        res = await fetch(url);
    } catch (e) {
        throw new Error(`${host}: ${e.message}`); // rede, bloqueio, CORS, extensão...
    }
    if (!res.ok) throw new Error(`${host}: HTTP ${res.status}`);
    return res.json();
}

// --- Fontes de dados ---
async function searchGoogleBooks(q) {
    const keyParam = GOOGLE_BOOKS_KEY ? `&key=${GOOGLE_BOOKS_KEY}` : '';
    const data = await fetchJson(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1${keyParam}`
    );
    const info = data.items?.[0]?.volumeInfo;
    if (!info) return null;
    return {
        title: info.title || '',
        author: (info.authors || []).join(', '),
        cover: (info.imageLinks?.thumbnail || '').replace('http://', 'https://')
    };
}

async function searchOpenLibraryByIsbn(isbn) {
    const data = await fetchJson(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );
    const book = data[`ISBN:${isbn}`];
    if (!book) return null;
    return {
        title: book.title || '',
        author: (book.authors || []).map(a => a.name).join(', '),
        cover: book.cover?.large || book.cover?.medium || ''
    };
}

async function searchOpenLibraryByTitle(title) {
    const data = await fetchJson(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1&fields=title,author_name,cover_i`
    );
    const doc = data.docs?.[0];
    if (!doc) return null;
    return {
        title: doc.title || '',
        author: (doc.author_name || []).join(', '),
        cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : ''
    };
}

async function handleAutoFill() {
    const input = autoFillInput.value.trim();
    const { isbn, title } = parseAutoFillInput(input);

    if (!isbn && !title) {
        setStatus('Cole um link da Amazon (completo), ISBN ou título.', 'var(--red-bright)');
        return;
    }

    setStatus('A procurar...', 'var(--gray-400)');

    // Lista de tentativas, da mais precisa para a mais genérica
    const attempts = [];
    if (isbn) {
        const isbn13 = isbn.length === 10 ? isbn10to13(isbn) : isbn;
        attempts.push(() => searchGoogleBooks(`isbn:${isbn}`));
        if (isbn13 !== isbn) attempts.push(() => searchGoogleBooks(`isbn:${isbn13}`));
        attempts.push(() => searchOpenLibraryByIsbn(isbn13));
        attempts.push(() => searchOpenLibraryByIsbn(isbn));
    }
    if (title) {
        // Títulos de URL da Amazon vêm "sujos" (ex.: "Orgulho Preconceito especial marcador páginas").
        // Por isso tenta o texto completo e depois versões cada vez mais curtas.
        const words = title.split(/\s+/).filter(Boolean);
        const sizes = [...new Set([words.length, 4, 3, 2])]
            .filter(n => n <= words.length && n >= Math.min(2, words.length))
            .sort((a, b) => b - a);
        const shortest = words.slice(0, sizes[sizes.length - 1]).join(' ');

        attempts.push(() => searchGoogleBooks(`intitle:${title}`));
        sizes.forEach(n => {
            const partial = words.slice(0, n).join(' ');
            attempts.push(() => searchGoogleBooks(partial));
        });
        attempts.push(() => searchOpenLibraryByTitle(title));
        if (shortest !== title) attempts.push(() => searchOpenLibraryByTitle(shortest));
    }

    let result = null;
    let failures = 0;
    let lastError = '';

    for (const attempt of attempts) {
        try {
            result = await attempt();
            if (result) break;
        } catch (error) {
            failures++;
            lastError = error.message;
            console.warn('Tentativa falhou:', error.message);
        }
    }

    if (!result) {
        // Se todas as tentativas deram erro, o problema é de rede/limite da API
        const msg = failures === attempts.length
            ? `Falha na busca (${lastError}). Preencha manualmente.`
            : 'Livro não encontrado. Preencha manualmente.';
        setStatus(msg, 'var(--red-bright)');
        return;
    }

    document.getElementById('title').value = result.title;
    document.getElementById('author').value = result.author;
    document.getElementById('coverUrl').value = result.cover;

    setStatus('✓ Dados preenchidos!', 'var(--green-base)');
    setTimeout(() => { amazonStatus.textContent = ''; }, 3000);
}

btnAutoFill.addEventListener('click', handleAutoFill);
autoFillInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // evita enviar o formulário
        handleAutoFill();
    }
});

// --- EVENTOS DE MODAL E FILTROS ---
document.getElementById('btnNewBook').addEventListener('click', () => openModal());
document.getElementById('btnCloseModal').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
bookForm.addEventListener('submit', handleFormSubmit);
searchInput.addEventListener('input', renderBooks);
filterStatus.addEventListener('change', renderBooks);

// --- FUNÇÕES DO MODAL ---
function openModal(id = null) {
    bookForm.reset();
    initFormStars();
    ratingInput.value = 0;

    // Limpa o estado do preenchimento automático
    amazonStatus.textContent = '';
    autoFillInput.value = '';

    if (id) {
        const book = books.find(b => b.id === id);
        editingId = book.id;
        modalTitle.textContent = 'Editar Livro';
        document.getElementById('btnSubmit').textContent = 'Atualizar';

        document.getElementById('title').value = book.title;
        document.getElementById('author').value = book.author;
        document.getElementById('coverUrl').value = book.coverUrl;
        document.getElementById('status').value = book.status;
        document.getElementById('comment').value = book.comment;

        ratingInput.value = book.rating;
        updateFormStars(book.rating);
    } else {
        editingId = null;
        modalTitle.textContent = 'Adicionar Livro';
        document.getElementById('btnSubmit').textContent = 'Adicionar';
    }

    bookModal.showModal();
}

function closeModal() {
    bookModal.close();
    bookForm.reset();
}

// --- CRUD ---
function handleFormSubmit(e) {
    e.preventDefault();

    const bookData = {
        id: editingId || crypto.randomUUID(),
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        coverUrl: document.getElementById('coverUrl').value,
        status: document.getElementById('status').value,
        rating: parseInt(ratingInput.value) || 0,
        comment: document.getElementById('comment').value
    };

    if (editingId) {
        books = books.map(b => b.id === editingId ? bookData : b);
    } else {
        books.push(bookData);
    }

    saveData();
    closeModal();
}

function deleteBook(id) {
    if (confirm('Tem a certeza que deseja excluir este livro?')) {
        books = books.filter(b => b.id !== id);
        saveData();
    }
}

function saveData() {
    localStorage.setItem('@BookManager:data', JSON.stringify(books));
    renderBooks();
}

// --- ESTATÍSTICAS E RENDERIZAÇÃO ---
function updateStats() {
    document.getElementById('statTotal').textContent = books.length;
    document.getElementById('statQueroLer').textContent = books.filter(b => b.status === 'Quero ler').length;
    document.getElementById('statLendo').textContent = books.filter(b => b.status === 'Lendo').length;
    document.getElementById('statLidos').textContent = books.filter(b => b.status === 'Lido').length;
}

function renderBooks() {
    updateStats();

    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;

    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
                              book.author.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'Todos' || book.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    booksGrid.innerHTML = '';

    if (filteredBooks.length === 0) {
        booksGrid.innerHTML = `<div class="empty-state">Nenhum livro adicionado ainda. Comece adicionando o seu primeiro livro!</div>`;
        return;
    }

    filteredBooks.forEach(book => {
        const badgeClass = book.status === 'Quero ler' ? 'badge-quero' :
                           book.status === 'Lendo' ? 'badge-lendo' : 'badge-lido';

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += (i <= book.rating) ? starFilledSVG : starOutlineSVG;
        }

        const coverHtml = book.coverUrl
            ? `<img src="${escapeHtml(book.coverUrl)}" alt="Capa">`
            : defaultBookSVG;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-cover">
                ${coverHtml}
            </div>
            <div class="card-body">
                <h3 class="card-title">${escapeHtml(book.title)}</h3>
                <div class="card-author">${escapeHtml(book.author)}</div>
                
                <div class="card-badge-container">
                    <span class="badge ${badgeClass}">${escapeHtml(book.status)}</span>
                </div>
                
                <div class="stars-display">
                    ${starsHtml}
                </div>
                
                <div class="card-comment">${escapeHtml(book.comment)}</div>
                
                <div class="card-actions">
                    <button onclick="openModal('${book.id}')" class="btn btn-secondary">
                        ${pencilSVG}
                        Editar
                    </button>
                    <button onclick="deleteBook('${book.id}')" class="btn btn-danger">
                        ${trashSVG}
                        Excluir
                    </button>
                </div>
            </div>
        `;
        booksGrid.appendChild(card);
    });
}

// Inicializa a aplicação
window.addEventListener('DOMContentLoaded', renderBooks);
