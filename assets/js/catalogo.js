const PHP_URL_CATALOGO = 'https://bibliowebb.com.mx/obtener_catalogo.php';

let docs = [];
let activeFilter = 'todo';
const DOCS_PER_PAGE = 12;
let currentPage = 1;
let currentList = [];

document.addEventListener('DOMContentLoaded', () => {
    ajustarNavbarSegunSesion();
    cargarCatalogo();
});

// ── Ajustar navbar/banner según si hay sesión o es invitado ──
function ajustarNavbarSegunSesion() {
    const usuarioId = localStorage.getItem('usuario_id') || '';
    const nombreGuardado = localStorage.getItem('usuario_nombre');
    const navbarActions = document.getElementById('navbar-actions');
    const guestBanner = document.getElementById('guest-banner');

    if (usuarioId) {
        // Usuario registrado: ocultar banner de invitado y cambiar el navbar
        if (guestBanner) guestBanner.style.display = 'none';
        if (navbarActions) {
            navbarActions.innerHTML = `
                <button class="nav-btn" onclick="window.location.href='dashboard.html'">← Inicio</button>
                <div class="avatar" id="global-avatar">${(nombreGuardado || 'U').charAt(0).toUpperCase()}</div>
            `;
        }
    }
    // Si no hay usuario_id, se queda tal cual (modo explorador + banner visible)
}

// ── CARGA REAL DESDE LA BASE DE DATOS ──
async function cargarCatalogo() {
    const grid = document.getElementById('results-grid');
    if (grid) grid.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted)">Cargando catálogo...</p>';

    try {
        const res = await fetch(PHP_URL_CATALOGO);
        const data = await res.json();

        if (!data.success) {
            if (grid) grid.innerHTML = `<p style="padding:20px;text-align:center;color:#c0392b">${data.message}</p>`;
            return;
        }

        const iconos = { tesis: '🎓', articulo: '📄', libro: '📚' };
        docs = data.documentos.map(d => ({
            id: d.id,
            tipo: d.tipo,
            icon: iconos[d.tipo] || '📄',
            titulo: d.titulo,
            autor: d.autor,
            anio: d.anio_publicacion
        }));

        // Actualizar contadores reales de "Colecciones disponibles"
        const c = data.conteo;
        const elTesis = document.getElementById('count-tesis');
        const elArt = document.getElementById('count-articulo');
        const elLib = document.getElementById('count-libro');
        if (elTesis) elTesis.textContent = c.tesis + ' documentos';
        if (elArt) elArt.textContent = c.articulo + ' publicaciones';
        if (elLib) elLib.textContent = c.libro + ' títulos';

        // Si venimos de una búsqueda desde el dashboard (?q=...), precargar el término
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) {
            document.getElementById('search-input').value = q;
        }

        filterDocs();

    } catch (err) {
        console.error('Error cargando catálogo:', err);
        if (grid) grid.innerHTML = '<p style="padding:20px;text-align:center;color:#c0392b">❌ No se pudo conectar con el servidor.</p>';
    }
}

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
    const sortSelect = document.querySelector('.sort-select');
    const sortVal = sortSelect ? sortSelect.value : 'reciente';

    let filtered = docs.filter(d => {
        const matchFilter = activeFilter === 'todo' || d.tipo === activeFilter;
        const matchSearch = !q || d.titulo.toLowerCase().includes(q) || d.autor.toLowerCase().includes(q) || String(d.anio).includes(q);
        return matchFilter && matchSearch;
    });

    filtered.sort((a, b) => {
        if (sortVal === 'reciente') return b.anio - a.anio;
        if (sortVal === 'antiguo')  return a.anio - b.anio;
        if (sortVal === 'titulo')   return a.titulo.localeCompare(b.titulo, 'es');
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

    title.textContent = q ? 'Resultados de búsqueda' : 'Documentos recientes';
    count.textContent = list.length + ' documento' + (list.length !== 1 ? 's' : '');

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
    const usuarioId = localStorage.getItem('usuario_id') || '';

    grid.innerHTML = paginated.map(d => `
        <div class="card-doc-list" onclick="abrirDocumento(${d.id})">
          <div class="doc-type">${d.icon} ${capitalize(d.tipo)}</div>
          <div class="doc-title">${d.titulo}</div>
          <div class="doc-meta">${d.autor}</div>
          <div class="doc-footer">
            <span class="doc-year">${d.anio}</span>
            <button class="icon-btn" title="Vista previa" onclick="event.stopPropagation(); abrirDocumento(${d.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>`).join('');

    renderPagination(currentList.length);
}

// ── Al abrir un documento: si hay sesión, va al visor; si es invitado, lo manda a iniciar sesión ──
window.abrirDocumento = function(id) {
    const usuarioId = localStorage.getItem('usuario_id') || '';
    if (usuarioId) {
        window.location.href = `visor.html?id=${id}`;
    } else {
        window.location.href = 'login.html';
    }
};

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
        for (let i = 1; i <= totalPages; i++) pages += pageBtn(i, i === currentPage);
    } else if (currentPage <= 3) {
        pages += pageBtn(1, currentPage === 1);
        pages += pageBtn(2, currentPage === 2);
        pages += pageBtn(3, currentPage === 3);
        pages += `<span class="page-dots">…</span>`;
        pages += pageBtn(totalPages, currentPage === totalPages);
    } else if (currentPage >= totalPages - 2) {
        pages += pageBtn(1, currentPage === 1);
        pages += `<span class="page-dots">…</span>`;
        pages += pageBtn(totalPages - 2, currentPage === totalPages - 2);
        pages += pageBtn(totalPages - 1, currentPage === totalPages - 1);
        pages += pageBtn(totalPages, currentPage === totalPages);
    } else {
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

function goToPage(page) {
    const totalPages = Math.ceil(currentList.length / DOCS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderPage();
    document.getElementById('results-grid').scrollIntoView({ behavior: 'smooth' });
}