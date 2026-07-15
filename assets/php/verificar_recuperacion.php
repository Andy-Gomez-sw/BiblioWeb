<?php
// ════════════════════════════════════════
//  verificar_recuperacion.php
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

$email = isset($_POST['email']) ? trim($_POST['email']) : '';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(false, 'Ingresa un correo electrónico válido.');
}

$pdo = getDB();

try {
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        // Por seguridad, no confirmamos si el correo existe o no de forma directa
        responder(false, 'No encontramos una cuenta con ese correo.');
    }

    responder(true, 'Cuenta encontrada.');

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}