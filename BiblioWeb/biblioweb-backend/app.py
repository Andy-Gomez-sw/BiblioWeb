from flask import Flask, request, jsonify
from flask_cors import CORS
from google.oauth2 import id_token
from google.auth.transport import requests
import pymysql.cursors
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
# Permite que tus páginas HTML de Live Server le envíen datos a la API sin bloqueos
CORS(app) 

# Configuración obligatoria
CLIENT_ID = "688727975714" 
SECRET_KEY = "UNA_CLAVE_SECRETA_Y_LARGA_DE_TU_BACKEND"

# Conexión directa a tu base de datos MySQL (Ajusta con tus credenciales locales o de Hostinger)
def conectar_mysql():
    return pymysql.connect(
        host='localhost', 
        user='tu_usuario_mysql',
        password='tu_password_mysql',
        database='tu_base_datos_biblioweb',
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
    institucion = datos.get('institucion', '')

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

            # 3. Guardar en tu base de datos MySQL
            sql = """
                INSERT INTO usuarios (nombre, email, password, institucion, metodo) 
                VALUES (%s, %s, %s, %s, 'email')
            """
            cursor.execute(sql, (nombre_completo, email, password_encriptada, institucion))
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
    
    if not token_recibido:
        return jsonify({"error": "Falta el token de identidad"}), 400
        
    try:
        # 1. Validar la firma e integridad del token con Google
        id_info = id_token.verify_oauth2_token(token_recibido, requests.Request(), CLIENT_ID)
        
        google_id = id_info['sub']
        email = id_info['email']
        nombre = id_info['name']
        avatar = id_info.get('picture', '')
        
        # 2. Buscar o Registrar automáticamente en MySQL
        conexion = conectar_mysql()
        with conexion.cursor() as cursor:
            cursor.execute("SELECT id, nombre FROM usuarios WHERE google_id = %s", (google_id,))
            usuario = cursor.fetchone()
            
            if not usuario:
                # Si es la primera vez que usa Google, se da de alta en MySQL sin formularios extras
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

# Arranque local del servidor en el puerto 5000
if __name__ == '__main__':
    app.run(port=5000, debug=True)