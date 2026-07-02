// ════════════════════════════════════════
//  historial.js
// ════════════════════════════════════════

const PHP_URL_HISTORIAL = 'https://bibliowebb.com.mx/obtener_historial.php';

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
            consultado_en: d.consultado_en
        }));

        window.renderFiles(files);

    } catch (err) {
        console.error('Error cargando historial:', err);
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