let currentType = 'libro';

function setDocType(btn) {
    document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.dtype;
    updatePreview();
}

function getVal(id) { return (document.getElementById(id)?.value || '').trim(); }

function updatePreview() {
    const autor = getVal('l-autor') || 'Autor(es)';
    const anio = getVal('l-anio') || 'año';
    const titulo = getVal('l-titulo') || 'Título';
    const editorial = getVal('l-editorial') || 'Editorial';
    const doi = getVal('l-doi');

    let html = `${autor} (${anio}). <strong>${titulo}.</strong> ${editorial}.`;
    if (doi && doi.toLowerCase() !== 'n/a') html += ` https://doi.org/${doi}`;

    document.getElementById('apa-preview-text').innerHTML = html;
}

function generateCita() {
    const requiredIds = ['l-titulo', 'l-autor', 'l-anio'];
    const missing = requiredIds.some(id => !getVal(id));
    if (missing) {
        document.getElementById('warn-msg').style.display = 'flex';
        document.getElementById('warn-msg').textContent = '⚠️ Completa los campos obligatorios (marcados con *) antes de continuar.';
        return;
    }
    document.getElementById('warn-msg').style.display = 'none';

    // Advance step indicator
    ['dot-2', 'dot-3'].forEach((id, i) => {
        const el = document.getElementById(id);
        el.className = i === 1 ? 'step-dot active' : 'step-dot done';
        if (i === 0) el.textContent = '✓';
    });
    document.getElementById('line-2').classList.add('done');
    document.getElementById('lbl-3').classList.add('active');

    // Show result
    const cita = document.getElementById('apa-preview-text').innerHTML;
    document.getElementById('apa-result-text').innerHTML = cita;
    const panel = document.getElementById('result-panel');
    panel.classList.add('show');
    panel.scrollIntoView({ behavior: 'smooth' });
}

function copyCita() {
    const text = document.getElementById('apa-result-text').innerText;
    navigator.clipboard.writeText(text).catch(() => { });
    const msg = document.getElementById('copy-msg');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 3000);
}

// Init preview
updatePreview();