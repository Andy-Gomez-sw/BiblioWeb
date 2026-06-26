let files = [
    { id: 1, tipo: 'tesis', emoji: '🎓', titulo: 'El romanticismo tardío en la literatura mexicana', autor: 'García Martínez, L. A.', anio: 2022, size: '3.2 MB', estado: 'pendiente', nuevo: true },
    { id: 2, tipo: 'tesis', emoji: '🎓', titulo: 'Análisis socioeconómico del desarrollo rural en Oaxaca', autor: 'Ramírez López, C.', anio: 2024, size: '2.1 MB', estado: 'publicado', nuevo: false },
    { id: 3, tipo: 'articulo', emoji: '📄', titulo: 'IA aplicada a la catalogación de acervos bibliotecarios', autor: 'Hernández Ruiz, P.', anio: 2023, size: '1.8 MB', estado: 'publicado', nuevo: false },
    { id: 4, tipo: 'libro', emoji: '📚', titulo: 'El laberinto de la soledad', autor: 'Paz, O.', anio: 1993, size: '2.4 MB', estado: 'publicado', nuevo: false },
];

let deleteTarget = null;

function statusBadge(f) {
    if (f.nuevo && f.estado === 'pendiente')
        return `<span class="badge badge-amber">⏳ Pendiente aprobación</span>`;
    if (f.estado === 'publicado')
        return `<span class="badge badge-green">✓ Publicado</span>`;
    return `<span class="badge badge-gray">${f.estado}</span>`;
}

function renderFiles(list) {
    const container = document.getElementById('files-list');
    const empty = document.getElementById('empty-files');

    if (!list.length) { container.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';

    container.innerHTML = list.map(f => `
        <div class="file-item" id="file-${f.id}">
          <div style="font-size:26px">${f.emoji}</div>
          <div class="file-info">
            <div class="file-name">${f.titulo}</div>
            <div class="file-meta">${f.autor} · ${f.anio} · ${f.size}</div>
            <div class="file-status">
              ${f.nuevo ? '<span style="background:var(--amber);color:#fff;border-radius:999px;padding:1px 8px;font-size:10px;font-weight:600;margin-right:4px">Nuevo</span>' : ''}
              <span style="font-size:11px;color:var(--text-muted);text-transform:capitalize">${f.tipo}</span>
              &nbsp;·&nbsp; ${statusBadge(f)}
            </div>
          </div>
          <div class="file-actions">
            <button class="icon-btn" title="Vista previa" onclick="previewDoc(${f.id})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="icon-btn danger" title="Eliminar" onclick="askDelete(${f.id}, '${f.titulo.replace(/'/g, "\\'")}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>`).join('');

    updateCounts(list);
}

function updateCounts(list) {
    document.getElementById('count-total').textContent = files.length;
    document.getElementById('count-tesis').textContent = files.filter(f => f.tipo === 'tesis').length;
    document.getElementById('count-art').textContent = files.filter(f => f.tipo === 'articulo').length;
    document.getElementById('count-lib').textContent = files.filter(f => f.tipo === 'libro').length;
}

function filterFiles() {
    const q = document.getElementById('file-search').value.toLowerCase();
    renderFiles(files.filter(f => !q || f.titulo.toLowerCase().includes(q) || f.autor.toLowerCase().includes(q)));
}

function previewDoc(id) {
    window.location.href = 'citas.html';
}

function askDelete(id, name) {
    deleteTarget = id;
    document.getElementById('delete-doc-name').textContent = `"${name}" será eliminado permanentemente.`;
    document.getElementById('delete-modal').classList.add('show');
}

function closeDelete() {
    deleteTarget = null;
    document.getElementById('delete-modal').classList.remove('show');
}

function confirmDelete() {
    if (deleteTarget === null) return;
    files = files.filter(f => f.id !== deleteTarget);
    closeDelete();
    filterFiles();
}

// Init
renderFiles(files);