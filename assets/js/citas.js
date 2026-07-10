let currentType = 'libro';
const GEN_CITAS_URL = 'https://bibliowebb.com.mx/assets/php/citas.php';
const GUARDAR_CITA_URL = 'https://bibliowebb.com.mx/assets/php/guardar_cita.php'

const ICONS = {
    loading: `<svg class="icon icon-loading" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>`,
    error: `<svg class="icon icon-error" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>`,
    warning: `<svg class="icon icon-warning" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"></path><line x1="12" y1="9" x2="12" y2="14"></line><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"></circle></svg>`,
    check: `<svg class="icon icon-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
};

document.addEventListener('DOMContentLoaded', () => {
    // Mantener la sesión activa en el avatar
    const nombreGuardado = localStorage.getItem('usuario_nombre');
    const avatar = document.getElementById("global-avatar");
    if (nombreGuardado && avatar) {
        avatar.textContent = nombreGuardado.charAt(0).toUpperCase();
    }

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
                    // En cuanto hay archivo, lo analizamos automáticamente
                    window.analyzeDocument();
                }
            }
        });
    }

    window.updatePreview();
});

// ── SELECCIÓN DE ARCHIVO POR CLIC ──
window.handleFile = function (input) {
    if (input.files[0]) {
        document.getElementById('file-label').innerHTML = `${ICONS.check} ${input.files[0].name}`;
        document.getElementById('dropzone').style.borderColor = 'var(--amber)';
        window.analyzeDocument();
    }
};

window.setDocType = function (btn) {
    document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.dtype;
    window.updatePreview();
};

window.getVal = function (id) {
    return (document.getElementById(id)?.value || '').trim();
};

// ── ANÁLISIS DEL DOCUMENTO Y EXTRACCIÓN DE DATOS ──
window.analyzeDocument = async function () {
    const archivo = document.getElementById('file-input').files[0];

    if (!archivo) return;

    const warn = document.getElementById('warn-msg');
    if (warn) {
        warn.style.display = 'flex';
        warn.innerHTML = `${ICONS.loading} Analizando documento y extrayendo datos...`;
    }

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('tipo', currentType);

    try {
        const res = await fetch(GEN_CITAS_URL, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            if (warn) warn.style.display = 'none';
            // data.campos esperado: { titulo, autor, anio, editorial, ciudad, doi }
            window.rellenarCamposDetectados(data.campos, data.faltantes || []);
        } else {
            if (warn) {
                warn.style.display = 'flex';
                warn.innerHTML = `${ICONS.error} No se pudo analizar el documento: ${data.message}`;
            }
        }
    } catch (err) {
        if (warn) {
            warn.style.display = 'flex';
            warn.innerHTML = `${ICONS.error} Error de conexión. Verifica que el servidor esté activo.`;
        }
        console.error('Detalles del error:', err);
    }
};

// ── RELLENAR FORMULARIO CON LO DETECTADO Y MARCAR LO FALTANTE ──
window.rellenarCamposDetectados = function (campos, faltantes) {
    const mapa = {
        titulo: 'l-titulo',
        autor: 'l-autor',
        anio: 'l-anio',
        editorial: 'l-editorial',
        ciudad: 'l-ciudad',
        doi: 'l-doi'
    };

    Object.keys(mapa).forEach(clave => {
        const input = document.getElementById(mapa[clave]);
        if (!input) return;

        if (campos[clave]) {
            input.value = campos[clave];
            input.classList.remove('campo-faltante');
        } else {
            input.value = '';
            input.classList.add('campo-faltante'); // borde ámbar vía CSS
        }
    });

    window.updatePreview();
};

window.updatePreview = function () {
    const autor = window.getVal('l-autor') || 'Autor(es)';
    const anio = window.getVal('l-anio') || 'año';
    const titulo = window.getVal('l-titulo') || 'Título';
    const editorial = window.getVal('l-editorial') || 'Editorial';
    const doi = window.getVal('l-doi');

    let html = `${autor} (${anio}). <strong>${titulo}.</strong> ${editorial}.`;
    if (doi && doi.toLowerCase() !== 'n/a') html += ` https://doi.org/${doi}`;

    const previewEl = document.getElementById('apa-preview-text');
    if (previewEl) previewEl.innerHTML = html;
};

window.generateCita = function () {
    const requiredIds = ['l-titulo', 'l-autor', 'l-anio'];
    const missing = requiredIds.some(id => !window.getVal(id));
    if (missing) {
        const warn = document.getElementById('warn-msg');
        warn.style.display = 'flex';
        warn.innerHTML = `${ICONS.warning} Completa los campos obligatorios (marcados con *) antes de continuar.`;
        return;
    }
    document.getElementById('warn-msg').style.display = 'none';

    ['dot-2', 'dot-3'].forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) {
            el.className = i === 1 ? 'step-dot active' : 'step-dot done';
            if (i === 0) el.innerHTML = ICONS.check;
        }
    });

    document.getElementById('line-2')?.classList.add('done');
    document.getElementById('lbl-3')?.classList.add('active');

    const cita = document.getElementById('apa-preview-text').innerHTML;
    document.getElementById('apa-result-text').innerHTML = cita;
    const { parentetica, narrativa } = window.buildShortCitations(
        window.getVal('l-autor'),
        window.getVal('l-anio')
    );
    document.getElementById('cita-parentetica').textContent = parentetica;
    document.getElementById('cita-narrativa').textContent = narrativa;

    window.openCitaModal();

    window.guardarCitaEnBD(cita);
};

window.buildShortCitations = function (autorFull, anio) {
    const apellido = (autorFull.split(',')[0] || autorFull).trim();
    return {
        parentetica: `(${apellido}, ${anio})`,
        narrativa: `${apellido} (${anio})`
    };
};

window.openCitaModal = function () {
    document.getElementById('cita-modal').classList.add('show');
};

window.closeCitaModal = function () {
    document.getElementById('cita-modal').classList.remove('show');
};

window.copyCita = function () {
    const text = document.getElementById('apa-result-text').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const msg = document.getElementById('copy-msg');
        msg.classList.add('show');
        setTimeout(() => msg.classList.remove('show'), 3000);
    }).catch(() => { });
};

window.guardarCitaEnBD = async function (citaFormateada) {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) {
        console.warn('No hay usuario_id; la cita no se guardará en el historial.');
        return;
    }

    const payload = {
        usuario_id: usuarioId,
        tipo: currentType,
        titulo: window.getVal('l-titulo'),
        autor: window.getVal('l-autor'),
        anio: window.getVal('l-anio'),
        editorial: window.getVal('l-editorial'),
        ciudad: window.getVal('l-ciudad'),
        doi: window.getVal('l-doi'),
        cita_formateada: citaFormateada,
        nombre_archivo: document.getElementById('file-input')?.files[0]?.name || null,
        extension: document.getElementById('file-input')?.files[0]?.name.split('.').pop() || null,
    };

    const url = `${GUARDAR_CITA_URL}?usuario_id=${encodeURIComponent(usuarioId)}`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) {
            console.error('No se pudo guardar la cita:', data.message);
        }
    } catch (err) {
        console.error('Error de conexión al guardar la cita:', err);
    }
};