// ════════════════════════════════════════
//  notificaciones.js
// ════════════════════════════════════════

const PHP_URL_REVISAR = 'https://bibliowebb.com.mx/assets/php/revisar_documentos.php';
const PHP_URL_NOTIF = 'https://bibliowebb.com.mx/assets/php/obtener_notificaciones.php';
const PHP_URL_MARCAR = 'https://bibliowebb.com.mx/assets/php/notificaciones_leidas.php';

document.addEventListener('DOMContentLoaded', () => {
    const btnNotif = document.getElementById('btn-notificaciones');
    if (btnNotif) {
        btnNotif.addEventListener('click', abrirModalNotif);
    }

    const overlay = document.getElementById('notif-overlay');
    if (overlay) {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) cerrarModalNotif();
        });
    }

    // Al cargar la página: revisar documentos pendientes y luego cargar el badge
    revisarYActualizarBadge();
});

async function revisarYActualizarBadge() {
    try {
        await fetch(PHP_URL_REVISAR); // dispara el "examen" automático silenciosamente
    } catch (err) {
        console.error('Error revisando documentos:', err);
    }
    actualizarBadge();
}

async function actualizarBadge() {
    const usuarioId = localStorage.getItem('usuario_id') || '';
    if (!usuarioId) return;

    try {
        const res = await fetch(`${PHP_URL_NOTIF}?usuario_id=${encodeURIComponent(usuarioId)}`);
        const data = await res.json();

        const badge = document.getElementById('notif-badge');
        if (badge) {
            badge.style.display = (data.success && data.no_leidas > 0) ? 'block' : 'none';
        }
    } catch (err) {
        console.error('Error cargando notificaciones:', err);
    }
}

window.abrirModalNotif = async function() {
    const overlay = document.getElementById('notif-overlay');
    if (!overlay) return;

    overlay.classList.add('open');

    const usuarioId = localStorage.getItem('usuario_id') || '';
    const lista = document.getElementById('notif-lista');

    if (!usuarioId) {
        lista.innerHTML = '<p style="color:#c0392b;font-size:13px">No se detectó tu sesión.</p>';
        return;
    }

    lista.innerHTML = '<p style="color:#8b7560;font-size:13px;text-align:center">Cargando...</p>';

    try {
        const res = await fetch(`${PHP_URL_NOTIF}?usuario_id=${encodeURIComponent(usuarioId)}`);
        const data = await res.json();

        if (!data.success || data.notificaciones.length === 0) {
            lista.innerHTML = '<p style="color:#8b7560;font-size:13px;text-align:center">No tienes notificaciones todavía.</p>';
            return;
        }

        lista.innerHTML = data.notificaciones.map(n => `
            <div class="notif-item ${n.leida == 0 ? 'no-leida' : ''}">
                ${n.mensaje}
                <span class="notif-fecha">${formatearFecha(n.creado_en)}</span>
            </div>
        `).join('');

        // Marcar como leídas después de mostrarlas
        const formData = new FormData();
        formData.append('usuario_id', usuarioId);
        await fetch(PHP_URL_MARCAR, { method: 'POST', body: formData });

        const badge = document.getElementById('notif-badge');
        if (badge) badge.style.display = 'none';

    } catch (err) {
        console.error('Error cargando notificaciones:', err);
        lista.innerHTML = '<p style="color:#c0392b;font-size:13px">Error de conexión con el servidor.</p>';
    }
};

window.cerrarModalNotif = function() {
    const overlay = document.getElementById('notif-overlay');
    if (overlay) overlay.classList.remove('open');
};

function formatearFecha(fechaSQL) {
    // MySQL guarda en UTC; le indicamos explícitamente con 'Z' para que
    // el navegador la convierta correctamente a la hora local de México
    const f = new Date(fechaSQL.replace(' ', 'T') + 'Z');
    return f.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Mexico_City'
    });
}