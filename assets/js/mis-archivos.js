// ════════════════════════════════════════
//  mis-archivos.js — Biblioteca Digital
// ════════════════════════════════════════

const FETCH_URL = 'https://bibliowebb.com.mx/mis_archivos.php';
const DELETE_URL = 'https://bibliowebb.com.mx/eliminar_documento.php';

let localFiles = [];
let docIdToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Validar e inyectar datos del avatar de sesión
    const nombre = localStorage.getItem('usuario_nombre');
    const avatar = document.getElementById("global-avatar");
    if (nombre && avatar) {
        avatar.textContent = nombre.charAt(0).toUpperCase();
    }

    loadUserFiles();
});

async function loadUserFiles() {
    const usuarioId = localStorage.getItem('usuario_id') || '';
    if (!usuarioId) {
        window.location.href = './login.html';
        return;
    }

    try {
        const res = await fetch(`${FETCH_URL}?usuario_id=${usuarioId}`);
        const data = await res.json();

        if (data.success) {
            localFiles = data.documentos || [];
            renderStats(localFiles);
            renderFiles(localFiles);
        } else {
            console.error("Error devuelto por servidor:", data.message);
            renderFiles([]);
        }
    } catch (err) {
        console.error("Fallo de conexión al cargar archivos:", err);
        renderFiles([]);
    }
}

function renderStats(files) {
    const total = files.length;
    const tesis = files.filter(f => f.tipo.toLowerCase() === 'tesis').length;
    const art = files.filter(f => f.tipo.toLowerCase() === 'articulo').length;
    const lib = files.filter(f => f.tipo.toLowerCase() === 'libro').length;

    document.getElementById('count-total').textContent = total;
    document.getElementById('count-tesis').textContent = tesis;
    document.getElementById('count-art').textContent = art;
    document.getElementById('count-lib').textContent = lib;
}

function renderFiles(files) {
    const listContainer = document.getElementById('files-list');
    const emptyWrapper = document.getElementById('empty-files');
    listContainer.innerHTML = '';

    if (files.length === 0) {
        emptyWrapper.style.display = 'block';
        return;
    }

    emptyWrapper.style.display = 'none';

    files.forEach(doc => {
        const item = document.createElement('div');
        item.className = 'file-item';
        
        const iconos = { tesis: '🎓', articulo: '📄', libro: '📚' };
        const icono = iconos[doc.tipo.toLowerCase()] || '📄';

        item.innerHTML = `
            <div class="file-info">
                <div class="file-icon-wrapper">${icono}</div>
                <div class="file-details">
                    <h3 class="file-title">${doc.titulo}</h3>
                    <p class="file-meta">${doc.autor} · ${doc.anio_publicacion} · ${doc.tamano_archivo || 'N/A'}</p>
                    <div class="file-badges">
                        <span class="badge badge-amber">${doc.tipo.toUpperCase()}</span>
                        <span class="badge badge-blue">${doc.area_conocimiento}</span>
                        <span class="badge ${doc.estado === 'aprobado' ? 'badge-green' : 'badge-gray'}">${doc.estado}</span>
                    </div>
                </div>
            </div>
            <div class="file-item-actions">
                <a href="${doc.ruta_pdf}" target="_blank" class="btn-action-view" title="Ver documento">👁️</a>
                <button class="btn-action-delete" onclick="openDelete(${doc.id}, '${doc.titulo.replace(/'/g, "\\'")}')" title="Eliminar">🗑️</button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

window.filterFiles = function() {
    const query = document.getElementById('file-search').value.toLowerCase().trim();
    const filtered = localFiles.filter(f => 
        f.titulo.toLowerCase().includes(query) || 
        f.autor.toLowerCase().includes(query) ||
        f.area_conocimiento.toLowerCase().includes(query)
    );
    renderFiles(filtered);
};

window.openDelete = function(id, title) {
    docIdToDelete = id;
    document.getElementById('delete-doc-name').textContent = `"${title}" \n Esta acción no se puede deshacer.`;
    document.getElementById('delete-modal').classList.add('show');
};

window.closeDelete = function() {
    document.getElementById('delete-modal').classList.remove('show');
    docIdToDelete = null;
};

window.confirmDelete = async function() {
    if (!docIdToDelete) return;

    try {
        const res = await fetch(DELETE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: docIdToDelete })
        });
        const data = await res.json();

        if (data.success) {
            localFiles = localFiles.filter(f => f.id !== docIdToDelete);
            renderStats(localFiles);
            renderFiles(localFiles);
            closeDelete();
        } else {
            alert(data.message || "No se pudo eliminar el archivo.");
        }
    } catch (err) {
        console.error("Error al procesar eliminación:", err);
        alert("Fallo de conexión con el servidor.");
    }
};