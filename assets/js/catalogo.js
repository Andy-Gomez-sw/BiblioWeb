const PHP_URL_CATALOGO = 'https://bibliowebb.com.mx/assets/php/obtener_catalogo.php';

const ICONOS_TIPO = {
    tesis: `<svg class="icon icon-tesis" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M480-144 216-276v-240L48-600l432-216 432 216v312h-72v-276l-96 48v240L480-144Zm0-321 271-135-271-135-271 135 271 135Zm0 240 192-96v-159l-192 96-192-96v159l192 96Zm0-240Zm0 81Zm0 0Z"/></svg>`,
    articulo: `<svg class="icon icon-articulo" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M288-288h288v-72H288v72Zm0-156h384v-72H288v72Zm0-156h384v-72H288v72Zm-72 456q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h528q29.7 0 50.85 21.15Q816-773.7 816-744v528q0 29.7-21.15 50.85Q773.7-144 744-144H216Zm0-72h528v-528H216v528Zm0-528v528-528Z"/></svg>`,
    libro: `<svg class="icon icon-libro" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M288-96q-40 0-68-27.5T192-190v-553q0-34 22-59.5t56-32.5l354-74v626l-338.95 71.13Q277-210 270.5-203.75 264-197.5 264-190q0 10 7.2 16t16.8 6h407.55v-624H768v696H288Zm96-211 168-36v-477l-168 35v478Zm-72 15v-477l-30 6q-8 2-13 7.19T264-743v463q5-2 10.5-3t10.5-3l27-6Zm-48-469v481-481Z"/></svg>`,
    otro: `<svg class="icon icon-otro" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M168-192q-32 0-52-21.16t-20-50.88v-432.24Q96-726 116-747t52-21h216l96 96h313q31 0 50.5 21t21.5 51H451l-96-96H168v432l78-264h690l-85 285q-8 23-21 37t-38 14H168Zm75-72h538l59-192H300l-57 192Zm0 0 57-192-57 192Zm-75-336v-96 96Z"/></svg>`
};
const ICONO_ERROR = `<svg class="icon icon-error" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>`;

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

        docs = data.documentos.map(d => ({
            id: d.id,
            tipo: d.tipo,
            icon: ICONOS_TIPO[d.tipo] || ICONOS_TIPO.articulo,
            titulo: d.titulo,
            autor: d.autor,
            anio: d.anio_publicacion
        }));

        // Actualizar contadores reales de "Colecciones disponibles"
        const elTesis = document.getElementById('count-tesis');
        const elArt = document.getElementById('count-articulo');
        const elLib = document.getElementById('count-libro');
        const elOtro = document.getElementById('count-otro');
        if (elTesis) elTesis.textContent = c.tesis + ' documentos';
        if (elArt) elArt.textContent = c.articulo + ' publicaciones';
        if (elLib) elLib.textContent = c.libro + ' títulos';
        if (elOtro) elOtro.textContent = c.otro + ' documentos';
        if (elOtro) elOtro.textContent = c.otro + ' documentos';

        // Si venimos de una búsqueda desde el dashboard (?q=...), precargar el término
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) {
            document.getElementById('search-input').value = q;
        }

        filterDocs();

    } catch (err) {
        console.error('Error cargando catálogo:', err);
        if (grid) grid.innerHTML = `<p style="padding:20px;text-align:center;color:#c0392b">${ICONO_ERROR} No se pudo conectar con el servidor.</p>`;
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
          <div class="doc-type" style="display:flex;align-items:center;gap:6px">${d.icon} ${capitalize(d.tipo)}</div>
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
    window.location.href = `visor.html?id=${id}`;
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

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }