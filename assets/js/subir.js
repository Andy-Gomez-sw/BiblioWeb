// ════════════════════════════════════════
//  subir.js — Solución de Contador y Tarjeta
// ════════════════════════════════════════

const PHP_URL = 'https://bibliowebb.com.mx/subir_documento.php';

// Configurar elementos tan pronto como el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // ── PERSISTENCIA DEL AVATAR ──
    const nombreGuardado = localStorage.getItem('usuario_nombre');
    const avatar = document.getElementById("global-avatar");

    if (nombreGuardado && avatar) {
        avatar.textContent = nombreGuardado.charAt(0).toUpperCase();
    } else if (avatar) {
        avatar.textContent = 'U';
    }

    // ── CONTADOR DE CARACTERES CORREGIDO ──
    const resumenInput = document.getElementById('f-resumen');
    const charCountEl = document.getElementById('char-count');
    
    if (resumenInput && charCountEl) {
        // Ejecutar inmediatamente al cargar por si quedó texto guardado
        charCountEl.textContent = resumenInput.value.length + ' / 500';
        
        // Escuchar cada pulsación de tecla para actualizar dinámicamente
        resumenInput.addEventListener('input', function () {
            charCountEl.textContent = this.value.length + ' / 500';
        });
    }

    // ── CONFIGURACIÓN DRAG & DROP ──
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

// ── EXPOSICIÓN GLOBAL DE FUNCIONES DE INTERFAZ (UI) ──

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

// ── ENVÍO SEGURO HACIA PHP Y BASE DE DATOS ──
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
    
    const accesoOpt = document.querySelector('.access-opt.selected .access-opt-label');
    const acceso    = accesoOpt ? accesoOpt.textContent.trim() : 'Acceso abierto';
    
    const tags      = window.getTags();
    const usuarioId = localStorage.getItem('usuario_id') || '';

    // Validar inicio de sesión
    if (!usuarioId) {
        window.mostrarMsg('❌ Error: No se detectó tu sesión. Por favor, vuelve a ingresar al sistema.', 'error');
        return;
    }

    if (!titulo || !autor || !anio || !inst || !area || !resumen || !doi) {
        window.mostrarMsg('⚠️ Por favor completa todos los campos obligatorios.', 'error');
        return;
    }
    if (!archivo) {
        window.mostrarMsg('⚠️ Debes seleccionar o arrastrar un archivo PDF o DOCX.', 'error');
        return;
    }

    const btn = document.querySelector('.btn.btn-dark');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Subiendo...';
    }
    window.mostrarMsg('Registrando documento en la base de datos...', 'info');

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
        const res = await fetch(PHP_URL, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            window.ocultarMsg();

            // ── INYECCIÓN DE TUS DATOS REALES EN LA TARJETA DE ÉXITO ──
            const iconos = { tesis: '🎓', articulo: '📄', libro: '📚' };
            
            // 1. Tipo de documento real
            const docTypeEl = document.querySelector('#success-overlay .doc-type');
            if (docTypeEl) {
                docTypeEl.textContent = `${iconos[tipo] || '📄'} ${tipo.toUpperCase()}`;
            }
                
            // 2. Título escrito por ti en el input
            const docTitleEl = document.querySelector('#success-overlay .doc-title');
            if (docTitleEl) {
                docTitleEl.textContent = titulo;
            }
            
            // 3. Metadatos dinámicos reales
            const docMetaEl = document.querySelector('#success-overlay .success-doc-meta');
            if (docMetaEl) {
                docMetaEl.textContent = `${autor} · ${anio} · Archivo procesado con éxito`;
            }

            // 4. Badges inferiores dinámicos
            const badgesContainer = document.querySelector('#success-overlay .success-doc-badges');
            if (badgesContainer) {
                badgesContainer.innerHTML = `
                    <span class="badge badge-amber">${tipo.toUpperCase()}</span>
                    <span class="badge badge-amber">${area}</span>
                    <span class="badge badge-green">${acceso}</span>
                `;
            }

            // Mostrar el Overlay/Modal de éxito únicamente cuando data.success sea verdadero
            document.getElementById('success-overlay').classList.add('show');
        } else {
            window.mostrarMsg('❌ Base de datos: ' + data.message, 'error');
        }
    } catch (err) {
        window.mostrarMsg('❌ Error interno. Verifica que config.php esté activo y las columnas de la tabla acepten estos datos.', 'error');
        console.error("Detalles del error detectado:", err);
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