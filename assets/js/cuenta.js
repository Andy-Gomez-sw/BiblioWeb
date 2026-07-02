// ════════════════════════════════════════
//  cuenta.js — Modal de cuenta de usuario
// ════════════════════════════════════════

const PHP_URL_USUARIO = 'https://bibliowebb.com.mx/obtener_usuario.php';
const PHP_URL_ACTUALIZAR = 'https://bibliowebb.com.mx/actualizar_usuario.php';

document.addEventListener('DOMContentLoaded', () => {
    // Cualquier elemento con la clase "avatar" abre el modal al hacer clic
    document.querySelectorAll('.avatar').forEach(av => {
        av.style.cursor = 'pointer';
        av.addEventListener('click', abrirModalCuenta);
    });

    // Cerrar el modal si se hace clic fuera de la tarjeta
    const overlay = document.getElementById('cuenta-overlay');
    if (overlay) {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) cerrarModalCuenta();
        });
    }
});

window.abrirModalCuenta = async function() {
    const overlay = document.getElementById('cuenta-overlay');
    if (!overlay) return;

    overlay.classList.add('open');
    mostrarMsgCuenta('Cargando datos...', 'success');

    const usuarioId = localStorage.getItem('usuario_id') || '';
    if (!usuarioId) {
        mostrarMsgCuenta('No se detectó tu sesión.', 'error');
        return;
    }

    try {
        const res = await fetch(`${PHP_URL_USUARIO}?usuario_id=${encodeURIComponent(usuarioId)}`);
        const data = await res.json();

        if (!data.success) {
            mostrarMsgCuenta(data.message, 'error');
            return;
        }

        const u = data.usuario;
        document.getElementById('cuenta-nombre').value = u.nombre || '';
        document.getElementById('cuenta-email').value = u.email || '';
        document.getElementById('cuenta-genero').value = u.genero || 'M';
        document.getElementById('cuenta-avatar-lg').textContent = (u.nombre || 'U').charAt(0).toUpperCase();

        ocultarMsgCuenta();

    } catch (err) {
        console.error('Error cargando cuenta:', err);
        mostrarMsgCuenta('Error de conexión con el servidor.', 'error');
    }
};

window.cerrarModalCuenta = function() {
    const overlay = document.getElementById('cuenta-overlay');
    if (overlay) overlay.classList.remove('open');
};

window.guardarCuenta = async function() {
    const usuarioId = localStorage.getItem('usuario_id') || '';
    const nombre = document.getElementById('cuenta-nombre').value.trim();
    const email = document.getElementById('cuenta-email').value.trim();
    const genero = document.getElementById('cuenta-genero').value;

    if (!nombre || !email) {
        mostrarMsgCuenta('Nombre y correo son obligatorios.', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('usuario_id', usuarioId);
        formData.append('nombre', nombre);
        formData.append('email', email);
        formData.append('genero', genero);

        const res = await fetch(PHP_URL_ACTUALIZAR, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            mostrarMsgCuenta('¡Datos actualizados con éxito!', 'success');

            // Actualizar localStorage y los avatares/nombre visibles en pantalla
            localStorage.setItem('usuario_nombre', nombre);
            document.querySelectorAll('.avatar').forEach(av => {
                av.textContent = nombre.charAt(0).toUpperCase();
            });
            const nombreEl = document.getElementById('dash-nombre');
            if (nombreEl) nombreEl.textContent = nombre;

            setTimeout(() => cerrarModalCuenta(), 1200);
        } else {
            mostrarMsgCuenta(data.message, 'error');
        }

    } catch (err) {
        console.error('Error guardando cuenta:', err);
        mostrarMsgCuenta('Error de conexión con el servidor.', 'error');
    }
};

function mostrarMsgCuenta(texto, tipo) {
    const el = document.getElementById('cuenta-msg');
    if (!el) return;
    el.textContent = texto;
    el.className = 'cuenta-msg cuenta-msg-' + tipo;
    el.style.display = 'block';
}

function ocultarMsgCuenta() {
    const el = document.getElementById('cuenta-msg');
    if (el) el.style.display = 'none';
}