let currentType = 'libro';
const PHP_URL = 'https://bibliowebb.com.mx/citas.php';

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
                    document.getElementById('file-label').textContent = '✓ ' + file.name;
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
        document.getElementById('file-label').textContent = '✓ ' + input.files[0].name;
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
        warn.textContent = '⏳ Analizando documento y extrayendo datos...';
    }

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('tipo', currentType);

    try {
        const res = await fetch(PHP_URL, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            if (warn) warn.style.display = 'none';
            // data.campos esperado: { titulo, autor, anio, editorial, ciudad, doi }
            window.rellenarCamposDetectados(data.campos, data.faltantes || []);
        } else {
            if (warn) {
                warn.style.display = 'flex';
                warn.textContent = '❌ No se pudo analizar el documento: ' + data.message;
            }
        }
    } catch (err) {
        if (warn) {
            warn.style.display = 'flex';
            warn.textContent = '❌ Error de conexión. Verifica que el servidor esté activo.';
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
        warn.textContent = '⚠️ Completa los campos obligatorios (marcados con *) antes de continuar.';
        return;
    }
    document.getElementById('warn-msg').style.display = 'none';

    ['dot-2', 'dot-3'].forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) {
            el.className = i === 1 ? 'step-dot active' : 'step-dot done';
            if (i === 0) el.textContent = '✓';
        }
    });

    document.getElementById('line-2')?.classList.add('done');
    document.getElementById('lbl-3')?.classList.add('active');

    const cita = document.getElementById('apa-preview-text').innerHTML;
    document.getElementById('apa-result-text').innerHTML = cita;
    const panel = document.getElementById('result-panel');
    panel.classList.add('show');
    panel.scrollIntoView({ behavior: 'smooth' });
};

window.copyCita = function () {
    const text = document.getElementById('apa-result-text').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const msg = document.getElementById('copy-msg');
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
    }).catch(() => { });
};