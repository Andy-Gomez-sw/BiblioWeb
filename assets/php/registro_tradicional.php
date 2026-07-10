<?php
require_once __DIR__ . '/../../../config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── CONEXION A BD ── 
$pdo = getDB();

// Leer datos del formulario
$json = file_get_contents('php://input');
$datos = json_decode($json, true);

$nombre   = $datos['nombre'] ?? null;
$apellido = $datos['apellido'] ?? null;
$email    = $datos['email'] ?? null;
$password = $datos['password'] ?? null;

if (!$nombre || !$apellido || !$email || !$password) {
    echo json_encode(["error" => "Todos los campos marcados con * son obligatorios."]);
    http_response_code(400);
    exit();
}

try {
    // 1. Validar si el correo ya existe
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(["error" => "Este correo electrónico ya está registrado."]);
        http_response_code(409);
        exit();
    }

    // 2. Encriptar la contraseña de forma segura con BCRYPT
    $password_encriptada = password_hash($password, PASSWORD_BCRYPT);
    $nombre_completo = trim($nombre . " " . $apellido);

    // 3. Insertar datos respetando las columnas de tu archivo SQL real
    $sql = "INSERT INTO usuarios (nombre, email, password, avatar_url, metodo) VALUES (?, ?, ?, NULL, 'email')";
    $stmt_insert = $pdo->prepare($sql);
    
    // Aquí pasamos el nombre completo unido para que guarde también el apellido
    $stmt_insert->execute([$nombre_completo, $email, $password_encriptada]);

    $usuario_id = $pdo->lastInsertId();

    echo json_encode([
        "mensaje" => "Usuario registrado con éxito",
        "usuario_id" => $usuario_id,
        "nombre" => $nombre_completo
    ]);
    http_response_code(201);

} catch (Exception $e) {
    echo json_encode(["error" => "Error al procesar el registro: " . $e->getMessage()]);
    http_response_code(500);
}
?>