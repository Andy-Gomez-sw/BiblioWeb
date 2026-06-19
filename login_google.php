<?php
// Permitir que tu frontend se comunique sin bloqueos de CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── CREDENCIALES REALES DE TU BASE DE DATOS EN HOSTINGER ──
$host = 'localhost';
$user = 'u816348338_admin';        
$pass = 'publiWeb0';      
$db   = 'u816348338_biblioweb';     

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["error" => "Error de conexión a la base de datos: " . $e->getMessage()]);
    http_response_code(500);
    exit();
}

// Leer los datos que manda el JavaScript del Frontend
$json = file_get_contents('php://input');
$datos = json_decode($json, true);

$email     = $datos['email'] ?? null;
$nombre    = $datos['nombre'] ?? null;
$avatar    = $datos['avatar'] ?? null;

if (!$email) {
    echo json_encode(["error" => "Falta el correo electrónico obligatorio de Google."]);
    http_response_code(400);
    exit();
}

try {
    // 1. Buscamos al usuario por su email único en tu tabla de MySQL
    $stmt = $pdo->prepare("SELECT id, nombre FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        // 2. Si no existe en MySQL, lo registramos usando las columnas reales de tu SQL
        $sql_insert = "INSERT INTO usuarios (nombre, email, password, avatar_url, metodo) VALUES (?, ?, NULL, ?, 'google')";
        $stmt_insert = $pdo->prepare($sql_insert);
        $stmt_insert->execute([$nombre, $email, $avatar]);

        // Obtener el ID asignado automáticamente por MySQL
        $usuario_id = $pdo->lastInsertId();
        $nombre_usuario = $nombre;
    } else {
        $usuario_id = $usuario['id'];
        $nombre_usuario = $usuario['nombre'];
    }

    // 3. Responder al frontend con éxito para armar la sesión
    echo json_encode([
        "mensaje" => "Usuario autenticado con éxito en MySQL",
        "usuario_id" => $usuario_id,
        "nombre" => $nombre_usuario
    ]);
    http_response_code(200);

} catch (Exception $e) {
    echo json_encode(["error" => "Error al procesar la solicitud en MySQL: " . $e->getMessage()]);
    http_response_code(500);
}
?>