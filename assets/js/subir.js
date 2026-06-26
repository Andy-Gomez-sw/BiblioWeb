// ════════════════════════════════════════
//  subir.js 
// ════════════════════════════════════════

const PHP_URL = 'https://bibliowebb.com.mx/subir_documento.php';

// Esto se ejecuta en cuanto los elementos gráficos están listos
document.addEventListener('DOMContentLoaded', () => {
    const nombre = localStorage.getItem('usuario_nombre');
    const avatar = document.getElementById("subir-avatar");
    
    if (nombre && avatar) {
        avatar.textContent = nombre.charAt(0).toUpperCase();
    } else if (avatar) {
        avatar.textContent = "U"; 
    }

    // Contador de caracteres dinámico
    const resumenInput = document.getElementById('f-resumen');
    if (resumenInput) {
        resumenInput.addEventListener('input', function () {
            document.getElementById('char-count').textContent = this.value.length + ' / 500';
        });
    }

    // Drag & Drop para la Dropzone
    const dz = document.getElementById('dropzone');
    if (dz) {
        dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
        dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
        dz.addEventListener('drop', e => {
            e.preventDefault();
            dz.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) {
                const fileInput = document.getElementById('file-input');
                if (fileInput) {
                    fileInput.files = e.dataTransfer.files;
                    document.getElementById('file-label').textContent = '✓ ' + file.name;
                    dz.style.borderColor = 'var(--amber)';
                }
            }
        });
    }
});

// ── EXPOSICIÓN ESPECÍFICA EN WINDOW (Evita el error 'not defined') ──

window.selectType = function(el) {
    document.querySelectorAll('.type-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
};

window.selectAccess = function(el) {
    document.querySelectorAll('.access-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
};

window.handleFile = function(input) {
    if (input.files[0]) {
        document.getElementById('file-label').textContent = '✓ ' + input.files[0].name;
        document.getElementById('dropzone').style.borderColor = 'var(--amber)';
    }
};

window.addTag = function(e) {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = e.target.value.trim();
        if (!val) return;
        const span = document.createElement('span');
        span.className = 'tag-removable';
        span.innerHTML = val + ' <button type="button" onclick="removeTag(this)">×</button>';
        document.getElementById('tags-container').insertBefore(span, e.target);
        e.target.value = '';
    }
};

window.removeTag = function(btn) { 
    btn.parentElement.remove(); 
};

window.getTags = function() {
    const tags = [];
    document.querySelectorAll('#tags-container .tag-removable').forEach(t => {
        tags.push(t.textContent.replace('×', '').trim());
    });
    return tags.join(', ');
};

window.mostrarMsg = function(texto, tipo) {
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
};

window.ocultarMsg = function() {
    const el = document.getElementById('upload-msg');
    if (el) el.style.display = 'none';
};

// ── ENVÍO AL BACKEND PHP ──
window.submitForm = async function() {
    const titulo    = document.getElementById('f-titulo').value.trim();
    const autor     = document.getElementById('f-autor').value.trim();
    const anio      = document.getElementById('f-anio').value.trim();
    const inst      = document.getElementById('f-inst').value.trim();
    const area      = document.getElementById('f-area').value;
    const doi       = document.getElementById('f-doi').value.trim();
    const resumen   = document.getElementById('f-resumen').value.trim();
    const archivo   = document.getElementById('file-input').files[0];
    const tipo      = document.querySelector('.type-opt.selected')?.dataset.type || 'tesis';
    
    // CORRECCIÓN: Obtener el tipo de acceso de forma limpia y segura
    const accesoOpt = document.querySelector('.access-opt.selected .access-opt-label');
    const acceso    = accesoOpt ? accesoOpt.textContent.trim() : 'Acceso abierto';
    
    const tags      = window.getTags();
    const usuarioId = localStorage.getItem('usuario_id') || '';

    if (!titulo || !autor || !anio || !inst || !area || !resumen || !doi) {
        window.mostrarMsg('⚠️ Por favor completa todos los campos obligatorios.', 'error');
        return;
    }
    if (!archivo) {
        window.mostrarMsg('⚠️ Debes seleccionar un archivo PDF o DOCX.', 'error');
        return;
    }

    const btn = document.querySelector('.btn.btn-dark');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Subiendo...';
    }
    window.mostrarMsg('Guardando en la base de datos, por favor espera...', 'info');

    const formData = new FormData();
    formData.append('archivo',      archivo);
    formData.append('titulo',       titulo);
    formData.append('autor',        autor);
    formData.append('anio',         anio);
    formData.append('institucion',  inst); // Clave idéntica
    formData.append('area',         area);
    formData.append('doi',          doi);
    formData.append('resumen',      resumen);
    formData.append('tipo',         tipo);
    formData.append('acceso',       acceso);
    formData.append('palabras_clave', tags);
    formData.append('usuario_id',   usuarioId);

    try {
        const res = await fetch(PHP_URL, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            window.ocultarMsg();

            const iconos = { tesis: '🎓', articulo: '📄', libro: '📚' };
            document.querySelector('.success-card .doc-type').textContent =
                (iconos[tipo] || '📄') + ' ' + tipo.charAt(0).toUpperCase() + tipo.slice(1);
            document.querySelector('.success-card .doc-title').textContent = titulo;
            document.querySelector('.success-doc-meta').textContent =
                autor + ' · ' + anio + ' · ' + inst;

            document.getElementById('success-overlay').classList.add('show');
        } else {
            window.mostrarMsg('❌ ' + (data.message || 'Error al procesar la solicitud.'), 'error');
        }
    } catch (err) {
        window.mostrarMsg('❌ Ocurrió un fallo de conexión con el servidor Hostinger o respuesta inválida.', 'error');
        console.error(err);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '⬆️ Subir documento';
        }
    }
};

window.resetForm = function() {
    document.getElementById('success-overlay').classList.remove('show');
    ['f-titulo', 'f-autor', 'f-anio', 'f-inst', 'f-doi', 'f-resumen'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('char-count').textContent  = '0 / 500';
    document.getElementById('file-label').textContent  = 'Formatos aceptados PDF · DOCX · Máx. 50 MB';
    document.getElementById('dropzone').style.borderColor = '';
    window.ocultarMsg();
};