<?php
// ════════════════════════════════════════
//  obtener_notificaciones.php
// ════════════════════════════════════════

require_once __DIR__ . '/../../config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

$usuario_id = isset($_GET['usuario_id']) ? (int) $_GET['usuario_id'] : 0;
if ($usuario_id <= 0) {
    responder(false, 'Error: Sesión de usuario inválida.');
}

$pdo = getDB();

try {
    $stmt = $pdo->prepare("
        SELECT id, documento_id, mensaje, leida, creado_en
        FROM notificaciones
        WHERE usuario_id = :uid
        ORDER BY creado_en DESC
        LIMIT 20
    ");
    $stmt->execute([':uid' => $usuario_id]);
    $notificaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $noLeidas = count(array_filter($notificaciones, fn($n) => (int)$n['leida'] === 0));

    responder(true, 'OK', [
        'notificaciones' => $notificaciones,
        'no_leidas' => $noLeidas
    ]);

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}