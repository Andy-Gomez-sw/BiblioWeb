// ── Filtros ──
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

// ── Modal cerrar sesión ──
const modalLogout = document.getElementById('modal-logout');
const btnCerrar = document.getElementById('btn-cerrar-sesion');
const modalCancelar = document.getElementById('modal-cancelar');
const modalConfirmar = document.getElementById('modal-confirmar');

btnCerrar.addEventListener('click', () => modalLogout.classList.add('open'));
modalCancelar.addEventListener('click', () => modalLogout.classList.remove('open'));
modalLogout.addEventListener('click', e => { if (e.target === modalLogout) modalLogout.classList.remove('open'); });

modalConfirmar.addEventListener('click', () => {
    localStorage.removeItem('token_jwt');
    localStorage.removeItem('usuario_nombre');
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('usuario_genero');
    window.location.href = './login.html';
});

// ── Sesión con Mensaje Neutral ──
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token_jwt');
    const nombreGuardado = localStorage.getItem('usuario_nombre');

    if (!token) {
        window.location.href = './login.html';
        return;
    }

    // Cambia el texto dinámicamente a neutral para todos los usuarios
    const elBienvenida = document.getElementById('dash-bienvenida') || document.querySelector('.welcome-bar div p');
    if (elBienvenida) {
        elBienvenida.textContent = 'Te damos la bienvenida,';
    }

    if (nombreGuardado) {
        document.getElementById('dash-nombre').textContent = nombreGuardado;
        document.getElementById('dash-avatar').textContent = nombreGuardado.charAt(0).toUpperCase();
    } else {
        document.getElementById('dash-nombre').textContent = 'Usuario Conectado';
        document.getElementById('dash-avatar').textContent = 'U';
    }

    const genero = localStorage.getItem('usuario_genero') || '';
    const purposeTitle = document.querySelector('.purpose-title');
    if (purposeTitle) {
        purposeTitle.textContent = genero === 'F'
            ? 'Bienvenida a Biblioweb'
            : 'Bienvenido a Biblioweb';
    }

    expandiblePurpose();
    cargarEstadisticas();
});

