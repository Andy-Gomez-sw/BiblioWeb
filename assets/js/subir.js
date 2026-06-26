// ════════════════════════════════════════
//  subir.js 
// ════════════════════════════════════════

const PHP_URL = 'https://bibliowebb.com.mx/subir_documento.php';

document.addEventListener('DOMContentLoaded', () => {
    // ── VALIDACIÓN Y SINCRONIZACIÓN DE FLUJO DE USUARIO ──
    const token = localStorage.getItem('token_jwt');
    const nombreGuardado = localStorage.getItem('usuario_nombre');
    const avatar = document.getElementById("global-avatar");

    // Si no hay token de sesión activo, redirige de inmediato al login para proteger el flujo
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    // Cargar dinámicamente la inicial en el Navbar
    if (nombreGuardado && avatar) {
        avatar.textContent = nombreGuardado.charAt(0).toUpperCase();
    } else if (avatar) {
        avatar.textContent = 'U';
    }

    // Contador de caracteres para el resumen
    const resumenInput = document.getElementById('f-resumen');
    if (resumenInput) {
        resumenInput.addEventListener('input', function () {
            document.getElementById('char-count').textContent = this.value.length + ' / 500';
        });
    }

    // Configuración Drag & Drop
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