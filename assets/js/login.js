import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({ prompt: 'select_account' });

const API_URL = "https://bibliowebb.com.mx";

function showError(msg) {
    const el = document.getElementById('error-msg');
    if (el) {
        document.getElementById('error-text').textContent = msg;
        el.style.display = 'block';
    }
}
function hideError() {
    const el = document.getElementById('error-msg');
    if (el) el.style.display = 'none';
}

function setLoading(id, on, label) {
    const btn = document.getElementById(id);
    if (btn) {
        btn.classList.toggle('btn-loading', on);
        btn.textContent = on ? 'Cargando...' : label;
    }
}

// ── BOTÓN DE GOOGLE ──
document.getElementById('btn-google').addEventListener('click', async () => {
    hideError();
    setLoading('btn-google', true, 'Continuar con Google');
    try {
        const resultado = await signInWithPopup(auth, provider);
        const user = resultado.user;

        const response = await fetch(`${API_URL}/login_google.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email,
                nombre: user.displayName,
                avatar: user.photoURL
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('usuario_id',     data.usuario_id);
            localStorage.setItem('usuario_nombre', data.nombre);
            localStorage.setItem('usuario_genero', data.genero || ''); // ← nuevo
            localStorage.setItem('token_jwt',      'sesion_activa_php_' + data.usuario_id);
            window.location.href = './dashboard.html';
        } else {
            setLoading('btn-google', false, 'Continuar con Google');
            showError(data.error || 'No se pudo sincronizar el perfil con MySQL.');
        }
    } catch (err) {
        setLoading('btn-google', false, 'Continuar con Google');
        if (err.code !== 'auth/popup-closed-by-user') {
            showError('Error con Google: ' + err.message);
        }
    }
});

// ── LOGIN TRADICIONAL ──
document.getElementById('btn-login').addEventListener('click', async () => {
    hideError();
    const email    = document.getElementById('f-email').value.trim();
    const password = document.getElementById('f-password').value;

    if (!email || !password) {
        showError('Por favor, ingresa tu correo y contraseña.');
        return;
    }

    setLoading('btn-login', true, 'Entrar');

    try {
        const response = await fetch(`${API_URL}/login_tradicional.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('usuario_id',     data.usuario_id);
            localStorage.setItem('usuario_nombre', data.nombre);
            localStorage.setItem('usuario_genero', data.genero || ''); // ← nuevo
            localStorage.setItem('token_jwt',      'sesion_activa_php_' + data.usuario_id);
            window.location.href = './dashboard.html';
        } else {
            setLoading('btn-login', false, 'Entrar');
            showError(data.error || 'Credenciales incorrectas.');
        }
    } catch (err) {
        setLoading('btn-login', false, 'Entrar');
        showError('No se pudo conectar con el servidor de Hostinger.');
    }
});