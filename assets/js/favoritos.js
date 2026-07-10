// ════════════════════════════════════════
//  favoritos.js
// ════════════════════════════════════════

const PHP_URL_FAVS = 'https://bibliowebb.com.mx/assets/php/obtener_favoritos.php';
const PHP_URL_FAV_TOGGLE = 'https://bibliowebb.com.mx/assets/php/toggle_favorito.php';

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

        const iconos = { tesis: '🎓', articulo: '📄', libro: '📚', otro: '📁' };
        files = data.documentos.map(d => ({
            id: d.id,
            tipo: d.tipo,
            emoji: iconos[d.tipo] || '📄',
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
              <div style="font-size:26px">${f.emoji}</div>
              <div class="file-info">
                <div class="file-name">${f.titulo}</div>
                <div class="file-meta">${f.autor} · ${f.anio} · ${f.size}</div>
                <div class="file-status">
                  <span style="font-size:11px;color:var(--text-muted);text-transform:capitalize">${f.tipo}</span>
                  &nbsp;·&nbsp; ${window.statusBadge(f)}
                </div>
              </div>
              <div class="file-actions">
                <button class="icon-btn" title="Quitar de favoritos" onclick="quitarFavorito(${f.id})" style="color:#c8933a">♥</button>
                <button class="icon-btn" title="Vista previa" onclick="previewDoc(${f.id})">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
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