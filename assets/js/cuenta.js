// ════════════════════════════════════════
//  cuenta.js — Avatar redirige a Mis Archivos
// ════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.avatar').forEach(av => {
        av.style.cursor = 'pointer';
        av.addEventListener('click', () => {
            window.location.href = 'mis-archivos.html';
        });
    });
});