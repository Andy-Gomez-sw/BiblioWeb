<?php
require_once '../config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// ── CONEXION A BD ──
$pdo = getDB();

$json  = file_get_contents('php://input');
$datos = json_decode($json, true);

$email    = $datos['email']    ?? null;
$password = $datos['password'] ?? null;

if (!$email || !$password) {
    echo json_encode(["error" => "El correo y la contraseña son obligatorios."]);
    http_response_code(400);
    exit();
}

try {
    // ── Buscar usuario por email ──
    $stmt = $pdo->prepare("SELECT id, nombre, genero, password, metodo FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        echo json_encode(["error" => "El correo electrónico no está registrado."]);
        http_response_code(401); exit();
    }

    if ($usuario['metodo'] === 'google' && empty($usuario['password'])) {
        echo json_encode(["error" => "Esta cuenta fue registrada con Google. Por favor, inicia sesión con el botón de Google."]);
        http_response_code(400); exit();
    }

    if (password_verify($password, $usuario['password'])) {
        echo json_encode([
            "mensaje"    => "Inicio de sesión exitoso",
            "usuario_id" => $usuario['id'],
            "nombre"     => $usuario['nombre'],
            "genero"     => $usuario['genero'] ?? ''
        ]);
        http_response_code(200);
    } else {
        echo json_encode(["error" => "La contraseña es incorrecta."]);
        http_response_code(401);
    }

} catch (Exception $e) {
    echo json_encode(["error" => "Error interno: " . $e->getMessage()]);
    http_response_code(500);
}
?>