// ── CARGAR ESTADÍSTICAS REALES DESDE LA BASE DE DATOS ──
async function cargarEstadisticas() {
    const usuarioId = localStorage.getItem('usuario_id') || '';
    if (!usuarioId) return;

    try {
        const res = await fetch(`https://bibliowebb.com.mx/assets/php/obtener_estadisticas.php?usuario_id=${encodeURIComponent(usuarioId)}`);
        const data = await res.json();

        if (data.success) {
            const subidosEl = document.getElementById('dash-subidos');
            const favoritosEl = document.getElementById('dash-favoritos');
            const consultadosEl = document.getElementById('dash-consultados');
            const subFavsEl = document.getElementById('card-sub-favs');
            const subHistEl = document.getElementById('card-sub-hist');

            if (subidosEl) subidosEl.textContent = data.subidos;
            if (favoritosEl) favoritosEl.textContent = data.favoritos;
            if (consultadosEl) consultadosEl.textContent = data.consultados;
            if (subFavsEl) subFavsEl.textContent = data.favoritos + ' guardados';
            if (subHistEl) subHistEl.textContent = data.consultados + ' consultados';
        }
    } catch (err) {
        console.error('Error cargando estadísticas:', err);
    }

    cargarVistosRecientemente();
    cargarRecomendados()
}

    // ── CARGAR "VISTOS RECIENTEMENTE" (últimos 3 documentos consultados) ──
    async function cargarVistosRecientemente() {
    const usuarioId = localStorage.getItem('usuario_id') || '';
    const contenedor = document.getElementById('dash-recientes');
    if (!usuarioId || !contenedor) return;

    try {
        const res = await fetch(`https://bibliowebb.com.mx/assets/php/obtener_historial.php?usuario_id=${encodeURIComponent(usuarioId)}`);
        const data = await res.json();

        if (!data.success || data.documentos.length === 0) {
            contenedor.innerHTML = `
                <p style="color:#8b7560;font-size:13px">
                    Todavía no has consultado ningún documento.
                </p>
            `;
            return;
        }

        const recientes = data.documentos.slice(0, 3);

        contenedor.innerHTML = recientes.map(d => `
            <div class="recent-item" style="cursor:pointer" onclick="window.location.href='visor.html?id=${d.id}'">
                <div style="flex:1">
                    <div class="recent-title">${d.titulo}</div>
                    <div class="recent-meta">${d.autor} · ${d.anio_publicacion}</div>
                </div>
                <span class="tag">${d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1)}</span>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error cargando vistos recientemente:', err);
    }
}

const ICONOS_TIPO_DASH = {
    tesis: `<svg width="14" height="14" viewBox="0 -960 960 960" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M480-144 216-276v-240L48-600l432-216 432 216v312h-72v-276l-96 48v240L480-144Zm0-321 271-135-271-135-271 135 271 135Zm0 240 192-96v-159l-192 96-192-96v159l192 96Zm0-240Zm0 81Zm0 0Z"/></svg>`,
    articulo: `<svg width="14" height="14" viewBox="0 -960 960 960" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M288-288h288v-72H288v72Zm0-156h384v-72H288v72Zm0-156h384v-72H288v72Zm-72 456q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h528q29.7 0 50.85 21.15Q816-773.7 816-744v528q0 29.7-21.15 50.85Q773.7-144 744-144H216Zm0-72h528v-528H216v528Zm0-528v528-528Z"/></svg>`,
    libro: `<svg width="14" height="14" viewBox="0 -960 960 960" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M288-96q-40 0-68-27.5T192-190v-553q0-34 22-59.5t56-32.5l354-74v626l-338.95 71.13Q277-210 270.5-203.75 264-197.5 264-190q0 10 7.2 16t16.8 6h407.55v-624H768v696H288Zm96-211 168-36v-477l-168 35v478Zm-72 15v-477l-30 6q-8 2-13 7.19T264-743v463q5-2 10.5-3t10.5-3l27-6Zm-48-469v481-481Z"/></svg>`,
    otro: `<svg width="14" height="14" viewBox="0 -960 960 960" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M168-192q-32 0-52-21.16t-20-50.88v-432.24Q96-726 116-747t52-21h216l96 96h313q31 0 50.5 21t21.5 51H451l-96-96H168v432l78-264h690l-85 285q-8 23-21 37t-38 14H168Zm75-72h538l59-192H300l-57 192Zm0 0 57-192-57 192Zm-75-336v-96 96Z"/></svg>`
};

// ── CARGAR "RECOMENDADOS" (documentos más vistos por todos los usuarios) ──
async function cargarRecomendados() {
    const contenedor = document.getElementById('dash-recomendados');
    if (!contenedor) return;

    try {
        const res = await fetch('https://bibliowebb.com.mx/assets/php/obtener_recomendados.php');
        const data = await res.json();

        if (!data.success || data.documentos.length === 0) {
            contenedor.innerHTML = `
                <p style="color:#8b7560;font-size:13px;grid-column:1/-1">
                    Aún no hay recomendaciones disponibles. Explora el catálogo para descubrir documentos.
                </p>
            `;
            return;
        }

        contenedor.innerHTML = data.documentos.map(d => `
            <div class="card-doc" onclick="window.location.href='visor.html?id=${d.id}'">
                <div class="doc-type" style="display:flex;align-items:center">${ICONOS_TIPO_DASH[d.tipo] || ICONOS_TIPO_DASH.articulo} ${d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1)}</div>
                <div class="doc-title">${d.titulo}</div>
                <div class="doc-meta">${d.autor}</div>
                <div class="doc-footer">
                    <span class="doc-year">${d.anio_publicacion}</span>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error cargando recomendados:', err);
    }
}

// ── Buscar desde el dashboard, redirige al catálogo con el término ──
window.buscarEnCatalogo = function () {
    const termino = document.getElementById('dash-search-input').value.trim();
    if (termino) {
        window.location.href = `catalogo.html?q=${encodeURIComponent(termino)}`;
    } else {
        window.location.href = 'catalogo.html';
    }
};

window.expandiblePurpose = function () {
    var btn = document.getElementById('faq-purpose-btn');
    btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
    });
}