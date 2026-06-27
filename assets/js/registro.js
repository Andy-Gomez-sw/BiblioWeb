import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({ prompt: 'select_account' });

const API_URL = "https://bibliowebb.com.mx";

// ════════════════════════════════════════
//  DETECTAR GÉNERO POR NOMBRE (Para flujo de Google)
// ════════════════════════════════════════
const NOMBRES_FEMENINOS = [
    'isabel','pilar','mercedes','trinidad','luz','sol','flor','mar',
    'ruth','judith','raquel','esther','noemi','belen','eden'
];
const NOMBRES_MASCULINOS = [
    'luca','nicola','josue','elia','garcia','bautista','nahua',
    'ezra','noah','eliot','adrian','fabian','sebastian','matias',
    'tobias','elias','zacarías','isaias'
];

function detectarGenero(nombre) {
    const n = nombre.trim().toLowerCase().split(' ')[0]; // solo primer nombre
    if (NOMBRES_MASCULINOS.includes(n)) return 'M';
    if (NOMBRES_FEMENINOS.includes(n))  return 'F';
    // Regla general: termina en 'a' → femenino
    return n.endsWith('a') ? 'F' : 'M';
}

// ════════════════════════════════════════
//  HELPERS UI
// ════════════════════════════════════════
function showError(msg) {
    const el = document.getElementById('error-msg');
    if (el) {
        document.getElementById('error-text').textContent = msg;
        el.style.display = 'block';
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        alert(msg);
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

document.getElementById('btn-go-dashboard').addEventListener('click', () => {
    window.location.href = './dashboard.html';
});

// ════════════════════════════════════════
//  RETORNO DE GOOGLE (REDIRECT)
// ════════════════════════════════════════
window.addEventListener('load', async () => {
    try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
            setLoading('btn-google', true, 'Validando datos...');
            const user   = result.user;
            const genero = detectarGenero(user.displayName || '');

            const response = await fetch(`${API_URL}/login_google.php`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    google_id: user.uid,
                    email:     user.email,
                    nombre:    user.displayName,
                    avatar:    user.photoURL,
                    genero:    genero           // ← Enviamos el género detectado automáticamente
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('usuario_id',     data.usuario_id);
                localStorage.setItem('usuario_nombre', data.nombre);
                localStorage.setItem('usuario_genero', data.genero || genero); // ← Guardamos con éxito
                localStorage.setItem('token_jwt',      'sesion_activa_php_' + data.usuario_id);

                const finalGen = data.genero || genero;
                const saludo = (finalGen === 'F' || finalGen === 'mujer') ? 'Bienvenida' : 'Bienvenido';
                document.getElementById('success-msg-text').textContent =
                    `¡${saludo}, ${data.nombre}! Tu cuenta ha sido validada con éxito con Google.`;
                document.getElementById('success-overlay').classList.add('show');
            } else {
                setLoading('btn-google', false, 'Registrarse con Google');
                showError(data.error || 'No se pudo sincronizar el perfil con la base de datos.');
            }
        }
    } catch (err) {
        console.error("Error en redirección de registro:", err);
        showError('Error de autenticación: ' + err.message);
    }
});

// ── Botón Google ──
document.getElementById('btn-google').addEventListener('click', async () => {
    hideError();
    setLoading('btn-google', true, 'Abriendo Google...');
    await signInWithRedirect(auth, provider);
});

// ════════════════════════════════════════
//  INDICADOR DE FORTALEZA DE CONTRASEÑA
// ════════════════════════════════════════
window.checkStrength = function (val) {
    const fill  = document.getElementById('strength-fill');
    const label = document.getElementById('strength-label');
    if (!fill || !label) return;

    let score = 0;
    if (val.length >= 8)          score++;
    if (/[A-Z]/.test(val))        score++;
    if (/[0-9]/.test(val))        score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = [
        { w: '0%',   c: 'var(--cream-300)', t: '' },
        { w: '25%',  c: '#e74c3c',          t: 'Muy débil' },
        { w: '50%',  c: 'var(--amber)',      t: 'Moderada' },
        { w: '75%',  c: '#f1c40f',          t: 'Buena' },
        { w: '100%', c: '#27ae60',          t: 'Muy segura' },
    ];
    fill.style.width      = levels[score].w;
    fill.style.background = levels[score].c;
    label.textContent     = levels[score].t;
};

// ════════════════════════════════════════
//  REGISTRO TRADICIONAL
// ════════════════════════════════════════
document.getElementById('btn-register').addEventListener('click', async () => {
    hideError();
    const nombre   = document.getElementById('r-nombre').value.trim();
    const apellido = document.getElementById('r-apellido').value.trim();
    const email    = document.getElementById('r-email').value.trim();
    const password = document.getElementById('r-password').value;
    const confirm  = document.getElementById('r-confirm').value;
    const terms    = document.getElementById('r-terms').checked;

    // CAPTURA DEL SELECT MANUAL DEL HTML:
    const elGenero = document.getElementById('r-genero');
    const genero   = elGenero ? elGenero.value : 'M';

    if (!nombre || !apellido) { showError('Por favor ingresa tu nombre y apellido.'); return; }
    if (!email)               { showError('El correo electrónico es obligatorio.');   return; }
    if (password.length < 8)  { showError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirm) { showError('Las contraseñas no coinciden.');           return; }
    if (!terms)               { showError('Debes aceptar los términos de uso.');       return; }

    setLoading('btn-register', true, 'Crear mi cuenta');

    try {
        const response = await fetch(`${API_URL}/registro_tradicional.php`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre,
                apellido,
                email,
                password,
                genero      // ← Enviamos el género capturado manualmente por el select
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('usuario_id',     data.usuario_id);
            localStorage.setItem('usuario_nombre', data.nombre);
            localStorage.setItem('usuario_genero', data.genero || genero); // ← Guardamos la opción explícita
            localStorage.setItem('token_jwt',      'sesion_activa_php_' + data.usuario_id);

            const finalGen = data.genero || genero;
            const saludo = (finalGen === 'F' || finalGen === 'mujer') ? 'Bienvenida' : 'Bienvenido';
            
            // Mensaje del modal corregido dinámicamente con concordancia:
            document.getElementById('success-msg-text').textContent =
                `¡${saludo}, ${data.nombre}! Tu cuenta ha sido registrada en el sistema. Ya puedes explorar la colección.`;
            document.getElementById('success-overlay').classList.add('show');
        } else {
            setLoading('btn-register', false, 'Crear mi cuenta');
            showError(data.error || 'No se pudo crear la cuenta en el servidor.');
        }

    } catch (err) {
        setLoading('btn-register', false, 'Crear mi cuenta');
        showError('No se pudo conectar con el servidor de Hostinger. Intenta más tarde.');
    }
});