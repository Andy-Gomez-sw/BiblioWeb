const PHP_URL_GET = 'https://bibliowebb.com.mx/obtener_documentos.php';
const PHP_URL_FAVS = 'https://bibliowebb.com.mx/obtener_favoritos.php';
const PHP_URL_FAVORITO = 'https://bibliowebb.com.mx/toggle_favorito.php';

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
window.cargarDocumentos = async function() {
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
        const iconos = { tesis: '🎓', articulo: '📄', libro: '📚' };
        files = data.documentos.map(d => ({
            id: d.id,
            tipo: d.tipo,
            emoji: iconos[d.tipo] || '📄',
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
        if (container) container.innerHTML = '<p style="padding:20px;text-align:center;color:#c0392b">❌ No se pudo conectar con el servidor.</p>';
    }
};

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
        window.updateCounts(list);
        return;
    }
    if (empty) empty.style.display = 'none';

    if (container) {
        container.innerHTML = list.map(f => {
            const esFav = favoritosIds.has(f.id);
            return `
            <div class="file-item" id="file-${f.id}">
              <div style="font-size:26px">${f.emoji}</div>
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
                <button class="icon-btn" title="Favorito" onclick="toggleFavorito(${f.id}, this)" style="color:${esFav ? '#c8933a' : ''};font-size:16px">
                  ${esFav ? '♥' : '♡'}
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
window.toggleFavorito = async function(documentoId, btnEl) {
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
                btnEl.textContent = '♥';
                btnEl.style.color = '#c8933a';
            } else {
                favoritosIds.delete(documentoId);
                btnEl.textContent = '♡';
                btnEl.style.color = '';
            }
        }
    } catch (err) {
        console.error('Error al marcar favorito:', err);
    }
};

window.updateCounts = function(list) {
    document.getElementById('count-total').textContent = files.length;
    document.getElementById('count-tesis').textContent = files.filter(f => f.tipo === 'tesis').length;
    document.getElementById('count-art').textContent = files.filter(f => f.tipo === 'articulo').length;
    document.getElementById('count-lib').textContent = files.filter(f => f.tipo === 'libro').length;
};

window.filterFiles = function() {
    const q = document.getElementById('file-search').value.toLowerCase();
    window.renderFiles(files.filter(f => !q || f.titulo.toLowerCase().includes(q) || f.autor.toLowerCase().includes(q)));
};

window.previewDoc = function(id) {
    window.location.href = `visor.html?id=${id}`;
};

window.askDelete = function(id, name) {
    deleteTarget = id;
    document.getElementById('delete-doc-name').textContent = `"${name}" será eliminado permanentemente.`;
    document.getElementById('delete-modal').classList.add('show');
};

window.closeDelete = function() {
    deleteTarget = null;
    document.getElementById('delete-modal').classList.remove('show');
};

window.confirmDelete = async function() {
    if (deleteTarget === null) return;

    const usuarioId = localStorage.getItem('usuario_id') || '';
    const PHP_URL_DELETE = 'https://bibliowebb.com.mx/eliminar_documento.php';

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
            alert('❌ ' + data.message);
        }
    } catch (err) {
        console.error('Error al eliminar:', err);
        alert('❌ Error de conexión al intentar eliminar el documento.');
    } finally {
        window.closeDelete();
    }
};