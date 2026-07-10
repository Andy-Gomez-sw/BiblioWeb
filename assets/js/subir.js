// ════════════════════════════════════════
//  subir.js — Solución de Contador y Tarjeta
// ════════════════════════════════════════

const PHP_URL = 'https://bibliowebb.com.mx/assets/php/subir_documento.php';

const ICONS = {
    check: `<svg class="icon icon-check" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    error: `<svg class="icon icon-error" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>`,
    warning: `<svg class="icon icon-warning" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"></path><line x1="12" y1="9" x2="12" y2="14"></line><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"></circle></svg>`,
    loading: `<svg class="icon icon-loading" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>`,
    upload: `<svg class="icon icon-upload" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
    tesis: `<svg class="icon icon-tesis" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M480-144 216-276v-240L48-600l432-216 432 216v312h-72v-276l-96 48v240L480-144Zm0-321 271-135-271-135-271 135 271 135Zm0 240 192-96v-159l-192 96-192-96v159l192 96Zm0-240Zm0 81Zm0 0Z"/></svg>`,
    articulo: `<svg class="icon icon-articulo" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M288-288h288v-72H288v72Zm0-156h384v-72H288v72Zm0-156h384v-72H288v72Zm-72 456q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h528q29.7 0 50.85 21.15Q816-773.7 816-744v528q0 29.7-21.15 50.85Q773.7-144 744-144H216Zm0-72h528v-528H216v528Zm0-528v528-528Z"/></svg>`,
    libro: `<svg class="icon icon-libro" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M288-96q-40 0-68-27.5T192-190v-553q0-34 22-59.5t56-32.5l354-74v626l-338.95 71.13Q277-210 270.5-203.75 264-197.5 264-190q0 10 7.2 16t16.8 6h407.55v-624H768v696H288Zm96-211 168-36v-477l-168 35v478Zm-72 15v-477l-30 6q-8 2-13 7.19T264-743v463q5-2 10.5-3t10.5-3l27-6Zm-48-469v481-481Z"/></svg>`,
    otro: `<svg class="icon icon-otro" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M168-192q-32 0-52-21.16t-20-50.88v-432.24Q96-726 116-747t52-21h216l96 96h313q31 0 50.5 21t21.5 51H451l-96-96H168v432l78-264h690l-85 285q-8 23-21 37t-38 14H168Zm75-72h538l59-192H300l-57 192Zm0 0 57-192-57 192Zm-75-336v-96 96Z"/></svg>`
};

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
                    document.getElementById('file-label').innerHTML = `${ICONS.check} ${file.name}`;
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
        document.getElementById('file-label').innerHTML = `${ICONS.check} ${input.files[0].name}`;
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
        span.innerHTML = val + ' <button type="button" onclick="removeTag(this)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
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
    const iconoPorTipo = { error: ICONS.error, warning: ICONS.warning, info: ICONS.loading };
    const icono = iconoPorTipo[tipo] || '';
    el.innerHTML = `${icono} ${texto}`;
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
        window.mostrarMsg('Error: No se detectó tu sesión. Por favor, vuelve a ingresar al sistema.', 'error');
        return;
    }

    if (!titulo || !autor || !anio || !inst || !area || !resumen || !doi) {
        window.mostrarMsg('Por favor completa todos los campos obligatorios.', 'error');
        return;
    }
    if (!archivo) {
        window.mostrarMsg('Debes seleccionar o arrastrar un archivo PDF o DOCX.', 'error');
        return;
    }

    const btn = document.querySelector('.btn.btn-dark');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `${ICONS.loading} Subiendo...`;
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
            const iconos = { tesis: ICONS.tesis, articulo: ICONS.articulo, libro: ICONS.libro, otro: ICONS.otro };
            
            // 1. Tipo de documento real
            const docTypeEl = document.querySelector('#success-overlay .doc-type');
            if (docTypeEl) {
                docTypeEl.innerHTML = `${iconos[tipo] || ICONS.articulo} ${tipo.toUpperCase()}`;
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
            window.mostrarMsg('Base de datos: ' + data.message, 'error');
        }
    } catch (err) {
        window.mostrarMsg('Error interno. Verifica que config.php esté activo y las columnas de la tabla acepten estos datos.', 'error');
        console.error("Detalles del error detectado:", err);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `${ICONS.upload} Subir documento`;
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
    const btn = document.querySelector('.btn.btn-dark');
    if (btn) btn.innerHTML = `${ICONS.upload} Subir documento`;
    window.ocultarMsg();
};