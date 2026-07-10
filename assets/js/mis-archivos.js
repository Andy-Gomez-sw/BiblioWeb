const PHP_URL_GET = 'https://bibliowebb.com.mx/assets/php/obtener_documentos.php';
const PHP_URL_FAVS = 'https://bibliowebb.com.mx/assets/php/obtener_favoritos.php';
const PHP_URL_FAVORITO = 'https://bibliowebb.com.mx/assets/php/toggle_favorito.php';

const ICONS = {
    tesis: `<svg class="icon icon-tesis" viewBox="0 -960 960 960" width="20" height="20" fill="currentColor"><path d="M480-144 216-276v-240L48-600l432-216 432 216v312h-72v-276l-96 48v240L480-144Zm0-321 271-135-271-135-271 135 271 135Zm0 240 192-96v-159l-192 96-192-96v159l192 96Zm0-240Zm0 81Zm0 0Z"/></svg>`,
    articulo: `<svg class="icon icon-articulo" viewBox="0 -960 960 960" width="20" height="20" fill="currentColor"><path d="M288-288h288v-72H288v72Zm0-156h384v-72H288v72Zm0-156h384v-72H288v72Zm-72 456q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h528q29.7 0 50.85 21.15Q816-773.7 816-744v528q0 29.7-21.15 50.85Q773.7-144 744-144H216Zm0-72h528v-528H216v528Zm0-528v528-528Z"/></svg>`,
    libro: `<svg class="icon icon-libro" viewBox="0 -960 960 960" width="20" height="20" fill="currentColor"><path d="M288-96q-40 0-68-27.5T192-190v-553q0-34 22-59.5t56-32.5l354-74v626l-338.95 71.13Q277-210 270.5-203.75 264-197.5 264-190q0 10 7.2 16t16.8 6h407.55v-624H768v696H288Zm96-211 168-36v-477l-168 35v478Zm-72 15v-477l-30 6q-8 2-13 7.19T264-743v463q5-2 10.5-3t10.5-3l27-6Zm-48-469v481-481Z"/></svg>`,
    otro: `<svg class="icon icon-otro" viewBox="0 -960 960 960" width="20" height="20" fill="currentColor"><path d="M168-192q-32 0-52-21.16t-20-50.88v-432.24Q96-726 116-747t52-21h216l96 96h313q31 0 50.5 21t21.5 51H451l-96-96H168v432l78-264h690l-85 285q-8 23-21 37t-38 14H168Zm75-72h538l59-192H300l-57 192Zm0 0 57-192-57 192Zm-75-336v-96 96Z"/></svg>`,
    loading: `<svg class="icon icon-loading" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>`,
    check: `<svg class="icon icon-check" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    error: `<svg class="icon icon-error" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>`,
    heartOutline: `<svg class="icon icon-heart" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    heartFilled: `<svg class="icon icon-heart-filled" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`
};

let files = [];
let deleteTarget = null;
let favoritosIds = new Set();

document.addEventListener('DOMContentLoaded', () => {
    // Sincronizar Avatar con el flujo del localStorage
    const nombreGuardado = localStorage.getItem('usuario_nombre');
    const avatar = document.getElementById("global-avatar");
    if (nombreGuardado && avatar) {
        avatar.textContent = nombreGuardado.charAt(0).toUpperCase();
    }

    cargarFavoritosIds().then(() => cargarDocumentos());
});

// ── CARGAR IDs DE FAVORITOS PRIMERO, PARA PINTAR CORAZONES LLENOS ──
async function cargarFavoritosIds() {
    const usuarioId = localStorage.getItem('usuario_id') || '';
    if (!usuarioId) return;

    try {
        const res = await fetch(`${PHP_URL_FAVS}?usuario_id=${encodeURIComponent(usuarioId)}`);
        const data = await res.json();
        if (data.success) {
            favoritosIds = new Set(data.documentos.map(d => d.id));
        }
    } catch (err) {
        console.error('Error cargando favoritos:', err);
    }
}

// ── CARGA REAL DESDE LA BASE DE DATOS ──
window.cargarDocumentos = async function () {
    const usuarioId = localStorage.getItem('usuario_id') || '';

    if (!usuarioId) {
        console.error('No hay usuario_id en localStorage.');
        window.renderFiles([]);
        return;
    }

    const container = document.getElementById('files-list');
    if (container) container.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted)">Cargando documentos...</p>';

    try {
        const res = await fetch(`${PHP_URL_GET}?usuario_id=${encodeURIComponent(usuarioId)}`);
        const data = await res.json();

        if (!data.success) {
            console.error('Error del servidor:', data.message);
            if (container) container.innerHTML = `<p style="padding:20px;text-align:center;color:#c0392b">${data.message}</p>`;
            return;
        }

        // Mapear los nombres de columnas de MySQL a lo que espera el render
        const iconos = { tesis: ICONS.tesis, articulo: ICONS.articulo, libro: ICONS.libro, otro: ICONS.otro };
        files = data.documentos.map(d => ({
            id: d.id,
            tipo: d.tipo,
            emoji: iconos[d.tipo] || ICONS.articulo,
            titulo: d.titulo,
            autor: d.autor,
            anio: d.anio_publicacion,
            size: d.tamano_archivo,
            estado: d.estado,
            nuevo: d.estado === 'pendiente',
            ruta_pdf: d.ruta_pdf
        }));

        window.renderFiles(files);

    } catch (err) {
        console.error('Error de red al cargar documentos:', err);
        if (container) container.innerHTML = `<p style="padding:20px;text-align:center;color:#c0392b">${ICONS.error} No se pudo conectar con el servidor.</p>`;
    }
};

