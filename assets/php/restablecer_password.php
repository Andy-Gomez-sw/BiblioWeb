<?php
// ════════════════════════════════════════
//  restablecer_password.php
// ════════════════════════════════════════

require_once __DIR__ . '/../../../config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function responder(bool $ok, string $msg, array $extra = []): void {
    echo json_encode(array_merge(['success' => $ok, 'message' => $msg], $extra));
    exit;
}

$email          = isset($_POST['email']) ? trim($_POST['email']) : '';
$nombre         = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
$nuevaPassword  = isset($_POST['nueva_password']) ? $_POST['nueva_password'] : '';

if ($email === '' || $nombre === '' || $nuevaPassword === '') {
    responder(false, 'Todos los campos son obligatorios.');
}

if (strlen($nuevaPassword) < 6) {
    responder(false, 'La nueva contraseña debe tener al menos 6 caracteres.');
}

$pdo = getDB();

try {
    $stmt = $pdo->prepare("SELECT id, nombre FROM usuarios WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        responder(false, 'No encontramos una cuenta con ese correo.');
    }

    // Comparación sin distinguir mayúsculas/minúsculas ni espacios extra
    if (mb_strtolower(trim($usuario['nombre'])) !== mb_strtolower($nombre)) {
        responder(false, 'El nombre no coincide con el registrado en esta cuenta.');
    }

    $hashNuevo = password_hash($nuevaPassword, PASSWORD_DEFAULT);

    $update = $pdo->prepare("UPDATE usuarios SET password = :password WHERE id = :id");
    $update->execute([
        ':password' => $hashNuevo,
        ':id'       => $usuario['id']
    ]);

    responder(true, 'Contraseña actualizada correctamente.');

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}