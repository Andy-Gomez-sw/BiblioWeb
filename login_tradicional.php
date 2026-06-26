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

$nombre   = trim($datos['nombre']   ?? '');
$apellido = trim($datos['apellido'] ?? '');
$email    = trim($datos['email']    ?? '');
$password = $datos['password']      ?? '';
$genero   = $datos['genero']        ?? ''; // ← viene del JS (detectarGenero)

if (!$nombre || !$apellido || !$email || !$password) {
    echo json_encode(["error" => "Todos los campos son obligatorios."]);
    http_response_code(400);
    exit();
}

try {
    // ── Verificar si el correo ya existe ──
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(["error" => "Este correo electrónico ya está registrado."]);
        http_response_code(409);
        exit();
    }

    // ── Crear el usuario nuevo ──
    $nombre_completo  = $nombre . ' ' . $apellido;
    $password_hash    = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO usuarios (nombre, genero, email, password, metodo)
        VALUES (?, ?, ?, ?, 'tradicional')
    ");
    $stmt->execute([$nombre_completo, $genero, $email, $password_hash]);

    $nuevo_id = $pdo->lastInsertId();

    echo json_encode([
        "mensaje"    => "Cuenta creada exitosamente.",
        "usuario_id" => $nuevo_id,
        "nombre"     => $nombre_completo,
        "genero"     => $genero   
    ]);
    http_response_code(201);

} catch (Exception $e) {
    echo json_encode(["error" => "Error interno: " . $e->getMessage()]);
    http_response_code(500);
}
?>