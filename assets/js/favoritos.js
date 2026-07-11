// ════════════════════════════════════════
//  favoritos.js
// ════════════════════════════════════════

const PHP_URL_FAVS = 'https://bibliowebb.com.mx/assets/php/obtener_favoritos.php';
const PHP_URL_FAV_TOGGLE = 'https://bibliowebb.com.mx/assets/php/toggle_favorito.php';

const ICONS = {
    tesis: `<svg class="icon icon-tesis" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M480-144 216-276v-240L48-600l432-216 432 216v312h-72v-276l-96 48v240L480-144Zm0-321 271-135-271-135-271 135 271 135Zm0 240 192-96v-159l-192 96-192-96v159l192 96Zm0-240Zm0 81Zm0 0Z"/></svg>`,
    articulo: `<svg class="icon icon-articulo" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M288-288h288v-72H288v72Zm0-156h384v-72H288v72Zm0-156h384v-72H288v72Zm-72 456q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h528q29.7 0 50.85 21.15Q816-773.7 816-744v528q0 29.7-21.15 50.85Q773.7-144 744-144H216Zm0-72h528v-528H216v528Zm0-528v528-528Z"/></svg>`,
    libro: `<svg class="icon icon-libro" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M288-96q-40 0-68-27.5T192-190v-553q0-34 22-59.5t56-32.5l354-74v626l-338.95 71.13Q277-210 270.5-203.75 264-197.5 264-190q0 10 7.2 16t16.8 6h407.55v-624H768v696H288Zm96-211 168-36v-477l-168 35v478Zm-72 15v-477l-30 6q-8 2-13 7.19T264-743v463q5-2 10.5-3t10.5-3l27-6Zm-48-469v481-481Z"/></svg>`,
    otro: `<svg class="icon icon-otro" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M168-192q-32 0-52-21.16t-20-50.88v-432.24Q96-726 116-747t52-21h216l96 96h313q31 0 50.5 21t21.5 51H451l-96-96H168v432l78-264h690l-85 285q-8 23-21 37t-38 14H168Zm75-72h538l59-192H300l-57 192Zm0 0 57-192-57 192Zm-75-336v-96 96Z"/></svg>`,
    heartFilled: `<svg class="icon icon-heart-filled" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 21s-6.7-4.35-9.3-8.1C1 10.3 1.6 6.9 4.3 5.3c2.2-1.3 4.8-.7 6.3 1.2l1.4 1.8 1.4-1.8c1.5-1.9 4.1-2.5 6.3-1.2 2.7 1.6 3.3 5 1.6 7.6C18.7 16.65 12 21 12 21z"/></svg>`,
    eye: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    empty: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`
};

let files = [];

document.addEventListener('DOMContentLoaded', () => {
    const nombreGuardado = localStorage.getItem('usuario_nombre');
    const avatar = document.getElementById("global-avatar");
    if (nombreGuardado && avatar) {
        avatar.textContent = nombreGuardado.charAt(0).toUpperCase();
    }

    cargarFavoritos();
});

async function cargarFavoritos() {
    const usuarioId = localStorage.getItem('usuario_id') || '';
    const container = document.getElementById('files-list');

    if (!usuarioId) {
        window.renderFiles([]);
        return;
    }

    if (container) container.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted)">Cargando favoritos...</p>';

    try {
        const res = await fetch(`${PHP_URL_FAVS}?usuario_id=${encodeURIComponent(usuarioId)}`);
        const data = await res.json();

        if (!data.success) {
            if (container) container.innerHTML = `<p style="padding:20px;text-align:center;color:#c0392b">${data.message}</p>`;
            return;
        }

        files = data.documentos.map(d => ({
            id: d.id,
            tipo: d.tipo,
            icono: ICONS[d.tipo] || ICONS.articulo,
            titulo: d.titulo,
            autor: d.autor,
            anio: d.anio_publicacion,
            size: d.tamano_archivo,
            estado: d.estado
        }));

        window.renderFiles(files);

    } catch (err) {
        console.error('Error cargando favoritos:', err);
        if (container) container.innerHTML = '<p style="padding:20px;text-align:center;color:#c0392b">❌ No se pudo conectar con el servidor.</p>';
    }
}

window.statusBadge = function(f) {
    if (f.estado === 'pendiente')
        return `<span class="badge badge-amber">⏳ Pendiente aprobación</span>`;
    if (f.estado === 'publicado')
        return `<span class="badge badge-green">✓ Publicado</span>`;
    return `<span class="badge badge-gray">${f.estado}</span>`;
};

window.renderFiles = function(list) {
    const container = document.getElementById('files-list');
    const empty = document.getElementById('empty-files');

    if (!list.length) {
        if (container) container.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    if (container) {
        container.innerHTML = list.map(f => `
            <div class="file-item" id="file-${f.id}">
              <div style="font-size:26px">${f.icono}</div>
              <div class="file-info">
                <div class="file-name">${f.titulo}</div>
                <div class="file-meta">${f.autor} · ${f.anio} · ${f.size}</div>
                <div class="file-status">
                  <span style="font-size:11px;color:var(--text-muted);text-transform:capitalize">${f.tipo}</span>
                  &nbsp;·&nbsp; ${window.statusBadge(f)}
                </div>
              </div>
              <div class="file-actions">
                <button class="icon-btn" title="Quitar de favoritos" onclick="quitarFavorito(${f.id})" style="color:#c8933a">${ICONS.heartFilled}</button>
                <button class="icon-btn" title="Vista previa" onclick="previewDoc(${f.id})">${ICONS.eye}</button>
              </div>
            </div>`).join('');
    }
};

window.quitarFavorito = async function(documentoId) {
    const usuarioId = localStorage.getItem('usuario_id') || '';

    try {
        const formData = new FormData();
        formData.append('usuario_id', usuarioId);
        formData.append('documento_id', documentoId);

        const res = await fetch(PHP_URL_FAV_TOGGLE, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            files = files.filter(f => f.id !== documentoId);
            window.renderFiles(files);
        }
    } catch (err) {
        console.error('Error al quitar favorito:', err);
    }
};

window.filterFiles = function() {
    const q = document.getElementById('file-search').value.toLowerCase();
    window.renderFiles(files.filter(f => !q || f.titulo.toLowerCase().includes(q) || f.autor.toLowerCase().includes(q)));
};

window.previewDoc = function(id) {
    window.location.href = `visor.html?id=${id}`;
};