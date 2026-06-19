<?php
// Permitir que tu frontend se comunique sin bloqueos de CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Si es una petición OPTIONS (Preflight), responder OK y terminar
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


$host = 'localhost';
$user = 'u816348338_admin';        
$pass = 'TU_CONTRASEÑA_AQUÍ';      
$db   = 'publiWeb0';     

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

$google_id = $datos['google_id'] ?? null;
$email     = $datos['email'] ?? null;
$nombre    = $datos['nombre'] ?? null;
$avatar    = $datos['avatar'] ?? null;

if (!$google_id || !$email) {
    echo json_encode(["error" => "Faltan datos obligatorios del usuario."]);
    http_response_code(400);
    exit();
}

try {
    // 1. Buscar si el usuario ya existe por su google_id
    $stmt = $pdo->prepare("SELECT id, nombre FROM usuarios WHERE google_id = ?");
    $stmt->execute([$google_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        // 2. Si no existe, lo registramos automáticamente respetando las columnas exactas de tu SQL
        $sql_insert = "INSERT INTO usuarios (nombre, email, password, avatar_url, metodo, google_id) VALUES (?, ?, NULL, ?, 'google', ?)";
        $stmt_insert = $pdo->prepare($sql_insert);
        $stmt_insert->execute([$nombre, $email, $avatar, $google_id]);

        // Obtener el ID asignado automáticamente por MySQL
        $usuario_id = $pdo->lastInsertId();
        $nombre_usuario = $nombre;
    } else {
        $usuario_id = $usuario['id'];
        $nombre_usuario = $usuario['nombre'];
    }

    // 3. Responder al frontend con éxito y pasarle el ID del usuario para su sesión
    echo json_encode([
        "mensaje" => "Usuario autenticado con éxito en MySQL",
        "usuario_id" => $usuario_id,
        "nombre" => $nombre_usuario
    ]);
    http_response_code(200);

} catch (Exception $e) {
    echo json_encode(["error" => "Error al procesar la solicitud: " . $e->getMessage()]);
    http_response_code(500);
}
?>