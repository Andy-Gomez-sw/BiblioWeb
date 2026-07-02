<?php
// ════════════════════════════════════════
//  actualizar_usuario.php
// ════════════════════════════════════════

require_once __DIR__ . '/../config.php';

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

$usuario_id = isset($_POST['usuario_id']) ? (int) $_POST['usuario_id'] : 0;
if ($usuario_id <= 0) {
    responder(false, 'Error: Sesión de usuario inválida.');
}

$nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
$email  = isset($_POST['email']) ? trim($_POST['email']) : '';
$genero = isset($_POST['genero']) ? trim($_POST['genero']) : '';

if ($nombre === '' || $email === '') {
    responder(false, 'El nombre y correo son obligatorios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(false, 'El correo electrónico no es válido.');
}

$pdo = getDB();

try {
    // Verificar que el nuevo correo no esté en uso por OTRO usuario
    $check = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email AND id != :id");
    $check->execute([':email' => $email, ':id' => $usuario_id]);
    if ($check->fetch()) {
        responder(false, 'Ese correo ya está en uso por otra cuenta.');
    }

    $sql = "UPDATE usuarios SET nombre = :nombre, email = :email, genero = :genero WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nombre' => $nombre,
        ':email'  => $email,
        ':genero' => $genero,
        ':id'     => $usuario_id
    ]);

    responder(true, 'Datos actualizados correctamente.', [
        'nombre' => $nombre,
        'email'  => $email,
        'genero' => $genero
    ]);

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}