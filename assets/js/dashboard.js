// ── Filtros ──
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

// ── Favoritos ──
document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', e => {
        e.stopPropagation();
        btn.textContent = btn.textContent === '♡' ? '♥' : '♡';
        btn.style.color = btn.textContent === '♥' ? '#c8933a' : '';
    });
});

// ── Modal cerrar sesión ──
const modalLogout = document.getElementById('modal-logout');
const btnCerrar = document.getElementById('btn-cerrar-sesion');
const modalCancelar = document.getElementById('modal-cancelar');
const modalConfirmar = document.getElementById('modal-confirmar');

btnCerrar.addEventListener('click', () => modalLogout.classList.add('open'));
modalCancelar.addEventListener('click', () => modalLogout.classList.remove('open'));
modalLogout.addEventListener('click', e => { if (e.target === modalLogout) modalLogout.classList.remove('open'); });

modalConfirmar.addEventListener('click', () => {
    localStorage.removeItem('token_jwt');
    localStorage.removeItem('usuario_nombre');
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('usuario_genero');
    window.location.href = './login.html';
});

// ── Sesión con Mensaje Neutral ──
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token_jwt');
    const nombreGuardado = localStorage.getItem('usuario_nombre');

    if (!token) {
        window.location.href = './login.html';
        return;
    }

    // Cambia el texto dinámicamente a neutral para todos los usuarios
    const elBienvenida = document.getElementById('dash-bienvenida') || document.querySelector('.welcome-bar div p');
    if (elBienvenida) {
        elBienvenida.textContent = 'Te damos la bienvenida,';
    }

    if (nombreGuardado) {
        document.getElementById('dash-nombre').textContent = nombreGuardado;
        document.getElementById('dash-avatar').textContent = nombreGuardado.charAt(0).toUpperCase();
    } else {
        document.getElementById('dash-nombre').textContent = 'Usuario Conectado';
        document.getElementById('dash-avatar').textContent = 'U';
    }

    cargarEstadisticas();
});

// ── CARGAR ESTADÍSTICAS REALES DESDE LA BASE DE DATOS ──
async function cargarEstadisticas() {
    const usuarioId = localStorage.getItem('usuario_id') || '';
    if (!usuarioId) return;

    try {
        const res = await fetch(`https://bibliowebb.com.mx/obtener_documentos.php?usuario_id=${encodeURIComponent(usuarioId)}`);
        const data = await res.json();

        if (data.success) {
            const subidosEl = document.getElementById('dash-subidos');
            if (subidosEl) subidosEl.textContent = data.documentos.length;
        }
    } catch (err) {
        console.error('Error cargando estadísticas:', err);
    }
}