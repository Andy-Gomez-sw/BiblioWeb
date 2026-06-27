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
    // Limpiar datos de sesión completos
    localStorage.removeItem('token_jwt');
    localStorage.removeItem('usuario_nombre');
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('usuario_genero');
    // Redirigir al login
    window.location.href = './login.html';
});

// ── Sesión ──
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token_jwt');
    const nombreGuardado = localStorage.getItem('usuario_nombre');
    const generoGuardado = localStorage.getItem('usuario_genero'); // Extracción del género persistido en LocalStorage

    if (!token) {
        window.location.href = './login.html';
        return;
    }

    // Inyección dinámica estricta de la concordancia según género
    const elBienvenida = document.getElementById('dash-bienvenida');
    if (elBienvenida) {
        if (generoGuardado && (generoGuardado.toUpperCase() === 'F' || generoGuardado.toLowerCase() === 'mujer')) {
            elBienvenida.textContent = 'Bienvenida,';
        } else {
            // Caso por defecto para masculinos ('M'/'hombre') o nulos sin romper la interfaz estética
            elBienvenida.textContent = 'Bienvenido,';
        }
    }

    if (nombreGuardado) {
        document.getElementById('dash-nombre').textContent = nombreGuardado;
        document.getElementById('dash-avatar').textContent = nombreGuardado.charAt(0).toUpperCase();
    } else {
        document.getElementById('dash-nombre').textContent = 'Usuario Conectado';
        document.getElementById('dash-avatar').textContent = 'U';
    }
});