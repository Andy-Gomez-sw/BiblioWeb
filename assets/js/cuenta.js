// ════════════════════════════════════════
//  cuenta.js — Menú desplegable del avatar
// ════════════════════════════════════════

const ICON_FOLDER = `<svg class="icon icon-folder" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M168-192q-29 0-50.5-21.5T96-264v-432q0-29.7 21.5-50.85Q139-768 168-768h216l96 96h312q29.7 0 50.85 21.15Q864-629.7 864-600v336q0 29-21.15 50.5T792-192H168Zm0-72h624v-336H450l-96-96H168v432Zm0 0v-432 432Z"/></svg>`;

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.avatar').forEach(av => {
        // Evitar duplicar el wrapper si ya se procesó este avatar
        if (av.dataset.dropdownReady) return;
        av.dataset.dropdownReady = 'true';

        av.style.cursor = 'pointer';
        av.style.position = 'relative';

        // Crear el menú desplegable
        const dropdown = document.createElement('div');
        dropdown.className = 'avatar-dropdown';
        dropdown.innerHTML = `
            <a href="mis-archivos.html" class="avatar-dropdown-item" style="display:flex;align-items:center;gap:8px">
                ${ICON_FOLDER} Mis archivos
            </a>
        `;
        av.appendChild(dropdown);

        av.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.avatar-dropdown.open').forEach(d => {
                if (d !== dropdown) d.classList.remove('open');
            });
            dropdown.classList.toggle('open');
        });
    });

    // Cerrar el dropdown si se hace clic fuera
    document.addEventListener('click', () => {
        document.querySelectorAll('.avatar-dropdown.open').forEach(d => d.classList.remove('open'));
    });
});