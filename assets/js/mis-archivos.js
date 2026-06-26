// ════════════════════════════════════════
//  mis-archivos.js — Biblioweb
//  Carga documentos reales desde MySQL
// ════════════════════════════════════════

const PHP_ARCHIVOS = 'https://bibliowebb.com.mx/api/mis_archivos.php';
const PHP_ELIMINAR = 'https://bibliowebb.com.mx/api/eliminar_documento.php';

let files       = [];
let deleteTarget = null;

// ════════════════════════════════════════
//  INICIO
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Avatar
    const nombre = localStorage.getItem('usuario_nombre');
    const avatar = document.querySelector('.navbar .avatar');
    if (avatar) {
        avatar.textContent = nombre ? nombre.charAt(0).toUpperCase() : '?';
    }

    // Cargar archivos del usuario
    cargarArchivos();
});

// ════════════════════════════════════════
//  CARGAR ARCHIVOS DESDE PHP
// ════════════════════════════════════════
async function cargarArchivos() {
    const usuarioId = localStorage.getItem('usuario_id');

    if (!usuarioId) {
        mostrarError('No se encontró sesión activa. Por favor inicia sesión.');
        return;
    }

    mostrarCargando();

    try {
        const res  = await fetch(`${PHP_ARCHIVOS}?usuario_id=${usuarioId}`);
        const data = await res.json();

        if (data.success) {
            files = data.documentos.map(d => ({
                id:     d.id,
                tipo:   d.tipo,
                emoji:  { tesis: '🎓', articulo: '📄', libro: '📚' }[d.tipo] || '📄',
                titulo: d.titulo,
                autor:  d.autor,
                anio:   d.anio,
                size:   d.nombre_archivo ? '' : '',
                area:   d.area,
                acceso: d.acceso,
                url:    d.url_archivo,
                fecha:  d.fecha_subida?.split(' ')[0] || '',
            }));
            renderFiles(files);
        } else {
            mostrarError(data.message || 'No se pudieron cargar tus archivos.');
        }
    } catch (err) {
        mostrarError('No se pudo conectar con el servidor.');
        console.error(err);
    }
}

// ════════════════════════════════════════
//  RENDER
// ════════════════════════════════════════
function renderFiles(list) {
    const container = document.getElementById('files-list');
    const empty     = document.getElementById('empty-files');

    if (!list.length) {
        container.innerHTML = '';
        empty.style.display = 'block';
        updateCounts();
        return;
    }
    empty.style.display = 'none';

    container.innerHTML = list.map(f => `
        <div class="file-item" id="file-${f.id}">
          <div style="font-size:26px">${f.emoji}</div>
          <div class="file-info">
            <div class="file-name">${f.titulo}</div>
            <div class="file-meta">${f.autor} · ${f.anio} ${f.fecha ? '· Subido: ' + f.fecha : ''}</div>
            <div class="file-status">
              <span style="font-size:11px;color:var(--text-muted);text-transform:capitalize">${f.tipo}</span>
              &nbsp;·&nbsp;
              <span class="badge badge-green">✓ Publicado</span>
              &nbsp;·&nbsp;
              <span style="font-size:11px;color:var(--text-muted)">${f.acceso}</span>
            </div>
          </div>
          <div class="file-actions">
            ${f.url ? `
            <a class="icon-btn" title="Ver documento" href="${f.url}" target="_blank">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </a>` : ''}
            <button class="icon-btn danger" title="Eliminar" onclick="askDelete(${f.id}, '${f.titulo.replace(/'/g, "\\'")}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>`).join('');

    updateCounts();
}

function updateCounts() {
    document.getElementById('count-total').textContent = files.length;
    document.getElementById('count-tesis').textContent   = files.filter(f => f.tipo === 'tesis').length;
    document.getElementById('count-art').textContent     = files.filter(f => f.tipo === 'articulo').length;
    document.getElementById('count-lib').textContent     = files.filter(f => f.tipo === 'libro').length;
}

function filterFiles() {
    const q = document.getElementById('file-search').value.toLowerCase();
    renderFiles(files.filter(f =>
        !q || f.titulo.toLowerCase().includes(q) || f.autor.toLowerCase().includes(q)
    ));
}

// ════════════════════════════════════════
//  ELIMINAR
// ════════════════════════════════════════
function askDelete(id, name) {
    deleteTarget = id;
    document.getElementById('delete-doc-name').textContent = `"${name}" será eliminado permanentemente.`;
    document.getElementById('delete-modal').classList.add('show');
}

function closeDelete() {
    deleteTarget = null;
    document.getElementById('delete-modal').classList.remove('show');
}

async function confirmDelete() {
    if (deleteTarget === null) return;

    const usuarioId = localStorage.getItem('usuario_id');

    try {
        const res  = await fetch(PHP_ELIMINAR, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: deleteTarget, usuario_id: usuarioId })
        });
        const data = await res.json();

        if (data.success) {
            files = files.filter(f => f.id !== deleteTarget);
            closeDelete();
            filterFiles();
        } else {
            closeDelete();
            alert('No se pudo eliminar: ' + (data.message || 'Error desconocido'));
        }
    } catch (err) {
        closeDelete();
        alert('Error de conexión al intentar eliminar.');
        console.error(err);
    }
}

// ════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════
function mostrarCargando() {
    document.getElementById('files-list').innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-muted);font-size:14px">
            ⏳ Cargando tus documentos...
        </div>`;
    document.getElementById('empty-files').style.display = 'none';
}

function mostrarError(msg) {
    document.getElementById('files-list').innerHTML = `
        <div style="text-align:center;padding:40px;color:#c0392b;font-size:14px">
            ❌ ${msg}
        </div>`;
    document.getElementById('empty-files').style.display = 'none';
}