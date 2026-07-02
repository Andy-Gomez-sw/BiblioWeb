// ════════════════════════════════════════
//  cuenta.js 
// ════════════════════════════════════════

const PHP_URL_USUARIO = 'https://bibliowebb.com.mx/obtener_usuario.php';
const PHP_URL_ACTUALIZAR = 'https://bibliowebb.com.mx/actualizar_usuario.php';

let datosUsuarioActual = null;

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.avatar').forEach(av => {
        av.style.cursor = 'pointer';
        av.addEventListener('click', abrirModalCuenta);
    });

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
    mostrarVistaLectura();
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

        datosUsuarioActual = data.usuario;
        pintarVistaLectura(datosUsuarioActual);
        ocultarMsgCuenta();

    } catch (err) {
        console.error('Error cargando cuenta:', err);
        mostrarMsgCuenta('Error de conexión con el servidor.', 'error');
    }
};

function pintarVistaLectura(u) {
    const generoTexto = { M: 'Masculino', F: 'Femenino', O: 'Otro' };

    document.getElementById('cuenta-avatar-lg').textContent = (u.nombre || 'U').charAt(0).toUpperCase();
    document.getElementById('ver-nombre').textContent = u.nombre || '—';
    document.getElementById('ver-email').textContent = u.email || '—';
    document.getElementById('ver-genero').textContent = generoTexto[u.genero] || '—';
}

window.activarEdicion = function() {
    if (!datosUsuarioActual) return;

    document.getElementById('cuenta-nombre').value = datosUsuarioActual.nombre || '';
    document.getElementById('cuenta-email').value = datosUsuarioActual.email || '';
    document.getElementById('cuenta-genero').value = datosUsuarioActual.genero || 'M';

    document.getElementById('cuenta-vista').style.display = 'none';
    document.getElementById('cuenta-edicion').style.display = 'block';
    ocultarMsgCuenta();
};

window.cancelarEdicion = function() {
    mostrarVistaLectura();
};

function mostrarVistaLectura() {
    document.getElementById('cuenta-vista').style.display = 'block';
    document.getElementById('cuenta-edicion').style.display = 'none';
    ocultarMsgCuenta();
}

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

            datosUsuarioActual = { ...datosUsuarioActual, nombre, email, genero };
            pintarVistaLectura(datosUsuarioActual);

            localStorage.setItem('usuario_nombre', nombre);
            document.querySelectorAll('.avatar').forEach(av => {
                av.textContent = nombre.charAt(0).toUpperCase();
            });
            const nombreEl = document.getElementById('dash-nombre');
            if (nombreEl) nombreEl.textContent = nombre;

            setTimeout(() => mostrarVistaLectura(), 1000);
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