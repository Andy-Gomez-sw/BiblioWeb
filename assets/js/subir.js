// ════════════════════════════════════════
//  subir.js — Biblioweb Corregido
// ════════════════════════════════════════

const PHP_URL = 'https://bibliowebb.com.mx/api/subir_documento.php';

// ── Avatar desde localStorage y configuraciones iniciales ──
document.addEventListener('DOMContentLoaded', () => {
    const nombre = localStorage.getItem('usuario_nombre');
    // CORRECCIÓN: Apuntar directamente al ID del HTML de subir
    const avatar = document.getElementById("subir-avatar"); 
    
    if (nombre && avatar) {
        avatar.textContent = nombre.charAt(0).toUpperCase();
    }

    // Contador de caracteres
    document.getElementById('f-resumen').addEventListener('input', function () {
        document.getElementById('char-count').textContent = this.value.length + ' / 500';
    });

    // Drag & Drop
    const dz = document.getElementById('dropzone');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => {
        e.preventDefault();
        dz.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
            document.getElementById('file-input').files = e.dataTransfer.files;
            document.getElementById('file-label').textContent = '✓ ' + file.name;
            dz.style.borderColor = 'var(--amber)';
        }
    });
});

function selectType(el) {
    document.querySelectorAll('.type-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}

function selectAccess(el) {
    document.querySelectorAll('.access-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}

function handleFile(input) {
    if (input.files[0]) {
        document.getElementById('file-label').textContent = '✓ ' + input.files[0].name;
        document.getElementById('dropzone').style.borderColor = 'var(--amber)';
    }
}

function addTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = e.target.value.trim();
        if (!val) return;
        const span = document.createElement('span');
        span.className = 'tag-removable';
        span.innerHTML = val + ' <button onclick="removeTag(this)">×</button>';
        document.getElementById('tags-container').insertBefore(span, e.target);
        e.target.value = '';
    }
}
function removeTag(btn) { btn.parentElement.remove(); }

function getTags() {
    const tags = [];
    document.querySelectorAll('#tags-container .tag-removable').forEach(t => {
        tags.push(t.textContent.replace('×', '').trim());
    });
    return tags.join(', ');
}

function mostrarMsg(texto, tipo) {
    let el = document.getElementById('upload-msg');
    if (!el) {
        el = document.createElement('div');
        el.id = 'upload-msg';
        document.querySelector('.form-fields').prepend(el);
    }
    el.textContent = texto;
    el.className = 'upload-msg upload-msg-' + tipo;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function ocultarMsg() {
    const el = document.getElementById('upload-msg');
    if (el) el.style.display = 'none';
}

// ── ENVÍO AL PHP ──
async function submitForm() {
    const titulo    = document.getElementById('f-titulo').value.trim();
    const autor     = document.getElementById('f-autor').value.trim();
    const anio      = document.getElementById('f-anio').value.trim();
    const inst      = document.getElementById('f-inst').value.trim();
    const area      = document.getElementById('f-area').value;
    const doi       = document.getElementById('f-doi').value.trim();
    const resumen   = document.getElementById('f-resumen').value.trim();
    const archivo   = document.getElementById('file-input').files[0];
    const tipo      = document.querySelector('.type-opt.selected')?.dataset.type || 'tesis';
    const acceso    = document.querySelector('.access-opt.selected .access-opt-label')?.textContent || 'Acceso abierto';
    const tags      = getTags();
    const usuarioId = localStorage.getItem('usuario_id') || '';

    // Validación de sesión activa
    if (!usuarioId) {
        mostrarMsg('❌ Error: No se detectó un ID de usuario activo. Inicia sesión nuevamente.', 'error');
        return;
    }

    if (!titulo || !autor || !anio || !inst || !area || !resumen || !doi) {
        mostrarMsg('⚠️ Por favor completa todos los campos obligatorios.', 'error');
        return;
    }
    if (!archivo) {
        mostrarMsg('⚠️ Debes seleccionar un archivo PDF o DOCX.', 'error');
        return;
    }

    const btn = document.querySelector('.form-actions .btn.btn-dark');
    btn.disabled = true;
    btn.textContent = '⏳ Subiendo...';
    mostrarMsg('Subiendo documento, por favor espera...', 'info');

    const formData = new FormData();
    formData.append('archivo',      archivo);
    formData.append('titulo',       titulo);
    formData.append('autor',        autor);
    formData.append('anio',         anio);
    formData.append('institucion',  inst);
    formData.append('area',         area);
    formData.append('doi',          doi);
    formData.append('resumen',      resumen);
    formData.append('tipo',         tipo);
    formData.append('acceso',       acceso);
    formData.append('palabras_clave', tags);
    formData.append('usuario_id',   usuarioId);

    try {
        const res  = await fetch(PHP_URL, { method: 'POST', body: formData });
        
        // Capturar errores de servidor si no devuelve un JSON válido (Ej: Error 500 de Hostinger)
        if (!res.ok) {
            const errorTexto = await res.text();
            throw new Error(`Servidor respondió con código ${res.status}. Detalles: ${errorTexto}`);
        }

        const data = await res.json();

        if (data.success) {
            ocultarMsg();
            const iconos = { tesis: '🎓', articulo: '📄', libro: '📚' };
            document.querySelector('.success-card .doc-type').textContent =
                (iconos[tipo] || '📄') + ' ' + tipo.charAt(0).toUpperCase() + tipo.slice(1);
            document.querySelector('.success-card .doc-title').textContent = titulo;
            document.querySelector('.success-doc-meta').textContent =
                autor + ' · ' + anio + ' · ' + inst;

            document.getElementById('success-overlay').classList.add('show');
        } else {
            mostrarMsg('❌ ' + (data.message || 'No se pudo subir el documento.'), 'error');
        }
    } catch (err) {
        mostrarMsg('❌ Error en el servidor. Revisa la consola o los nombres de las columnas.', 'error');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = '⬆️ Subir documento';
    }
}

function resetForm() {
    document.getElementById('success-overlay').classList.remove('show');
    ['f-titulo', 'f-autor', 'f-anio', 'f-inst', 'f-doi', 'f-resumen'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('char-count').textContent  = '0 / 500';
    document.getElementById('file-label').textContent  = 'Formatos aceptados PDF · DOCX · Máx. 50 MB';
    document.getElementById('dropzone').style.borderColor = '';
    ocultarMsg();
}