let currentType = 'libro';

document.addEventListener('DOMContentLoaded', () => {
    // Mantener la sesión activa en el avatar
    const nombreGuardado = localStorage.getItem('usuario_nombre');
    const avatar = document.getElementById("global-avatar");
    if (nombreGuardado && avatar) {
        avatar.textContent = nombreGuardado.charAt(0).toUpperCase();
    }
    window.updatePreview();
});

window.setDocType = function(btn) {
    document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.dtype;
    window.updatePreview();
};

window.getVal = function(id) { 
    return (document.getElementById(id)?.value || '').trim(); 
};

window.updatePreview = function() {
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

window.generateCita = function() {
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

window.copyCita = function() {
    const text = document.getElementById('apa-result-text').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const msg = document.getElementById('copy-msg');
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
    }).catch(() => {});
};