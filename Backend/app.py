from flask import Flask, request, jsonify
from flask_cors import CORS
from google.oauth2 import id_token
from google.auth.transport import requests
import pymysql.cursors
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
# Permite la comunicación limpia con tus páginas HTML de Live Server sin bloqueos de seguridad
CORS(app) 

# Configuración obligatoria del ecosistema
CLIENT_ID = "688727975714-8cnuutrc8mnhavhsu99d62uc5phve1rv.apps.googleusercontent.com" 
SECRET_KEY = "UNA_CLAVE_SECRETA_Y_LARGA_DE_TU_BACKEND"

# Conexión directa a tu base de datos local MySQL
def conectar_mysql():
    return pymysql.connect(
        host='localhost', 
        user='root',
        password='',
        database='biblioweb',
        cursorclass=pymysql.cursors.DictCursor
    )

# =====================================================================
# ENDPOINT 1: REGISTRO DE CUENTA NUEVA (TRADICIONAL CORREO/CONTRASEÑA)
# =====================================================================
@app.route('/api/auth/register', methods=['POST'])
def registro_tradicional():
    datos = request.get_json()
    nombre = datos.get('nombre')
    apellido = datos.get('apellido')
    email = datos.get('email')
    password = datos.get('password')

    if not nombre or not apellido or not email or not password:
        return jsonify({"error": "Todos los campos marcados con * son obligatorios"}), 400

    try:
        conexion = conectar_mysql()
        with conexion.cursor() as cursor:
            # 1. Validar que el correo no esté ocupado
            cursor.execute("SELECT id FROM usuarios WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({"error": "Este correo electrónico ya está registrado."}), 409

            # 2. Encriptar la contraseña de forma segura
            password_encriptada = generate_password_hash(password)
            nombre_completo = f"{nombre} {apellido}"

            # 3. Guardar en tu base de datos MySQL (Estructura limpia y unificada)
            sql = """
                INSERT INTO usuarios (nombre, email, password, google_id, avatar_url, metodo) 
                VALUES (%s, %s, %s, NULL, NULL, 'email')
            """
            cursor.execute(sql, (nombre_completo, email, password_encriptada))
            conexion.commit()

            # Obtener el ID asignado automáticamente por MySQL
            cursor.execute("SELECT id FROM usuarios WHERE email = %s", (email,))
            nuevo_usuario = cursor.fetchone()

        conexion.close()

        # 4. Iniciar sesión automática emitiendo su JWT de acceso local
        token_jwt = jwt.encode({
            'usuario_id': nuevo_usuario['id'],
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        }, SECRET_KEY, algorithm="HS256")

        return jsonify({"token": token_jwt, "nombre": nombre_completo}), 201

    except Exception as e:
        return jsonify({"error": f"Error al procesar el registro en MySQL: {str(e)}"}), 500


# =====================================================================
# ENDPOINT 2: INICIO DE SESIÓN TRADICIONAL (CORREO/CONTRASEÑA)
# =====================================================================
@app.route('/api/auth/login', methods=['POST'])
def login_tradicional():
    datos = request.get_json()
    email = datos.get('email')
    password = datos.get('password')

    if not email or not password:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    try:
        conexion = conectar_mysql()
        with conexion.cursor() as cursor:
            # Buscar al usuario por correo que se haya registrado bajo el método tradicional
            cursor.execute("SELECT id, nombre, password FROM usuarios WHERE email = %s AND metodo = 'email'", (email,))
            usuario = cursor.fetchone()
            
            # Validar existencia y comparar los hashes de la contraseña
            if not usuario or not check_password_hash(usuario['password'], password):
                return jsonify({"error": "Correo o contraseña incorrectos"}), 401
                
        conexion.close()

        # Generar Token JWT propio para mantener la sesión
        token_jwt = jwt.encode({
            'usuario_id': usuario['id'],
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        }, SECRET_KEY, algorithm="HS256")

        return jsonify({"token": token_jwt, "nombre": usuario['nombre']}), 200

    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500


# =====================================================================
# ENDPOINT 3: ACCESO UNIFICADO CON LA API DE GOOGLE AUTH
# =====================================================================
@app.route('/api/auth/google', methods=['POST'])
def login_google():
    datos = request.get_json()
    token_recibido = datos.get('token')
    nombre_frontend = datos.get('nombre') # Captura el nombre enviado por el Frontend
    
    if not token_recibido:
        return jsonify({"error": "Falta el token de identidad"}), 400
        
    try:
        # 1. Validar la firma e integridad del token con Google
        id_info = id_token.verify_oauth2_token(token_recibido, requests.Request(), CLIENT_ID)
        
        google_id = id_info['sub']
        email = id_info['email']
        
        # Prioriza el displayName del Frontend, si no existe usa la metadata del token
        nombre = nombre_frontend or id_info.get('name', id_info.get('given_name', email.split('@')[0]))
        avatar = id_info.get('picture', '')
        
        # 2. Buscar o Registrar automáticamente en MySQL
        conexion = conectar_mysql()
        with conexion.cursor() as cursor:
            cursor.execute("SELECT id, nombre FROM usuarios WHERE google_id = %s", (google_id,))
            usuario = cursor.fetchone()
            
            if not usuario:
                # Si es la primera vez que usa Google, se guarda con el nombre correcto
                sql_insert = "INSERT INTO usuarios (google_id, nombre, email, avatar_url, metodo) VALUES (%s, %s, %s, %s, 'google')"
                cursor.execute(sql_insert, (google_id, nombre, email, avatar))
                conexion.commit()
                
                cursor.execute("SELECT id, nombre FROM usuarios WHERE google_id = %s", (google_id,))
                usuario = cursor.fetchone()
                
        conexion.close()
        
        # 3. Emitir el JWT de sesión local
        token_jwt = jwt.encode({
            'usuario_id': usuario['id'],
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        }, SECRET_KEY, algorithm="HS256")
        
        return jsonify({"token": token_jwt, "nombre": usuario['nombre']}), 200
        
    except ValueError:
        return jsonify({"error": "Token de Google inválido o expirado"}), 401
    except Exception as e:
        return jsonify({"error": f"Error de base de datos MySQL: {str(e)}"}), 500


# =====================================================================
# ENDPOINT 4: DATOS DINÁMICOS Y CONTADORES REALES PARA EL DASHBOARD
# =====================================================================
@app.route('/api/usuario/dashboard', methods=['GET'])
def obtener_datos_dashboard():
    # 1. Leer la cabecera de autorización enviada por el Frontend
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Acceso no autorizado. Inicia sesión nuevamente."}), 401
        
    token = auth_header.split(" ")[1]
    
    try:
        # 2. Desencriptar el Token JWT para extraer de manera segura el usuario_id
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        usuario_id = payload['usuario_id']
        
        conexion = conectar_mysql()
        with conexion.cursor() as cursor:
            # A. Obtener el nombre registrado en la cuenta
            cursor.execute("SELECT nombre FROM usuarios WHERE id = %s", (usuario_id,))
            usuario = cursor.fetchone()
            if not usuario:
                return jsonify({"error": "El usuario especificado ya no existe."}), 404
                
            # B. Contar los documentos que ha subido el usuario
            cursor.execute("SELECT COUNT(*) as total FROM documentos WHERE usuario_id = %s", (usuario_id,))
            subidos = cursor.fetchone()['total']
            
            # C. Contar cuántos documentos ha añadido a sus favoritos
            cursor.execute("SELECT COUNT(*) as total FROM favoritos WHERE usuario_id = %s", (usuario_id,))
            favoritos = cursor.fetchone()['total']
            
            # D. Contar los registros en el historial de lecturas recientes
            cursor.execute("SELECT COUNT(*) as total FROM historial_consultas WHERE usuario_id = %s", (usuario_id,))
            consultados = cursor.fetchone()['total']
            
        conexion.close()
        
        # 3. Retornar los conteos de la base de datos relacional
        return jsonify({
            "nombre": usuario['nombre'],
            "subidos": subidos,
            "favoritos": favoritos,
            "consultados": consultados
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "La sesión de usuario ha expirado."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token de seguridad alterado o corrupto."}), 401
    except Exception as e:
        return jsonify({"error": f"Error interno en los contadores del servidor: {str(e)}"}), 500


# Arranque del servidor local
if __name__ == '__main__':
    app.run(port=5000, debug=True)