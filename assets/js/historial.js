// ════════════════════════════════════════
//  historial.js
// ════════════════════════════════════════

const PHP_URL_HISTORIAL = 'https://bibliowebb.com.mx/assets/php/obtener_historial.php';

const ICONS = {
    tesis: `<svg class="icon icon-tesis" viewBox="0 -960 960 960" width="20" height="20" fill="currentColor"><path d="M480-144 216-276v-240L48-600l432-216 432 216v312h-72v-276l-96 48v240L480-144Zm0-321 271-135-271-135-271 135 271 135Zm0 240 192-96v-159l-192 96-192-96v159l192 96Zm0-240Zm0 81Zm0 0Z"/></svg>`,
    articulo: `<svg class="icon icon-articulo" viewBox="0 -960 960 960" width="20" height="20" fill="currentColor"><path d="M288-288h288v-72H288v72Zm0-156h384v-72H288v72Zm0-156h384v-72H288v72Zm-72 456q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h528q29.7 0 50.85 21.15Q816-773.7 816-744v528q0 29.7-21.15 50.85Q773.7-144 744-144H216Zm0-72h528v-528H216v528Zm0-528v528-528Z"/></svg>`,
    libro: `<svg class="icon icon-libro" viewBox="0 -960 960 960" width="20" height="20" fill="currentColor"><path d="M288-96q-40 0-68-27.5T192-190v-553q0-34 22-59.5t56-32.5l354-74v626l-338.95 71.13Q277-210 270.5-203.75 264-197.5 264-190q0 10 7.2 16t16.8 6h407.55v-624H768v696H288Zm96-211 168-36v-477l-168 35v478Zm-72 15v-477l-30 6q-8 2-13 7.19T264-743v463q5-2 10.5-3t10.5-3l27-6Zm-48-469v481-481Z"/></svg>`,
    loading: `<svg class="icon icon-loading" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>`,
    check: `<svg class="icon icon-check" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    error: `<svg class="icon icon-error" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>`
};

let files = [];

document.addEventListener('DOMContentLoaded', () => {
    const nombreGuardado = localStorage.getItem('usuario_nombre');
    const avatar = document.getElementById("global-avatar");
    if (nombreGuardado && avatar) {
        avatar.textContent = nombreGuardado.charAt(0).toUpperCase();
    }

    cargarHistorial();
});

async function cargarHistorial() {
    const usuarioId = localStorage.getItem('usuario_id') || '';
    const container = document.getElementById('files-list');

    if (!usuarioId) {
        window.renderFiles([]);
        return;
    }

    if (container) container.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted)">Cargando historial...</p>';

    try {
        const res = await fetch(`${PHP_URL_HISTORIAL}?usuario_id=${encodeURIComponent(usuarioId)}`);
        const data = await res.json();

        if (!data.success) {
            if (container) container.innerHTML = `<p style="padding:20px;text-align:center;color:#c0392b">${data.message}</p>`;
            return;
        }

        const iconos = { tesis: ICONS.tesis, articulo: ICONS.articulo, libro: ICONS.libro };
        files = data.documentos.map(d => ({
            id: d.id,
            tipo: d.tipo,
            emoji: iconos[d.tipo] || ICONS.articulo,
            titulo: d.titulo,
            autor: d.autor,
            anio: d.anio_publicacion,
            size: d.tamano_archivo,
            estado: d.estado,
            consultado_en: d.consultado_en
        }));

        window.renderFiles(files);

    } catch (err) {
        console.error('Error cargando historial:', err);
        if (container) container.innerHTML = `<p style="padding:20px;text-align:center;color:#c0392b">${ICONS.error} No se pudo conectar con el servidor.</p>`;
    }
}

window.statusBadge = function(f) {
    if (f.estado === 'pendiente')
        return `<span class="badge badge-amber" style="display:inline-flex;align-items:center;gap:4px">${ICONS.loading} Pendiente aprobación</span>`;
    if (f.estado === 'publicado')
        return `<span class="badge badge-green" style="display:inline-flex;align-items:center;gap:4px">${ICONS.check} Publicado</span>`;
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
              <div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;color:var(--wine,#3b1f1a)">${f.emoji}</div>
              <div class="file-info">
                <div class="file-name">${f.titulo}</div>
                <div class="file-meta">${f.autor} · ${f.anio} · ${f.size}</div>
                <div class="file-status">
                  <span style="font-size:11px;color:var(--text-muted);text-transform:capitalize">${f.tipo}</span>
                  &nbsp;·&nbsp; ${window.statusBadge(f)}
                  &nbsp;·&nbsp; <span style="font-size:11px;color:var(--text-muted)">Visto: ${formatearFechaHistorial(f.consultado_en)}</span>
                </div>
              </div>
              <div class="file-actions">
                <button class="icon-btn" title="Vista previa" onclick="previewDoc(${f.id})">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>`).join('');
    }
};

window.filterFiles = function() {
    const q = document.getElementById('file-search').value.toLowerCase();
    window.renderFiles(files.filter(f => !q || f.titulo.toLowerCase().includes(q) || f.autor.toLowerCase().includes(q)));
};

window.previewDoc = function(id) {
    window.location.href = `visor.html?id=${id}`;
};

function formatearFechaHistorial(fechaSQL) {
    const f = new Date(fechaSQL.replace(' ', 'T') + 'Z');
    return f.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Mexico_City'
    });
}