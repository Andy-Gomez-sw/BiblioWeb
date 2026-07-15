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

        const iconosTipo = { tesis: '🎓', articulo: '📄', libro: '📚', otro: '📁' };

        contenedor.innerHTML = data.documentos.map(d => `
            <div class="card-doc" onclick="window.location.href='visor.html?id=${d.id}'">
                <div class="doc-type">${iconosTipo[d.tipo] || '📄'} ${d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1)}</div>
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