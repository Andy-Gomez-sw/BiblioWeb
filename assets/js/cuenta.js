// ════════════════════════════════════════
//  cuenta.js — Menú desplegable del avatar
// ════════════════════════════════════════

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
            <a href="mis-archivos.html" class="avatar-dropdown-item">
                🗂️ Mis archivos
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