window.statusBadge = function (f) {
    if (f.estado === 'pendiente')
        return `<span class="badge badge-amber" style="display:inline-flex;align-items:center;gap:4px">${ICONS.loading} Pendiente aprobación</span>`;
    if (f.estado === 'publicado')
        return `<span class="badge badge-green" style="display:inline-flex;align-items:center;gap:4px">${ICONS.check} Publicado</span>`;
    return `<span class="badge badge-gray">${f.estado}</span>`;
};

window.renderFiles = function (list) {
    const container = document.getElementById('files-list');
    const empty = document.getElementById('empty-files');

    if (!list.length) {
        if (container) container.innerHTML = '';
        if (empty) empty.style.display = 'block';
        window.updateCounts(list);
        return;
    }
    if (empty) empty.style.display = 'none';

    if (container) {
        container.innerHTML = list.map(f => {
            const esFav = favoritosIds.has(f.id);
            return `
            <div class="file-item" id="file-${f.id}">
              <div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;color:var(--wine,#3b1f1a)">${f.emoji}</div>
              <div class="file-info">
                <div class="file-name">${f.titulo}</div>
                <div class="file-meta">${f.autor} · ${f.anio} · ${f.size}</div>
                <div class="file-status">
                  ${f.nuevo ? '<span style="background:var(--amber);color:#fff;border-radius:999px;padding:1px 8px;font-size:10px;font-weight:600;margin-right:4px">Nuevo</span>' : ''}
                  <span style="font-size:11px;color:var(--text-muted);text-transform:capitalize">${f.tipo}</span>
                  &nbsp;·&nbsp; ${window.statusBadge(f)}
                </div>
              </div>
              <div class="file-actions">
                <button class="icon-btn" title="Favorito" onclick="toggleFavorito(${f.id}, this)" style="color:${esFav ? '#c8933a' : ''};display:inline-flex;align-items:center">
                  ${esFav ? ICONS.heartFilled : ICONS.heartOutline}
                </button>
                <button class="icon-btn" title="Vista previa" onclick="previewDoc(${f.id})">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button class="icon-btn danger" title="Eliminar" onclick="askDelete(${f.id}, '${f.titulo.replace(/'/g, "\\'")}')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>`;
        }).join('');
    }

    window.updateCounts(list);
};

// ── MARCAR / DESMARCAR FAVORITO ──
window.toggleFavorito = async function (documentoId, btnEl) {
    const usuarioId = localStorage.getItem('usuario_id') || '';
    if (!usuarioId) return;

    try {
        const formData = new FormData();
        formData.append('usuario_id', usuarioId);
        formData.append('documento_id', documentoId);

        const res = await fetch(PHP_URL_FAVORITO, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            if (data.es_favorito) {
                favoritosIds.add(documentoId);
                btnEl.innerHTML = ICONS.heartFilled;
                btnEl.style.color = '#c8933a';
            } else {
                favoritosIds.delete(documentoId);
                btnEl.innerHTML = ICONS.heartOutline;
                btnEl.style.color = '';
            }
        }
    } catch (err) {
        console.error('Error al marcar favorito:', err);
    }
};

window.updateCounts = function (list) {
    document.getElementById('count-total').textContent = files.length;
    document.getElementById('count-tesis').textContent = files.filter(f => f.tipo === 'tesis').length;
    document.getElementById('count-art').textContent = files.filter(f => f.tipo === 'articulo').length;
    document.getElementById('count-lib').textContent = files.filter(f => f.tipo === 'libro').length;
    document.getElementById('count-otro').textContent = files.filter(f => f.tipo === 'otro').length;
};

window.filterFiles = function () {
    const q = document.getElementById('file-search').value.toLowerCase();
    window.renderFiles(files.filter(f => !q || f.titulo.toLowerCase().includes(q) || f.autor.toLowerCase().includes(q)));
};

window.previewDoc = function (id) {
    window.location.href = `visor.html?id=${id}`;
};

window.askDelete = function (id, name) {
    deleteTarget = id;
    document.getElementById('delete-doc-name').textContent = `"${name}" será eliminado permanentemente.`;
    document.getElementById('delete-modal').classList.add('show');
};

window.closeDelete = function () {
    deleteTarget = null;
    document.getElementById('delete-modal').classList.remove('show');
};

window.confirmDelete = async function () {
    if (deleteTarget === null) return;

    const usuarioId = localStorage.getItem('usuario_id') || '';
    const PHP_URL_DELETE = 'https://bibliowebb.com.mx/assets/php/eliminar_documento.php';

    try {
        const formData = new FormData();
        formData.append('id', deleteTarget);
        formData.append('usuario_id', usuarioId);

        const res = await fetch(PHP_URL_DELETE, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            files = files.filter(f => f.id !== deleteTarget);
            window.filterFiles();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        console.error('Error al eliminar:', err);
        alert('Error de conexión al intentar eliminar el documento.');
    } finally {
        window.closeDelete();
    }
};