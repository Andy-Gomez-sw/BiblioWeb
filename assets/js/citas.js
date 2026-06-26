// ════════════════════════════════════════
//  citas.js — Biblioteca Digital
// ════════════════════════════════════════

let currentDocType = 'libro';

document.addEventListener('DOMContentLoaded', () => {
    // Sincronizar Avatar con el flujo del localStorage
    const nombre = localStorage.getItem('usuario_nombre');
    const avatar = document.getElementById("global-avatar");
    if (nombre && avatar) {
        avatar.textContent = nombre.charAt(0).toUpperCase();
    }

    updateLabels();
    updatePreview();
});

function setDocType(button) {
    document.querySelectorAll('.doc-tab').forEach(tab => tab.classList.remove('active'));
    button.classList.add('active');
    currentDocType = button.dataset.dtype;
    
    // Limpiar campos al cambiar de pestaña
    document.getElementById('l-titulo').value = '';
    document.getElementById('l-autor').value = '';
    document.getElementById('l-anio').value = '';
    document.getElementById('l-editorial').value = '';
    document.getElementById('l-ciudad').value = '';
    document.getElementById('l-doi').value = '';

    updateLabels();
    updatePreview();
}

function updateLabels() {
    const lblTitulo = document.getElementById('lbl-dinamico-titulo');
    const lblExtra1 = document.getElementById('lbl-dinamico-extra1');
    const lblExtra2 = document.getElementById('lbl-dinamico-extra2');
    const inputExtra1 = document.getElementById('l-editorial');
    const inputExtra2 = document.getElementById('l-ciudad');

    if (currentDocType === 'libro') {
        lblTitulo.innerHTML = 'Título del Libro <span>*</span>';
        lblExtra1.textContent = 'Editorial';
        lblExtra2.textContent = 'Ciudad';
        inputExtra1.placeholder = 'Ej. Fondo de Cultura Económica';
        inputExtra2.placeholder = 'Ej. Ciudad de México, México';
    } else if (currentDocType === 'tesis') {
        lblTitulo.innerHTML = 'Título de la Tesis <span>*</span>';
        lblExtra1.textContent = 'Institución Académica';
        lblExtra2.textContent = 'Grado (Ej. Tesis de Licenciatura)';
        inputExtra1.placeholder = 'Ej. Universidad Nacional Autónoma de México';
        inputExtra2.placeholder = 'Ej. Tesis de Maestría';
    } else if (currentDocType === 'articulo') {
        lblTitulo.innerHTML = 'Título del Artículo <span>*</span>';
        lblExtra1.textContent = 'Nombre de la Revista';
        lblExtra2.textContent = 'Volumen / Número (Ej. Vol. 12, No. 3)';
        inputExtra1.placeholder = 'Ej. Revista de Ciencia y Tecnología';
        inputExtra2.placeholder = 'Ej. 14(2)';
    }
}

function buildCitaString() {
    const titulo = document.getElementById('l-titulo').value.trim();
    const autor = document.getElementById('l-autor').value.trim();
    const anio = document.getElementById('l-anio').value.trim();
    const extra1 = document.getElementById('l-editorial').value.trim();
    const extra2 = document.getElementById('l-ciudad').value.trim();
    const doi = document.getElementById('l-doi').value.trim();

    let autorTexto = autor ? autor : 'Autor, A.';
    let anioTexto = anio ? `(${anio})` : '(Año)';
    let tituloTexto = titulo ? titulo : 'Título del documento';
    
    let cita = '';

    if (currentDocType === 'libro') {
        let ed = extra1 ? `. ${extra1}` : '';
        let ci = extra2 ? `. ${extra2}` : '';
        let d = (doi && doi.toLowerCase() !== 'n/a') ? `. DOI/ISBN: ${doi}` : '';
        cita = `${autorTexto} ${anioTexto}. <em>${tituloTexto}</em>${ed}${ci}${d}.`;
    } else if (currentDocType === 'tesis') {
        let grado = extra2 ? ` [${extra2}]` : ' [Tesis]';
        let inst = extra1 ? `. ${extra1}` : '';
        let d = (doi && doi.toLowerCase() !== 'n/a') ? `. URL: ${doi}` : '';
        cita = `${autorTexto} ${anioTexto}. <em>${tituloTexto}</em>${grado}${inst}${d}.`;
    } else if (currentDocType === 'articulo') {
        let revista = extra1 ? `. <em>${extra1}</em>` : '';
        let vol = extra2 ? `, ${extra2}` : '';
        let d = (doi && doi.toLowerCase() !== 'n/a') ? `. DOI: ${doi}` : '';
        cita = `${autorTexto} ${anioTexto}. ${tituloTexto}${revista}${vol}${d}.`;
    }

    return cita;
}

function updatePreview() {
    const previewText = document.getElementById('apa-preview-text');
    previewText.innerHTML = buildCitaString();
}

function generateCita() {
    const titulo = document.getElementById('l-titulo').value.trim();
    const autor = document.getElementById('l-autor').value.trim();
    const anio = document.getElementById('l-anio').value.trim();
    const doi = document.getElementById('l-doi').value.trim();
    const warn = document.getElementById('warn-msg');

    if (!titulo || !autor || !anio || !doi) {
        warn.style.display = 'block';
        warn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    warn.style.display = 'none';
    
    // Cambiar estados visuales de los pasos
    document.getElementById('dot-2').className = 'step-dot done';
    document.getElementById('dot-2').textContent = '✓';
    document.getElementById('line-2').className = 'step-line done';
    document.getElementById('dot-3').className = 'step-dot active';
    document.getElementById('lbl-3').className = 'step-label active';

    // Inyectar el resultado definitivo
    const finalCita = buildCitaString();
    document.getElementById('apa-result-text').innerHTML = finalCita;
    
    // Mostrar panel final
    document.getElementById('result-panel').classList.add('show');
}

function copyCita() {
    const textToCopy = document.getElementById('apa-result-text').textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const msg = document.getElementById('copy-msg');
        msg.style.display = 'block';
        setTimeout(() => { msg.style.display = 'none'; }, 3000);
    }).catch(err => {
        console.error('Error al copiar: ', err);
    });
}