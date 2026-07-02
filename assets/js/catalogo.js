const PHP_URL_GET = '.https://bibliowebb.com.mx/obtener_documentos_publico.php';

let docs = [];

window.cargarDocumentos = async function () {
    const container = document.getElementById('results-grid');
    if (container) container.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted)">Cargando documentos...</p>';

    try {
        const res = await fetch(PHP_URL_GET);
        const data = await res.json();

        if (!data.success) {
            console.error('Error del servidor:', data.message);
            if (container) container.innerHTML = `<p style="padding:20px;text-align:center;color:#c0392b">${data.message}</p>`;
            return;
        }

        const iconos = { tesis: '🎓', articulo: '📄', libro: '📚' };

        // Mapeo a la forma que espera filterDocs/renderDocs
        docs = data.documentos.map(d => ({
            id: d.id,
            tipo: d.tipo,
            icon: iconos[d.tipo] || '📄',
            titulo: d.titulo,
            autor: d.autor,
            anio: d.anio_publicacion,
            size: d.tamano_archivo,
            estado: d.estado,
            ruta_pdf: d.ruta_pdf
        }));

        filterDocs();

    } catch (err) {
        console.error('Error de red al cargar documentos:', err);
        if (container) container.innerHTML = '<p style="padding:20px;text-align:center;color:#c0392b">❌ No se pudo conectar con el servidor.</p>';
    }
};

document.addEventListener('DOMContentLoaded', window.cargarDocumentos);

let activeFilter = 'todo';
const DOCS_PER_PAGE = 12;
let currentPage = 1;
let currentList = [];

function setFilter(btn) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    filterDocs();
}
function setFilterById(type) {
    const btn = document.querySelector(`.filter-tab[data-filter="${type}"]`);
    if (btn) setFilter(btn);
    document.getElementById('results-grid').scrollIntoView({ behavior: 'smooth' });
}

function filterDocs() {
    const q = document.getElementById('search-input').value.toLowerCase();
    const sortVal = document.querySelector('.sort-select').value;
    let filtered = docs.filter(d => {
        const matchFilter = activeFilter === 'todo' || d.tipo === activeFilter;
        const matchSearch = !q || d.titulo.toLowerCase().includes(q) || d.autor.toLowerCase().includes(q) || String(d.anio).includes(q);
        return matchFilter && matchSearch;
    });

    filtered.sort((a, b) => {
        if (sortVal === 'reciente') return b.anio - a.anio;
        if (sortVal === 'antiguo') return a.anio - b.anio;
        if (sortVal === 'titulo') return a.titulo.localeCompare(b.titulo, 'es');
        return 0;
    });
    renderDocs(filtered);
}

function sortDocs(val) {
    filterDocs();
}

function renderDocs(list) {
    const grid = document.getElementById('results-grid');
    const empty = document.getElementById('empty-state');
    const count = document.getElementById('results-count');
    const title = document.getElementById('section-title');
    const q = document.getElementById('search-input').value.trim();

    title.textContent = q ? 'Resultados de búsqueda' : 'Vistos recientemente';
    count.textContent = list.length + ' documento' + (list.length !== 1 ? 's' : '');

    // Empty state
    if (!list.length) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        renderPagination(0);
        return;
    }

    empty.style.display = 'none';
    currentList = list;
    currentPage = 1;
    renderPage();
}

function renderPage() {
    const grid = document.getElementById('results-grid');
    const start = (currentPage - 1) * DOCS_PER_PAGE;
    const paginated = currentList.slice(start, start + DOCS_PER_PAGE);

    grid.innerHTML = paginated.map(d => `
        <div class="card-doc-list" onclick="window.location.href='login.html'">
          <div class="doc-type">${d.icon} ${capitalize(d.tipo)}</div>
          <div class="doc-title">${d.titulo}</div>
          <div class="doc-meta">${d.autor}</div>
          <div class="doc-footer">
            <span class="doc-year">${d.anio}</span>
            <button class="icon-btn" title="Vista previa" onclick="event.stopPropagation()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>`).join('');

    renderPagination(currentList.length);
}

function renderPagination(total) {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.ceil(total / DOCS_PER_PAGE);

    if (totalPages <= 1) {
        container.innerHTML = `
            <button class="page-btn arrow" disabled>‹</button>
            <button class="page-btn active">1</button>
            <button class="page-btn arrow" disabled>›</button>
        `;
        return;
    }

    const prev = currentPage === 1 ? 'disabled' : '';
    const next = currentPage === totalPages ? 'disabled' : '';

    function pageBtn(n, active = false) {
        return `<button class="page-btn${active ? ' active' : ''}" onclick="goToPage(${n})">${n}</button>`;
    }

    let pages = '';

    if (totalPages <= 5) {
        // Pocas páginas: mostrar todas
        for (let i = 1; i <= totalPages; i++) pages += pageBtn(i, i === currentPage);

    } else if (currentPage <= 3) {
        // Inicio: 1 2 3 ... 12
        pages += pageBtn(1, currentPage === 1);
        pages += pageBtn(2, currentPage === 2);
        pages += pageBtn(3, currentPage === 3);
        pages += `<span class="page-dots">…</span>`;
        pages += pageBtn(totalPages, currentPage === totalPages);

    } else if (currentPage >= totalPages - 2) {
        // Final: 1 ... 10 11 12
        pages += pageBtn(1, currentPage === 1);
        pages += `<span class="page-dots">…</span>`;
        pages += pageBtn(totalPages - 2, currentPage === totalPages - 2);
        pages += pageBtn(totalPages - 1, currentPage === totalPages - 1);
        pages += pageBtn(totalPages, currentPage === totalPages);

    } else {
        // Medio: 1 ... 4 5 6 ... 12
        pages += pageBtn(1, false);
        pages += `<span class="page-dots">…</span>`;
        pages += pageBtn(currentPage - 1, false);
        pages += pageBtn(currentPage, true);
        pages += pageBtn(currentPage + 1, false);
        pages += `<span class="page-dots">…</span>`;
        pages += pageBtn(totalPages, false);
    }

    container.innerHTML = `
        <button class="page-btn arrow" ${prev} onclick="goToPage(${currentPage - 1})">‹</button>
        ${pages}
        <button class="page-btn arrow" ${next} onclick="goToPage(${currentPage + 1})">›</button>
    `;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// Pagination buttons
document.querySelectorAll('.page-btn:not(.arrow)').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.page-btn:not(.arrow)').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

function goToPage(page) {
    const totalPages = Math.ceil(currentList.length / DOCS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderPage();
    document.getElementById('results-grid').scrollIntoView({ behavior: 'smooth' });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }